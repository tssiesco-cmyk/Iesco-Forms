import { useState } from "react";
import styled from "styled-components";
import { FiClock, FiAlertCircle } from "react-icons/fi";
import Spinner from "../../atoms/Spinner";
import { useForms } from "../../../context/FormContext";
import { useToast } from "../../../context/ToastContext";
import { formsApi } from "../../../services/api";

const Section = styled.div`
  padding: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Row = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  min-width: 0;
  padding: 7px 9px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface};
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text};
  outline: none;
  font-family: inherit;
  color-scheme: light dark;

  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`;

const Textarea = styled(Input).attrs({ as: "textarea" })`
  min-height: 62px;
  resize: vertical;
  line-height: 1.45;
`;

const ClearButton = styled.button`
  flex-shrink: 0;
  padding: 6px 8px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  background: ${({ theme }) => theme.colors.surfaceAlt};

  &:hover { color: ${({ theme }) => theme.colors.danger}; }
`;

const Hint = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.45;
`;

const ClosedNote = styled.p`
  margin: 0;
  display: flex;
  gap: 6px;
  align-items: flex-start;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.warningBg};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.45;

  svg { flex-shrink: 0; margin-top: 2px; color: ${({ theme }) => theme.colors.warning}; }
`;

/** ISO del backend a lo que entiende un input datetime-local (hora local, sin zona). */
function toLocalInput(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/** El motivo del cierre, para que no parezca un fallo. */
function closedReason(form) {
  const byDate = form.closesAt && new Date(form.closesAt) <= new Date();
  if (byDate) {
    return `cerro el ${new Date(form.closesAt).toLocaleString("es-ES", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    })}.`;
  }
  return `llego al limite de ${form.maxResponses} respuestas.`;
}

/**
 * Cierre automatico (por fecha o por cupo) y mensaje final del formulario.
 *
 * Los campos guardan al salir de ellos y no a cada tecla: una fecha a medio
 * escribir no es una fecha, y el limite no debe cambiar por cada digito.
 * Quien la usa le pone key={form.id} para que el estado local nazca de nuevo
 * al cambiar de formulario.
 */
function ClosingSettings({ form }) {
  const { getForm, replaceForm } = useForms();
  const toast = useToast();

  const [closesAt, setClosesAt] = useState(toLocalInput(form.closesAt));
  const [maxResponses, setMaxResponses] = useState(form.maxResponses ? String(form.maxResponses) : "");
  const [message, setMessage] = useState(form.confirmationMessage || "");
  const [saving, setSaving] = useState(false);

  const save = async (changes) => {
    setSaving(true);
    try {
      const result = await formsApi.updateSettings(form.id, changes);
      // Solo se copian los campos de esta seccion: si hubiera un titulo a
      // medio guardar, el formulario entero del servidor lo pisaria.
      const current = getForm(form.id) ?? form;
      replaceForm({
        ...current,
        closesAt: result.closesAt ?? null,
        maxResponses: result.maxResponses ?? null,
        confirmationMessage: result.confirmationMessage ?? "",
        isClosed: result.isClosed,
        responseCount: result.responseCount,
      });
    } catch (err) {
      toast.error(`No se pudo guardar el cierre: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveClosesAt = (value) => {
    const saved = toLocalInput(form.closesAt);
    if (value === saved) return;

    if (!value) {
      save({ clearClosesAt: true });
      return;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return;
    save({ closesAt: date.toISOString() });
  };

  const saveMaxResponses = () => {
    const parsed = maxResponses.trim() === "" ? 0 : Math.max(0, Math.floor(Number(maxResponses)));
    if (Number.isNaN(parsed)) {
      setMaxResponses(form.maxResponses ? String(form.maxResponses) : "");
      return;
    }
    setMaxResponses(parsed > 0 ? String(parsed) : "");
    if (parsed === (form.maxResponses ?? 0)) return;
    save({ maxResponses: parsed });
  };

  const saveMessage = () => {
    if (message === (form.confirmationMessage || "")) return;
    save({ confirmationMessage: message });
  };

  return (
    <Section>
      <Title>
        <FiClock size={12} /> Cierre y mensaje final
        {saving && <Spinner $size={11} />}
      </Title>

      {form.isClosed && (
        <ClosedNote>
          <FiAlertCircle size={13} />
          <span>El formulario ya no acepta respuestas: {closedReason(form)}</span>
        </ClosedNote>
      )}

      <Field>
        Cerrar el
        <Row>
          <Input
            type="datetime-local"
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            onBlur={(e) => saveClosesAt(e.target.value)}
          />
          {closesAt && (
            <ClearButton
              type="button"
              onClick={() => { setClosesAt(""); saveClosesAt(""); }}
              title="Quitar la fecha de cierre"
            >
              Quitar
            </ClearButton>
          )}
        </Row>
      </Field>

      <Field>
        Limite de respuestas
        <Input
          type="number"
          min="0"
          inputMode="numeric"
          value={maxResponses}
          onChange={(e) => setMaxResponses(e.target.value)}
          onBlur={saveMaxResponses}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          placeholder="Sin limite"
        />
      </Field>

      <Hint>
        Vacio, no cierra solo. Vale para todos: con sesion y con enlace.
        {form.maxResponses ? ` Lleva ${form.responseCount ?? 0} de ${form.maxResponses}.` : ""}
      </Hint>

      <Field>
        Mensaje al terminar
        <Textarea
          value={message}
          maxLength={1000}
          onChange={(e) => setMessage(e.target.value)}
          onBlur={saveMessage}
          placeholder="Gracias por tu respuesta. (Vacio: el mensaje de siempre)"
        />
      </Field>
    </Section>
  );
}

export default ClosingSettings;
