/**
 * Exportar las respuestas a Excel (.xlsx) o CSV.
 *
 * Igual que el PDF, se arma en el navegador con lo que ya esta en pantalla
 * (respetando el filtro por fecha). La libreria de Excel se carga solo al
 * pulsar el boton, para no sumar su peso a la aplicacion entera.
 *
 * Una fila por respuesta y una columna por dato: fecha, datos del
 * respondedor y cada pregunta. Asi se puede filtrar, ordenar y cruzar en
 * Excel sin retocar nada. Las escalas y los numeros van como numero, no como
 * texto, para que las formulas (PROMEDIO, SUMA...) funcionen directamente.
 */

import {
  answerText, average, chartQuestion, isAnswered, isChartable, npsScore, TYPE_LABELS,
} from "./questionTypes";

const NUMERIC_TYPES = ["rating", "nps", "number"];

/** Nombre de archivo sin caracteres que Windows no acepta. */
function fileName(form, extension) {
  const base = (form.title || "formulario")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 60) || "formulario";

  const today = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  return `${base}_respuestas_${stamp}.${extension}`;
}

/**
 * Columnas de los datos del respondedor: los campos actuales y, al final,
 * los que se quitaron del formulario pero siguen en respuestas viejas.
 */
function respondentColumns(form, responses) {
  const fields = form.introFields || [];
  const known = new Set(fields.map((f) => f.id));
  const orphans = [];

  for (const r of responses) {
    for (const key of Object.keys(r.respondent || {})) {
      if (!known.has(key) && !orphans.includes(key)) orphans.push(key);
    }
  }

  return [
    ...fields.map((f) => ({ key: f.id, label: f.label || "Campo" })),
    ...orphans.map((key) => ({ key, label: "Campo eliminado" })),
  ];
}

/**
 * Tabla comun a los dos formatos. Cada celda es { kind, value } para que
 * cada formato decida como escribirla.
 */
function buildTable(form, responses) {
  const respondent = respondentColumns(form, responses);
  const questions = form.questions;

  const header = [
    "#",
    "Fecha de envio",
    ...respondent.map((c) => c.label),
    ...questions.map((q, i) => `${i + 1}. ${q.title || "Pregunta sin titulo"}`),
  ];

  // La mas antigua primero: es como se lee una hoja de calculo.
  const ordered = [...responses].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  );

  const rows = ordered.map((r, index) => [
    { kind: "number", value: index + 1 },
    { kind: "datetime", value: new Date(r.submittedAt) },
    ...respondent.map((c) => ({ kind: "text", value: r.respondent?.[c.key] ?? "" })),
    ...questions.map((q) => {
      const value = r.answers?.[q.id];
      if (!isAnswered(value)) return { kind: "text", value: "" };

      if (NUMERIC_TYPES.includes(q.type) && Number.isFinite(Number(value))) {
        return { kind: "number", value: Number(value) };
      }
      if (q.type === "date") return { kind: "date", value: value.toString() };

      return { kind: "text", value: answerText(q, value) };
    }),
  ]);

  return { header, rows };
}

