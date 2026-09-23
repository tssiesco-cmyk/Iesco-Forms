import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { FiX, FiBookmark } from "react-icons/fi";
import Button from "../../atoms/Button";
import Spinner from "../../atoms/Spinner";
import { useToast } from "../../../context/ToastContext";
import { formsApi } from "../../../services/api";
import { useForms } from "../../../context/FormContext";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000;
`;

const Dialog = styled.form`
  width: 100%;
  max-width: 460px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.modal};
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  h2 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }

  p {
    margin: 4px 0 0;
    font-size: ${({ theme }) => theme.fontSizes.md};
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.45;
  }
`;

const Body = styled.div`
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Input = styled.input`
  width: 100%;
  padding: 9px 11px;
  border: 1px solid ${({ theme }) => theme.colors.borderInput};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: inherit;
  color: ${({ theme }) => theme.colors.text};
  outline: none;

  &:focus { border-color: ${({ theme }) => theme.colors.borderFocus}; }
`;

const Textarea = styled(Input).attrs({ as: "textarea" })`
  min-height: 80px;
  resize: vertical;
  line-height: 1.45;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

/**
 * Guarda el formulario como plantilla del equipo. Es una foto del momento:
 * lo que se cambie despues en el formulario no llega a la plantilla.
 */
function SaveTemplateModal({ form, onClose }) {
  const toast = useToast();
  const { addTemplateLocally } = useForms();
  const [name, setName] = useState(form.title || "");
  const [description, setDescription] = useState(form.description || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, saving]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim() || saving) return;

    setSaving(true);
    try {
      const saved = await formsApi.saveAsTemplate(form.id, name.trim(), description.trim());
      // Sin esto no saldria en Plantillas hasta recargar la lista.
      addTemplateLocally(saved);
      toast.success("Plantilla guardada. La vera todo el equipo en Plantillas.");
      onClose();
    } catch (err) {
      toast.error(`No se pudo guardar la plantilla: ${err.message}`);
      setSaving(false);
    }
  };

  return createPortal(
    <Overlay onMouseDown={() => !saving && onClose()}>
      <Dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-template-title"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <Header>
          <div>
            <h2 id="save-template-title"><FiBookmark size={18} /> Guardar como plantilla</h2>
            <p>
              Se copian las preguntas, la portada, los fondos y los datos del usuario.
              Las respuestas no.
            </p>
          </div>
          <Button type="button" $variant="ghost" onClick={onClose} aria-label="Cerrar" disabled={saving}>
            <FiX size={18} />
          </Button>
        </Header>

        <Body>
          <Field>
            Nombre
            <Input
              value={name}
              maxLength={200}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </Field>
          <Field>
            Descripcion
            <Textarea
              value={description}
              maxLength={1000}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Para que sirve esta plantilla (opcional)"
            />
          </Field>
        </Body>

        <Footer>
          <Button type="button" $variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? <Spinner $size={14} /> : <FiBookmark size={14} />}
            {saving ? "Guardando..." : "Guardar plantilla"}
          </Button>
        </Footer>
      </Dialog>
    </Overlay>,
    document.body
  );
}

export default SaveTemplateModal;
