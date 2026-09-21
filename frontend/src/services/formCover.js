/**
 * Imagen que se ve al abrir un formulario: la de la portada.
 *
 * Con "imagen distinta por pregunta" activado, la pantalla de inicio puede
 * tener la suya; si no la tiene, o si la opcion esta apagada, manda la del
 * formulario. Es la misma regla que aplica FormView al pintar la portada, y
 * vive aqui para que la miniatura de las tarjetas no se desvie de lo que el
 * encuestado acaba viendo.
 */
export function coverImageOf(form) {
  if (!form) return "";

  return form.backgroundPerQuestion && form.introBackgroundImage
    ? form.introBackgroundImage
    : form.backgroundImage || "";
}
