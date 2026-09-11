import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import {
  FiBell, FiMessageSquare, FiCheck, FiAlertTriangle,
  FiSend, FiRotateCcw, FiEdit3, FiTrash2, FiPlusCircle
} from "react-icons/fi";
import { useNotifications } from "../../../context/NotificationsContext";
import Spinner from "../../atoms/Spinner";

const Wrapper = styled.div`
  position: relative;
`;

const BellButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  background: ${({ $open, theme }) => ($open ? theme.colors.surfaceAlt : "transparent")};
  transition: all 0.15s ease;
  position: relative;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Badge = styled.span`
  position: absolute;
  top: 3px;
  right: 2px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 9px;
  background: ${({ theme }) => theme.colors.danger};
  color: #fff;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  line-height: 17px;
  text-align: center;
  /* Un borde del color de la barra separa el globo del icono. */
  box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.surface};
`;

const dropIn = keyframes`
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Panel = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 340px;
  max-width: calc(100vw - 32px);
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  z-index: 200;
  overflow: hidden;
  animation: ${dropIn} 0.15s ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  strong {
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const MarkAllButton = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: 4px 7px;
  border-radius: ${({ theme }) => theme.radii.sm};
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const List = styled.div`
  max-height: 380px;
  overflow-y: auto;
`;

const Item = styled.button`
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  background: ${({ $unread, theme }) => ($unread ? theme.colors.surfaceAlt : "transparent")};
  transition: background 0.1s ease;

  &:last-child { border-bottom: none; }
  &:hover { background: ${({ theme }) => theme.colors.surfaceHover}; }
`;

const ItemIcon = styled.span`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $tone, theme }) => theme.colors[`${$tone}Bg`] || theme.colors.primaryBg};
  color: ${({ $tone, theme }) => theme.colors[$tone] || theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ItemBody = styled.div`
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ theme }) => theme.colors.text};
    line-height: 1.35;
  }

  span {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textSecondary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
  }

  time {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textMuted};
    margin-top: 4px;
  }
`;

const UnreadDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.danger};
  flex-shrink: 0;
  margin-top: 12px;
`;

const Centered = styled.div`
  padding: 36px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;

  strong {
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  p {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.md};
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.5;
    max-width: 250px;
  }
`;

const EmptyIcon = styled.span`
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;
`;

/** "hace 5 min", "hace 2 h", "ayer"... */
function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;
  if (hours < 24) return `hace ${hours} h`;
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} dias`;

  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

/**
  * Cada tipo de aviso con su icono, su color y como se lee.
  * Los que llevan contador muestran cuantas veces ocurrio; en el resto el numero
  * no aporta nada ("publicado" ya lo dice todo).
  */
const TYPES = {
  new_responses: {
    icon: <FiMessageSquare size={15} />,
    tone: "primary",
    text: (c) => (c === 1 ? "1 respuesta nueva" : `${c} respuestas nuevas`),
  },
  form_published: {
    icon: <FiSend size={15} />,
    tone: "success",
    text: () => "Formulario publicado",
  },
  form_unpublished: {
    icon: <FiRotateCcw size={15} />,
    tone: "warning",
    text: () => "Devuelto a borrador",
  },
  form_updated: {
    icon: <FiEdit3 size={15} />,
    tone: "primary",
    text: (c) => (c === 1 ? "Formulario editado" : `${c} cambios guardados`),
  },
  form_trashed: {
    icon: <FiTrash2 size={15} />,
    tone: "danger",
    text: () => "Movido a la papelera",
  },
  form_restored: {
    icon: <FiPlusCircle size={15} />,
    tone: "success",
    text: () => "Restaurado desde la papelera",
  },
};

const FALLBACK = { icon: <FiBell size={15} />, tone: "primary", text: () => "Actividad" };

function describe(notification) {
  const type = TYPES[notification.type] || FALLBACK;
  return type.text(notification.count);
}

function NotificationsMenu() {
  const navigate = useNavigate();
  const { items, unreadCount, status, error, loadList, markRead, markAllRead } = useNotifications();

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // La lista solo se pide al abrir: el sondeo de fondo trae unicamente el numero.
  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    loadList(controller.signal);

    const handlePointer = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);

    return () => {
      controller.abort();
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, loadList]);

  const handleOpen = (notification) => {
    setOpen(false);
    markRead(notification.id);
    // Una notificacion que no lleva a ningun sitio es decoracion.
    navigate(`/formularios/${notification.formId}/resultados`);
  };

  return (
    <Wrapper ref={ref}>
      <BellButton
        $open={open}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          unreadCount > 0
            ? `Notificaciones, ${unreadCount} sin leer`
            : "Notificaciones"
        }
        title="Notificaciones"
      >
        <FiBell size={18} />
        {unreadCount > 0 && <Badge>{unreadCount > 9 ? "9+" : unreadCount}</Badge>}
      </BellButton>

      {open && (
        <Panel role="menu">
          <PanelHeader>
            <strong>Notificaciones</strong>
            {unreadCount > 0 && (
              <MarkAllButton onClick={markAllRead}>
                <FiCheck size={13} /> Marcar todas
              </MarkAllButton>
            )}
          </PanelHeader>

          {status === "loading" && (
            <Centered><Spinner $size={22} /></Centered>
          )}

          {status === "error" && (
            <Centered>
              <EmptyIcon><FiAlertTriangle size={20} /></EmptyIcon>
              <strong>No se pudieron cargar</strong>
              <p>{error?.isNetwork ? "El servidor no responde." : error?.message}</p>
            </Centered>
          )}

          {status === "ready" && items.length === 0 && (
            <Centered>
              <EmptyIcon><FiBell size={20} /></EmptyIcon>
              <strong>Todo al dia</strong>
              <p>Aqui veras la actividad de tus formularios: respuestas, cambios y publicaciones.</p>
            </Centered>
          )}

          {status === "ready" && items.length > 0 && (
            <List>
              {items.map((notification) => {
                const unread = !notification.readAt;
                return (
                  <Item
                    key={notification.id}
                    $unread={unread}
                    onClick={() => handleOpen(notification)}
                    role="menuitem"
                  >
                    <ItemIcon $tone={(TYPES[notification.type] || FALLBACK).tone}>
                      {(TYPES[notification.type] || FALLBACK).icon}
                    </ItemIcon>
                    <ItemBody>
                      <strong>{describe(notification)}</strong>
                      <span>{notification.formTitle}</span>
                      <time dateTime={notification.updatedAt}>
                        {relativeTime(notification.updatedAt)}
                      </time>
                    </ItemBody>
                    {unread && <UnreadDot />}
                  </Item>
                );
              })}
            </List>
          )}
        </Panel>
      )}
    </Wrapper>
  );
}

export default NotificationsMenu;