/** Conteo por opcion o por valor de la escala, para la hoja Resumen. */
function summaryRows(form, responses) {
  const rows = [];

  form.questions.forEach((original, i) => {
    const title = `${i + 1}. ${original.title || "Pregunta sin titulo"}`;
    const type = TYPE_LABELS[original.type] ?? original.type;
    const answered = responses.filter((r) => isAnswered(r.answers?.[original.id])).length;

    if (isChartable(original.type)) {
      const question = chartQuestion(original);
      const counts = Object.fromEntries(question.options.map((o) => [o.id, 0]));

      for (const r of responses) {
        const value = r.answers?.[question.id];
        if (!isAnswered(value)) continue;
        for (const id of Array.isArray(value) ? value : [String(value)]) {
          if (counts[id] !== undefined) counts[id] += 1;
        }
      }

      const total = Object.values(counts).reduce((a, b) => a + b, 0);

      question.options.forEach((o, j) => {
        rows.push([
          j === 0 ? title : "",
          j === 0 ? type : "",
          o.text || "(sin texto)",
          counts[o.id],
          total > 0 ? counts[o.id] / total : 0,
        ]);
      });
    } else {
      rows.push([title, type, "Respuestas", answered, null]);
    }

    if (original.type === "rating" || original.type === "number" || original.type === "nps") {
      const avg = average(original, responses);
      if (avg !== null) rows.push(["", "", "Promedio", Math.round(avg * 100) / 100, null]);
    }

    if (original.type === "nps") {
      const nps = npsScore(original, responses);
      if (nps) rows.push(["", "", "NPS (promotores - detractores)", nps.score, null]);
    }
  });

  return rows;
}

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadResultsXlsx(form, responses) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const { header, rows } = buildTable(form, responses);

  const headerStyle = { fontWeight: "bold", backgroundColor: "#F0F0F4", wrap: true, alignVertical: "top" };

  const data = [
    header.map((value) => ({ value, ...headerStyle })),
    ...rows.map((row) => row.map((cell) => {
      if (cell.value === "" || cell.value === null) return null;
      if (cell.kind === "number") return { value: cell.value, type: Number };
      if (cell.kind === "datetime") {
        // La libreria escribe la hora en UTC; se corre a la hora local para
        // que la celda diga lo mismo que la pantalla de resultados.
        const local = new Date(cell.value.getTime() - cell.value.getTimezoneOffset() * 60000);
        return { value: local, type: Date, format: "dd/mm/yyyy hh:mm" };
      }
      if (cell.kind === "date") {
        // yyyy-mm-dd de la respuesta, como fecha de Excel y sin corrimiento por zona horaria.
        const [y, m, d] = cell.value.split("-").map(Number);
        return { value: new Date(Date.UTC(y, m - 1, d)), type: Date, format: "dd/mm/yyyy" };
      }
      // "@": que Excel no convierta en numero o fecha un texto como "0412-1234567".
      return { value: String(cell.value), type: String, format: "@", wrap: true, alignVertical: "top" };
    })),
  ];

  const columns = header.map((_, i) => ({ width: i === 0 ? 6 : i === 1 ? 18 : 28 }));

  const summary = [
    ["Pregunta", "Tipo", "Opcion / dato", "Cantidad", "% del total"].map((value) => ({ value, ...headerStyle })),
    ...summaryRows(form, responses).map(([question, type, label, count, percent]) => [
      question ? { value: question, fontWeight: "bold", wrap: true, alignVertical: "top" } : null,
      type ? { value: type } : null,
      { value: label, type: String },
      count === null ? null : { value: count, type: Number },
      percent === null ? null : { value: percent, type: Number, format: "0%" },
    ]),
  ];

  const blob = await writeXlsxFile([
    { data, sheet: "Respuestas", columns, stickyRowsCount: 1 },
    {
      data: summary,
      sheet: "Resumen",
      columns: [{ width: 48 }, { width: 18 }, { width: 32 }, { width: 10 }, { width: 12 }],
      stickyRowsCount: 1,
    },
  ]).toBlob();

  saveBlob(blob, fileName(form, "xlsx"));
}

/**
 * CSV separado por punto y coma, con BOM: es lo que Excel en espanol abre
 * directo con doble clic, con tildes y cada dato en su columna.
 */
export function downloadResultsCsv(form, responses) {
  const { header, rows } = buildTable(form, responses);
  const pad = (n) => String(n).padStart(2, "0");

  const toText = (cell) => {
    if (cell.kind === "datetime") {
      const d = cell.value;
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    // Con punto y coma como separador, Excel en espanol espera la coma decimal.
    if (cell.kind === "number") return String(cell.value).replace(".", ",");
    return String(cell.value ?? "");
  };

  const escape = (text) => (/[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text);

  const lines = [
    header.map(escape).join(";"),
    ...rows.map((row) => row.map((cell) => escape(toText(cell))).join(";")),
  ];

  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  saveBlob(blob, fileName(form, "csv"));
}
