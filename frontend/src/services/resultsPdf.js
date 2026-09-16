/**
 * Informe en PDF con todas las respuestas de un formulario.
 *
 * Se genera en el navegador con jsPDF: no pasa por el servidor, asi que el
 * informe muestra exactamente lo que el usuario ya tiene cargado en pantalla.
 * La libreria se carga solo al pulsar "Descargar" (import dinamico), para no
 * sumar su peso a la aplicacion entera.
 *
 * El resumen reproduce la pestana Resumen: las mismas tarjetas de cifras, la
 * dona de las preguntas de opcion unica, las barras de las de opcion multiple
 * y la lista de respuestas escritas, con los mismos colores y porcentajes.
 * Despues va el detalle de cada respuesta en tabla.
 */

import { CHART_COLORS } from "../styles/chartColors";
import logoUrl from "../assets/logoiescogroup.png";

const TYPE_LABELS = {
  short_text: "Texto corto",
  long_text: "Texto largo",
  single_choice: "Opcion unica",
  multiple_choice: "Opcion multiple",
};

const hex = (value) => [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16));

// Los mismos tonos del tema claro de la aplicacion.
const TEXT = hex("#191919");
const MUTED = hex("#9E9EA7");
const SECONDARY = hex("#6B6B76");
const BORDER = hex("#E8E8ED");
const SURFACE_ALT = hex("#F4F4F6");
const PRIMARY_LIGHT = hex("#F0F0F4");
const WHITE = [255, 255, 255];

const TONES = {
  primary: { fg: hex("#191919"), bg: hex("#F0F0F4") },
  success: { fg: hex("#2DB87F"), bg: hex("#EAFAF3") },
  warning: { fg: hex("#F5A623"), bg: hex("#FFF8EC") },
  danger: { fg: hex("#E34850"), bg: hex("#FEF0F0") },
};

const MARGIN = 16;
const CARD_PAD = 7;

// Encabezado: alto en la primera pagina y en las demas, y donde empieza el
// contenido debajo de el.
const FIRST_HEADER = 36;
const PAGE_HEADER = 16;
const TOP = PAGE_HEADER + 10;

/**
 * El logo (blanco sobre transparente, 947x1037) reducido antes de meterlo en
 * el PDF: a tamano original pesaria lo mismo en cada informe sin verse mejor.
 */
