/**
 * Busqueda de texto para los listados (formularios, papelera, plantillas...).
 *
 * Ignora mayusculas, tildes y espacios de sobra: "Satisfacción " encuentra
 * "Encuesta de satisfaccion". Con varias palabras exige todas, pero cada una
 * puede estar en cualquier campo: "encuesta cliente" encuentra un formulario
 * titulado "Encuesta" cuya descripcion habla de clientes.
 */

export function normalize(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesSearch(query, ...fields) {
  const terms = normalize(query).split(" ").filter(Boolean);
  if (terms.length === 0) return true;

  const haystack = fields.map(normalize).join(" ");
  return terms.every((term) => haystack.includes(term));
}
