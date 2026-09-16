import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  FiSearch, FiEdit3, FiLayout, FiHome, FiShare2, FiTrash2, FiUser, FiSettings, FiCornerDownLeft,
} from "react-icons/fi";
import { useForms } from "../../../context/FormContext";
import { useAuth } from "../../../context/AuthContext";
import { matchesSearch } from "../../../services/search";

const MAX_PER_GROUP = 6;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.overlay};
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 12vh 16px 16px;
  z-index: 1100;
`;

const Dialog = styled.div`
  width: 100%;
  max-width: 560px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.modal};
  overflow: hidden;
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
  height: 56px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textMuted};

  input {
    flex: 1;
    min-width: 0;
    border: none;
    font-size: ${({ theme }) => theme.fontSizes.lg};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Kbd = styled.kbd`
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  padding: 2px 6px;
`;

const Results = styled.div`
  max-height: min(60vh, 440px);
  overflow-y: auto;
  padding: 6px;
`;

const GroupLabel = styled.div`
  padding: 10px 12px 4px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const Item = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  text-align: left;
  background: ${({ $active, theme }) => ($active ? theme.colors.surfaceAlt : "transparent")};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.3;

  > svg { color: ${({ theme }) => theme.colors.textMuted}; flex-shrink: 0; }
`;

const ItemText = styled.span`
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textMuted};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const Empty = styled.p`
  margin: 0;
  padding: 28px 16px;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const pages = [
  { label: "Inicio", path: "/panel", icon: FiHome },
  { label: "Mis formularios", path: "/formularios", icon: FiEdit3 },
  { label: "Plantillas", path: "/plantillas", icon: FiLayout },
  { label: "Compartidos", path: "/compartidos", icon: FiShare2 },
  { label: "Papelera", path: "/papelera", icon: FiTrash2 },
  { label: "Mi cuenta", path: "/mi-cuenta", icon: FiUser, keywords: "perfil contrasena nombre" },
  { label: "Configuracion", path: "/configuracion", icon: FiSettings, keywords: "tema preferencias" },
];

/**
 * Buscador de toda la aplicacion: formularios, plantillas y paginas. Se abre
 * con la lupa de la barra superior o con Ctrl+K (Cmd+K en Mac).
 *
 * Usar una plantilla crea un formulario, asi que aqui solo lleva a la pagina de
 * plantillas: crear algo sin querer desde un buscador seria una mala sorpresa.
 *
 * Se monta solo mientras esta abierto, asi cada vez empieza con la busqueda vacia.
 */
function GlobalSearch({ onClose }) {
  const navigate = useNavigate();
  const { forms, templates } = useForms();
  const { isAdmin } = useAuth();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef(null);

  const groups = useMemo(() => {
    const formItems = forms
      .filter((f) => matchesSearch(query, f.title, f.description))
      .slice(0, MAX_PER_GROUP)
      .map((f) => ({
        key: `form-${f.id}`,
        icon: FiEdit3,
        label: f.title || "Sin titulo",
        detail: f.sharedPermission
          ? `${f.status} · compartido por ${f.ownerName ?? "otro usuario"}`
          : f.status,
        path: `/formularios/${f.id}/editar`,
      }));

    // Sin texto no se listan plantillas: con los formularios y las paginas ya
    // hay bastante para empezar.
    const templateItems = query.trim()
      ? templates
          .filter((t) => matchesSearch(query, t.name, t.description))
          .slice(0, MAX_PER_GROUP)
          .map((t) => ({
            key: `tpl-${t.id}`,
            icon: FiLayout,
            label: t.name,
            detail: t.description,
            path: "/plantillas",
          }))
      : [];

    const pageItems = pages
      .filter((p) => matchesSearch(query, p.label, p.keywords, p.path === "/configuracion" && isAdmin ? "usuarios" : ""))
      .map((p) => ({ key: `page-${p.path}`, icon: p.icon, label: p.label, path: p.path }));

    return [
      { title: "Formularios", items: formItems },
      { title: "Plantillas", items: templateItems },
      { title: "Ir a", items: pageItems },
    ].filter((g) => g.items.length > 0);
  }, [forms, templates, query, isAdmin]);

  const flat = groups.flatMap((g) => g.items);

  // Mantiene visible el elemento marcado al moverse con las flechas.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (item) => {
    onClose();
    navigate(item.path);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (flat.length ? (i + 1) % flat.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (event.key === "Enter" && flat[active]) {
      event.preventDefault();
      go(flat[active]);
    } else if (event.key === "Escape") {
      onClose();
    }
  };

  let index = -1;

  // Portal a <body>: la barra superior crea su propio contexto de apilado y,
  // dibujado dentro de ella, el fondo oscuro no tapaba la barra lateral.
  return createPortal(
    <Overlay onMouseDown={onClose}>
      <Dialog
        role="dialog"
        aria-modal="true"
        aria-label="Buscar"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <InputRow>
          <FiSearch size={18} />
          <input
            autoFocus
            placeholder="Buscar formularios, plantillas o paginas..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={handleKeyDown}
            aria-label="Buscar"
          />
          <Kbd>Esc</Kbd>
        </InputRow>

        <Results ref={listRef}>
          {flat.length === 0 && <Empty>Nada coincide con "{query.trim()}".</Empty>}

          {groups.map((group) => (
            <div key={group.title}>
              <GroupLabel>{group.title}</GroupLabel>
              {group.items.map((item) => {
                index += 1;
                const i = index;
                const Icon = item.icon;
                return (
                  <Item
                    key={item.key}
                    type="button"
                    $active={i === active}
                    data-active={i === active}
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(item)}
                  >
                    <Icon size={16} />
                    <ItemText>
                      <strong>{item.label}</strong>
                      {item.detail && <small>{item.detail}</small>}
                    </ItemText>
                    {i === active && <FiCornerDownLeft size={14} />}
                  </Item>
                );
              })}
            </div>
          ))}
        </Results>
      </Dialog>
    </Overlay>,
    document.body
  );
}

export default GlobalSearch;
