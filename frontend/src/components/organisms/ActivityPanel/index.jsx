import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { FiX, FiClock, FiLink } from "react-icons/fi";
import Button from "../../atoms/Button";
import Avatar from "../../atoms/Avatar";
import { EmptyState, ErrorState, LoadingState } from "../../molecules/StateView";
import { formsApi } from "../../../services/api";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.overlay};
  z-index: 1000;
`;

const Drawer = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(400px, 100vw);
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.surface};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.modal};
  z-index: 1001;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  h2 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }

  p {
    margin: 4px 0 0;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 8px 0;
  overflow-y: auto;
  flex: 1;
`;

const Item = styled.li`
  display: flex;
  gap: 12px;
  padding: 10px 20px;
  align-items: flex-start;

  & + & { border-top: 1px solid ${({ theme }) => theme.colors.borderLight}; }
`;

const Anonymous = styled.div`
  width: 30px;
  height: 30px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const Text = styled.div`
  flex: 1;
  min-width: 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.45;
  overflow-wrap: anywhere;

  strong { font-weight: ${({ theme }) => theme.fontWeights.semibold}; }
`;

const Meta = styled.div`
  margin-top: 2px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** Como se lee cada accion detras del nombre de quien la hizo. */
const ACTIONS = {
  new_responses: () => "respondio el formulario",
  form_created: () => "creo el formulario",
  form_published: () => "publico el formulario",
  form_unpublished: () => "lo devolvio a borrador",
  form_updated: () => "edito el formulario",
  form_trashed: () => "lo movio a la papelera",
  form_restored: () => "lo restauro de la papelera",
  form_shared: (d) => (d ? `lo compartio con ${d}` : "lo compartio"),
  form_unshared: (d) => (d ? `quito el acceso a ${d}` : "quito un acceso"),
  form_public: () => "lo hizo publico",
  form_private: () => "lo hizo privado",
  form_link: () => "cambio los enlaces para responder",
  response_deleted: () => "borro una respuesta",
  settings_updated: () => "cambio el cierre o el mensaje final",
  saved_as_template: (d) => (d ? `lo guardo como plantilla "${d}"` : "lo guardo como plantilla"),
};

function describe(entry) {
  const text = ACTIONS[entry.action];
  return text ? text(entry.detail) : entry.action;
}

function initials(name) {
  const parts = (name || "?").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** "hace 5 min", "hace 3 h", "hace 2 dias"; lo mas viejo, con fecha. */
function timeAgo(value) {
  const diff = Date.now() - new Date(value).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return days === 1 ? "hace 1 dia" : `hace ${days} dias`;
  return new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Historial del formulario: quien hizo que y cuando. Lo ven todos los que
 * trabajan en el. Se carga al abrirse, asi que siempre muestra lo ultimo.
 *
 * Quien lo usa lo monta solo mientras esta abierto ({open && <ActivityPanel />}):
 * asi cada apertura empieza de cero, cargando.
 */
function ActivityPanel({ formId, open, onClose }) {
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  // El estado de carga lo pone quien llama: al abrir ya nace en "loading" (el
  // panel se monta de cero) y el boton de reintentar lo pone el mismo.
  const load = useCallback((signal) => {
    formsApi.activity(formId, { signal })
      .then((list) => {
        setEntries(list ?? []);
        setStatus("ready");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err);
        setStatus("error");
      });
  }, [formId]);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [open, load]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <Overlay onMouseDown={onClose} />
      <Drawer role="dialog" aria-modal="true" aria-labelledby="activity-title">
        <Header>
          <div>
            <h2 id="activity-title"><FiClock size={17} /> Historial</h2>
            <p>Quien hizo que en este formulario.</p>
          </div>
          <Button $variant="ghost" onClick={onClose} aria-label="Cerrar"><FiX size={18} /></Button>
        </Header>

        {status === "loading" && <LoadingState text="Cargando historial..." compact />}
        {status === "error" && <ErrorState error={error} onRetry={() => { setStatus("loading"); load(); }} compact />}
        {status === "ready" && entries.length === 0 && (
          <EmptyState
            compact
            icon={<FiClock size={22} />}
            title="Sin actividad todavia"
            text="Aqui aparecera cada cambio, respuesta o permiso que se de."
          />
        )}

        {status === "ready" && entries.length > 0 && (
          <List>
            {entries.map((entry) => (
              <Item key={entry.id}>
                {entry.userId ? (
                  <Avatar $size={30}>{initials(entry.userName)}</Avatar>
                ) : (
                  <Anonymous title="Sin sesion"><FiLink size={13} /></Anonymous>
                )}
                <Text>
                  <strong>{entry.userId ? entry.userName || "Usuario eliminado" : "Alguien con el enlace"}</strong>{" "}
                  {describe(entry)}
                  {entry.count > 1 ? ` (${entry.count} veces)` : ""}
                  <Meta title={new Date(entry.updatedAt).toLocaleString("es-ES")}>
                    {timeAgo(entry.updatedAt)}
                  </Meta>
                </Text>
              </Item>
            ))}
          </List>
        )}
      </Drawer>
    </>,
    document.body
  );
}

export default ActivityPanel;