async function loadLogo() {
  const image = new Image();
  image.src = logoUrl;
  await image.decode();

  const height = 160;
  const width = Math.round((image.naturalWidth / image.naturalHeight) * height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(image, 0, 0, width, height);

  return { data: canvas.toDataURL("image/png"), ratio: width / height };
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function isAnswered(value) {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  return value.toString().trim() !== "";
}

/** Texto legible de una respuesta: los ids de opcion pasan a su texto. */
function answerText(question, value) {
  if (!isAnswered(value)) return "—";

  if (question.type === "single_choice" || question.type === "multiple_choice") {
    const byId = Object.fromEntries(question.options.map((o) => [o.id, o.text]));
    const ids = Array.isArray(value) ? value : [value];
    return ids.map((id) => byId[id] ?? "(opcion eliminada)").join("; ");
  }

  return value.toString();
}

/**
 * Conteo por opcion, calculado igual que en la pantalla: el porcentaje es
 * sobre el total de opciones elegidas.
 */
function choiceStats(question, responses) {
  const counts = Object.fromEntries(question.options.map((o) => [o.id, 0]));

  for (const r of responses) {
    const value = r.answers?.[question.id];
    if (!value) continue;
    for (const id of Array.isArray(value) ? value : [value]) {
      if (counts[id] !== undefined) counts[id] += 1;
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return {
    total,
    items: question.options.map((o, i) => ({
      label: o.text || "(sin texto)",
      count: counts[o.id],
      percent: Math.round((counts[o.id] / (total || 1)) * 100),
      color: hex(CHART_COLORS[i % CHART_COLORS.length]),
    })),
  };
}

/** Datos de quien respondio (pantalla de datos), con su etiqueta. */
function respondentRows(form, response) {
  const data = response.respondent || {};
  const rows = [];

  for (const field of form.introFields || []) {
    if (isAnswered(data[field.id])) rows.push([field.label || "Dato", data[field.id]]);
  }
  if (isAnswered(data.name)) rows.push(["Nombre", data.name]);
  if (isAnswered(data.email)) rows.push(["Correo", data.email]);

  return rows;
}

function respondentName(form, response) {
  const data = response.respondent || {};
  if (data.name) return data.name;
  const nameField = form.introFields?.find((f) => f.type === "name");
  if (nameField && data[nameField.id]) return data[nameField.id];
  return "Anonimo";
}

function safeFileName(text) {
  return (text || "formulario")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 60) || "formulario";
}

export async function downloadResultsPdf(form, responses) {
  const [{ jsPDF }, { autoTable }, logo] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    // Sin logo el informe se genera igual: no vale la pena fallar por eso.
    loadLogo().catch(() => null),
  ]);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  const bottomLimit = pageHeight - MARGIN - 8;
  const usableHeight = bottomLimit - TOP;

  let y = TOP;

  const ensureSpace = (needed) => {
    if (y + needed > bottomLimit) {
      doc.addPage();
      y = TOP;
    }
  };

  const font = (size, style = "normal", color = TEXT) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  /** Recorta con "..." para que el texto quepa en el ancho dado. */
  const fit = (text, width) => {
    const value = String(text);
    if (doc.getTextWidth(value) <= width) return value;
    let cut = value;
    while (cut.length > 1 && doc.getTextWidth(`${cut}...`) > width) cut = cut.slice(0, -1);
    return `${cut.trimEnd()}...`;
  };

  /** Un tramo de la dona: anillo entre dos angulos, en sentido horario. */
  const ringSegment = (cx, cy, outer, inner, from, to, color) => {
    const steps = Math.max(2, Math.ceil(((to - from) * 180) / Math.PI / 2));
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const a = from + ((to - from) * i) / steps;
      points.push([cx + outer * Math.cos(a), cy + outer * Math.sin(a)]);
    }
    for (let i = steps; i >= 0; i--) {
      const a = from + ((to - from) * i) / steps;
      points.push([cx + inner * Math.cos(a), cy + inner * Math.sin(a)]);
    }
    const relative = points.slice(1).map((p, i) => [p[0] - points[i][0], p[1] - points[i][1]]);
    doc.setFillColor(...color);
    doc.lines(relative, points[0][0], points[0][1], [1, 1], "F", true);
  };

  const sectionTitle = (text) => {
    ensureSpace(16);
    font(14, "bold");
    doc.text(text, MARGIN, y);
    y += 9;
  };

  const total = responses.length;
  const answeredAny = responses.filter((r) => Object.values(r.answers || {}).some(isAnswered)).length;
  const completion = total ? Math.round((answeredAny / total) * 100) : 0;

  // --- Encabezado de la primera pagina --------------------------------------
  // Las demas llevan uno mas pequeno, que se dibuja al final junto al pie.

  const generatedAt = formatDateTime(new Date().toISOString());

  // Siempre el dueno del formulario, nunca quien descarga el informe: un
  // administrador o alguien con quien se compartio puede descargarlo, pero el
  // informe sigue siendo de quien lo creo. El nombre lo pone el servidor.
  const createdBy = form.ownerName || "Sin dueno asignado";

  doc.setFillColor(...TEXT);
  doc.rect(0, 0, pageWidth, FIRST_HEADER, "F");

  let textX = MARGIN;
  if (logo) {
    const logoHeight = 18;
    doc.addImage(logo.data, "PNG", MARGIN, (FIRST_HEADER - logoHeight) / 2, logoHeight * logo.ratio, logoHeight, "logo");
    textX = MARGIN + logoHeight * logo.ratio + 6;
  }

  font(8.5, "normal", MUTED);
  doc.text("IESCO FORMS · INFORME DE RESPUESTAS", textX, 13);
  font(17, "bold", WHITE);
  doc.text(fit(form.title || "Formulario sin titulo", pageWidth - MARGIN - textX), textX, 22.5);
  font(8.5, "normal", MUTED);
  doc.text(fit(`Creado por ${createdBy} · Generado el ${generatedAt}`, pageWidth - MARGIN - textX), textX, 29);

  y = FIRST_HEADER + 10;

  if (form.description) {
    font(10, "normal", SECONDARY);
    const lines = doc.splitTextToSize(form.description, contentWidth);
    doc.text(lines, MARGIN, y);
    y += lines.length * 5 + 3;
  }

  // --- Tarjetas de cifras (como en Resumen) ---------------------------------

  const kpis = [
    { tone: "primary", value: String(total), label: "Total respuestas" },
    { tone: "success", value: `${completion}%`, label: "Tasa de completado" },
    { tone: "warning", value: String(form.questions.length), label: "Preguntas" },
    // Las respuestas llegan de la mas reciente a la mas antigua.
    { tone: "danger", value: total ? formatShortDate(responses[0].submittedAt) : "-", label: "Ultima respuesta" },
  ];

  const kpiGap = 4;
  const kpiWidth = (contentWidth - kpiGap * 3) / 4;
  const kpiHeight = 30;

  kpis.forEach((kpi, i) => {
    const x = MARGIN + i * (kpiWidth + kpiGap);
    const tone = TONES[kpi.tone];

    doc.setDrawColor(...BORDER);
    doc.setFillColor(...WHITE);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, kpiWidth, kpiHeight, 3, 3, "FD");

    doc.setFillColor(...tone.bg);
    doc.roundedRect(x + 5, y + 5, 8, 8, 2, 2, "F");
    doc.setFillColor(...tone.fg);
    doc.circle(x + 9, y + 9, 1.5, "F");

    font(15, "bold");
    doc.text(fit(kpi.value, kpiWidth - 10), x + 5, y + 21);
    font(8, "normal", MUTED);
    doc.text(fit(kpi.label, kpiWidth - 10), x + 5, y + 26);
  });

  y += kpiHeight + 10;

  // --- Una tarjeta por pregunta ----------------------------------------------

  const innerX = MARGIN + CARD_PAD;
  const innerWidth = contentWidth - CARD_PAD * 2;

  /**
   * Mide y dibuja la cabecera comun: numero, titulo, tipo y cuantas respuestas.
   * Con draw=false solo devuelve la altura.
   */
  const questionHeader = (question, index, countText, top, draw) => {
    font(7.5);
    const typeText = TYPE_LABELS[question.type] ?? question.type;
    const pillWidth = doc.getTextWidth(typeText) + 5;

    font(10.5, "bold");
    const titleWidth = innerWidth - 10 - pillWidth - 4;
    const lines = doc.splitTextToSize(question.title || "Pregunta sin titulo", titleWidth);
    const titleHeight = Math.max(7, lines.length * 5);

    if (draw) {
      doc.setFillColor(...PRIMARY_LIGHT);
      doc.roundedRect(innerX, top, 7, 7, 1.6, 1.6, "F");
      font(7.5, "bold");
      doc.text(String(index + 1), innerX + 3.5, top + 4.8, { align: "center" });

      font(10.5, "bold");
      doc.text(lines, innerX + 10, top + 4.9);

      doc.setFillColor(...SURFACE_ALT);
      doc.roundedRect(innerX + innerWidth - pillWidth, top + 0.8, pillWidth, 5.2, 1, 1, "F");
      font(7.5, "normal", MUTED);
      doc.text(typeText, innerX + innerWidth - pillWidth / 2, top + 4.4, { align: "center" });

      font(8.5, "normal", MUTED);
      doc.text(countText, innerX, top + titleHeight + 5);
    }

    return titleHeight + 11;
  };

  const drawCardBorder = (top, height) => {
    doc.setDrawColor(...BORDER);
    doc.setFillColor(...WHITE);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, top, contentWidth, height, 3, 3, "FD");
  };

  // Dona + leyenda (opcion unica).
  const DONUT = 38;
  const LEGEND_ROW = 7;

  const drawDonutChart = (stats, top) => {
    const cx = innerX + DONUT / 2;
    const chartHeight = Math.max(DONUT, stats.items.length * LEGEND_ROW);
    const cy = top + chartHeight / 2;
    const outer = DONUT / 2;
    const inner = outer * 0.714;

    if (stats.total === 0) {
      ringSegment(cx, cy, outer, inner, 0, Math.PI * 2, SURFACE_ALT);
    } else {
      // Como en pantalla: empieza arriba y avanza en el sentido del reloj.
      let angle = -Math.PI / 2;
      for (const item of stats.items) {
        if (item.count === 0) continue;
        const sweep = (item.count / stats.total) * Math.PI * 2;
        ringSegment(cx, cy, outer, inner, angle, angle + sweep, item.color);
        angle += sweep;
      }
    }

    font(15, "bold");
    doc.text(String(stats.total), cx, cy + 1, { align: "center" });
    font(7, "normal", MUTED);
    doc.text("respuestas", cx, cy + 5, { align: "center" });

    const legendX = innerX + DONUT + 12;
    const legendRight = innerX + innerWidth;
    let rowY = cy - (stats.items.length * LEGEND_ROW) / 2 + LEGEND_ROW / 2;

    for (const item of stats.items) {
      doc.setFillColor(...item.color);
      doc.roundedRect(legendX, rowY - 1.7, 3.4, 3.4, 0.8, 0.8, "F");

      font(9);
      doc.text(fit(item.label, legendRight - legendX - 6 - 26), legendX + 6, rowY + 1.2);
      font(9, "bold");
      doc.text(String(item.count), legendRight - 14, rowY + 1.2, { align: "right" });
      font(7.5, "normal", MUTED);
      doc.text(`${item.percent}%`, legendRight, rowY + 1.2, { align: "right" });

      rowY += LEGEND_ROW;
    }

    return chartHeight;
  };

  // Barras (opcion multiple).
  const BAR_ROW = 9;

  const drawBarChart = (stats, top) => {
    const labelWidth = 52;
    const trackX = innerX + labelWidth + 4;
    const trackWidth = innerWidth - labelWidth - 4 - 28;
    let rowY = top;

    for (const item of stats.items) {
      const mid = rowY + 3.5;

      font(9);
      doc.text(fit(item.label, labelWidth), innerX, mid + 1.2);

      doc.setFillColor(...SURFACE_ALT);
      doc.roundedRect(trackX, rowY, trackWidth, 7, 1.5, 1.5, "F");
      if (item.percent > 0) {
        doc.setFillColor(...item.color);
        doc.roundedRect(trackX, rowY, Math.max(3, (trackWidth * item.percent) / 100), 7, 1.5, 1.5, "F");
      }

      font(9, "bold");
      doc.text(String(item.count), innerX + innerWidth - 14, mid + 1.2, { align: "right" });
      font(7.5, "normal", MUTED);
      doc.text(`${item.percent}%`, innerX + innerWidth, mid + 1.2, { align: "right" });

      rowY += BAR_ROW;
    }

    return stats.items.length * BAR_ROW - 2;
  };

  // Lista de respuestas escritas.
  const textItemHeight = (text) => {
    font(9.5);
    return doc.splitTextToSize(text, innerWidth - 10).length * 4.6 + 11;
  };

  const drawTextItem = (item, top) => {
    font(9.5);
    const lines = doc.splitTextToSize(item.text, innerWidth - 10);
    const height = lines.length * 4.6 + 11;

    doc.setFillColor(...SURFACE_ALT);
    doc.roundedRect(innerX, top, innerWidth, height - 2.5, 2, 2, "F");
    doc.text(lines, innerX + 5, top + 5.8);
    font(7.5, "normal", MUTED);
    doc.text(`${item.who} · ${formatDateTime(item.date)}`, innerX + 5, top + lines.length * 4.6 + 5.2);

    return height;
  };

  sectionTitle("Resumen");

  form.questions.forEach((question, index) => {
    const isChoice = question.type === "single_choice" || question.type === "multiple_choice";

    if (isChoice) {
      const stats = choiceStats(question, responses);
      const answered = responses.filter((r) => r.answers?.[question.id]).length;
      const countText = `${answered} respuestas`;

      const headerHeight = questionHeader(question, index, countText, 0, false);
      const chartHeight = question.type === "single_choice"
        ? Math.max(DONUT, stats.items.length * LEGEND_ROW)
        : stats.items.length * BAR_ROW - 2;
      const cardHeight = CARD_PAD + headerHeight + chartHeight + CARD_PAD;

      ensureSpace(Math.min(cardHeight, usableHeight));
      drawCardBorder(y, cardHeight);
      questionHeader(question, index, countText, y + CARD_PAD, true);

      const chartTop = y + CARD_PAD + headerHeight;
      if (question.type === "single_choice") drawDonutChart(stats, chartTop);
      else drawBarChart(stats, chartTop);

      y += cardHeight + 6;
      return;
    }

    const items = responses
      .filter((r) => isAnswered(r.answers?.[question.id]))
      .map((r) => ({ text: r.answers[question.id].toString(), date: r.submittedAt, who: respondentName(form, r) }));

    const countText = `${items.length} respuestas`;
    const headerHeight = questionHeader(question, index, countText, 0, false);
    const bodyHeight = items.length
      ? items.reduce((sum, item) => sum + textItemHeight(item.text), 0) - 2.5
      : 8;
    const cardHeight = CARD_PAD + headerHeight + bodyHeight + CARD_PAD;

    // Si la tarjeta cabe en una pagina se dibuja entera, con su borde. Si no
    // (muchas respuestas escritas), las respuestas fluyen por varias paginas.
    const fitsOnePage = cardHeight <= usableHeight;

    if (fitsOnePage) {
      ensureSpace(cardHeight);
      drawCardBorder(y, cardHeight);
    } else {
      ensureSpace(headerHeight + 30);
    }

    questionHeader(question, index, countText, y + CARD_PAD, true);
    let itemTop = y + CARD_PAD + headerHeight;

    if (items.length === 0) {
      font(9, "normal", MUTED);
      doc.text("Sin respuestas", pageWidth / 2, itemTop + 4, { align: "center" });
    }

    for (const item of items) {
      const height = textItemHeight(item.text);
      if (!fitsOnePage && itemTop + height > bottomLimit) {
        doc.addPage();
        itemTop = TOP;
      }
      drawTextItem(item, itemTop);
      itemTop += height;
    }

    y = fitsOnePage ? y + cardHeight + 6 : itemTop + 6;
  });

  // --- Detalle de cada respuesta ----------------------------------------------

  const tableStyles = {
    theme: "grid",
    // top: las tablas que pasan de pagina no se meten debajo del encabezado.
    margin: { top: TOP, left: MARGIN, right: MARGIN, bottom: MARGIN + 8 },
    styles: { font: "helvetica", fontSize: 9, textColor: TEXT, lineColor: BORDER, lineWidth: 0.2, cellPadding: 2.2, overflow: "linebreak" },
    // Una fila no se parte entre dos paginas: una respuesta larga pasa entera a la siguiente.
    rowPageBreak: "avoid",
  };

  if (total > 0) {
    doc.addPage();
    y = TOP;
    sectionTitle("Detalle de respuestas");

    responses.forEach((response, index) => {
      ensureSpace(30);

      doc.setFillColor(...SURFACE_ALT);
      doc.roundedRect(MARGIN, y - 5, contentWidth, 9, 1.5, 1.5, "F");
      font(10.5, "bold");
      doc.text(`Respuesta ${index + 1} de ${total} · ${respondentName(form, response)}`, MARGIN + 3, y + 1);
      font(8.5, "normal", MUTED);
      doc.text(formatDateTime(response.submittedAt), pageWidth - MARGIN - 3, y + 1, { align: "right" });
      y += 8;

      const data = respondentRows(form, response);
      const answers = form.questions.map((q, i) => [`${i + 1}. ${q.title || "Pregunta sin titulo"}`, answerText(q, response.answers?.[q.id])]);

      autoTable(doc, {
        ...tableStyles,
        startY: y,
        body: [
          ...data.map(([label, value]) => [{ content: label, styles: { fontStyle: "bold", fillColor: [250, 250, 252] } }, value]),
          ...answers,
        ],
        columnStyles: { 0: { cellWidth: contentWidth * 0.45, textColor: SECONDARY }, 1: { textColor: TEXT } },
      });
      y = (doc.lastAutoTable?.finalY ?? y) + 10;
    });
  }

  // --- Encabezado (desde la 2) y pie en todas las paginas ------------------------

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);

    if (page > 1) {
      doc.setFillColor(...TEXT);
      doc.rect(0, 0, pageWidth, PAGE_HEADER, "F");

      let headerX = MARGIN;
      if (logo) {
        const logoHeight = 9;
        doc.addImage(logo.data, "PNG", MARGIN, (PAGE_HEADER - logoHeight) / 2, logoHeight * logo.ratio, logoHeight, "logo");
        headerX = MARGIN + logoHeight * logo.ratio + 4;
      }

      font(8.5, "bold", WHITE);
      doc.text("Informe de respuestas", headerX, 9.6);
      font(8.5, "normal", MUTED);
      doc.text(fit(form.title || "Formulario", contentWidth / 2), pageWidth - MARGIN, 9.6, { align: "right" });
    }

    font(8, "normal", MUTED);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, pageHeight - 12, pageWidth - MARGIN, pageHeight - 12);
    doc.text(fit(`${form.title || "Formulario"} · Creado por ${createdBy}`, contentWidth - 30), MARGIN, pageHeight - 7);
    doc.text(`Pagina ${page} de ${pages}`, pageWidth - MARGIN, pageHeight - 7, { align: "right" });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`Respuestas - ${safeFileName(form.title)} - ${stamp}.pdf`);
}
