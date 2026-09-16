import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { FiX, FiUserPlus, FiTrash2, FiUsers, FiGlobe, FiLock, FiAlertCircle, FiLink, FiCheck } from "react-icons/fi";
import Button from "../../atoms/Button";
import Avatar from "../../atoms/Avatar";
import Spinner from "../../atoms/Spinner";
import { useAuth } from "../../../context/AuthContext";
import { useForms } from "../../../context/FormContext";
import { useToast } from "../../../context/ToastContext";
import { directoryApi, linksApi, linkUrl, sharesApi } from "../../../services/api";
import { DURATIONS, copy, formatDate } from "../FormLinksPanel";
import { matchesSearch } from "../../../services/search";

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

const Dialog = styled.div`
  width: 100%;
  max-width: 520px;
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.modal};
  overflow: hidden;
  cursor: default;
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
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }

  p {
    margin: 2px 0 0;
    font-size: ${({ theme }) => theme.fontSizes.md};
    color: ${({ theme }) => theme.colors.textMuted};
    overflow-wrap: anywhere;
  }
`;

const Body = styled.div`
  overflow-y: auto;
`;

const Block = styled.section`
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  }
`;

const BlockHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const BlockIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const BlockText = styled.div`
  flex: 1;
  min-width: 0;

  h3 {
    margin: 0 0 2px;
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }

  p {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.md};
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.45;
  }
`;

const Switch = styled.button`
  position: relative;
  width: 42px;
  height: 24px;
  border-radius: 999px;
  flex-shrink: 0;
  margin-top: 6px;
  background: ${({ $on, theme }) => ($on ? theme.colors.success : theme.colors.border)};
  transition: background 0.15s ease;

  &::after {
    content: "";
    position: absolute;
    top: 3px;
    left: ${({ $on }) => ($on ? "21px" : "3px")};
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    transition: left 0.15s ease;
  }

  &:disabled { opacity: 0.6; cursor: wait; }
`;

const Note = styled.p`
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.warningBg};
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.45;

  svg { color: ${({ theme }) => theme.colors.warning}; flex-shrink: 0; margin-top: 2px; }
`;

const CopyRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const CopyHint = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const AddRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const PickerWrapper = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;
`;

const Input = styled.input`
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  font-size: ${({ theme }) => theme.fontSizes.base};

  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

const Suggestions = styled.ul`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  list-style: none;
  margin: 0;
  padding: 4px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  max-height: 220px;
  overflow-y: auto;
  z-index: 10;
`;

const Suggestion = styled.li`
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  background: ${({ $active, theme }) => ($active ? theme.colors.surfaceAlt : "transparent")};

  strong { font-size: ${({ theme }) => theme.fontSizes.base}; font-weight: ${({ theme }) => theme.fontWeights.medium}; }
  span { font-size: ${({ theme }) => theme.fontSizes.sm}; color: ${({ theme }) => theme.colors.textMuted}; }
`;

const NoMatch = styled.li`
  padding: 10px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const People = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
`;

const Person = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
`;

const PersonInfo = styled.div`
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
  }

  span {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textMuted};
    overflow-wrap: anywhere;
  }
`;

const Muted = styled.p`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};
`;

function initialsOf(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Compartir un formulario, de dos formas:
 *
 * - Publico: todos los usuarios lo ven en Compartidos > Publicos y lo abren
 *   directamente para responder. No pueden editarlo ni ver resultados.
 * - Privado: personas concretas que pueden editarlo, como si fuera suyo.
 *
 * Solo lo abre el dueno: el backend rechaza cualquier cambio de otro usuario.
 * Cada cambio se guarda al momento, sin boton de "guardar".
 */
function ShareFormModal({ form, onClose }) {
  const { user: me } = useAuth();
  const { getForm, replaceForm } = useForms();
  const toast = useToast();

  // Se lee del contexto para ver al momento el cambio de publico/privado.
  const current = getForm(form.id) ?? form;

  const [shares, setShares] = useState([]);
  const [directory, setDirectory] = useState([]);
  // loading | ready | error
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const [savingPublic, setSavingPublic] = useState(false);

  // Enlace para responder sin sesion. Se copia el vigente que vence mas tarde;
  // si no hay ninguno, se ofrece crear uno.
  const [links, setLinks] = useState([]);
  const [linkBusy, setLinkBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      sharesApi.list(form.id, { signal: controller.signal }),
      directoryApi.users({ signal: controller.signal }),
      linksApi.list(form.id, { signal: controller.signal }),
    ])
      .then(([currentShares, users, formLinks]) => {
        setShares(currentShares);
        setDirectory(users);
        setLinks(formLinks);
        setStatus("ready");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setLoadError(err.message);
        setStatus("error");
      });

    return () => controller.abort();
  }, [form.id]);

  // Cerrar con Escape.
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Candidatos: ni uno mismo, ni el dueno, ni quien ya lo tiene.
  const candidates = useMemo(() => {
    const taken = new Set([me?.id, form.ownerId, ...shares.map((s) => s.userId)]);
    return directory
      .filter((u) => !taken.has(u.id))
      .filter((u) => matchesSearch(query, u.displayName, u.email))
      .slice(0, 8);
  }, [directory, shares, query, me, form.ownerId]);

  const togglePublic = async () => {
    if (savingPublic) return;

    setSavingPublic(true);
    try {
      const updated = await sharesApi.setPublic(form.id, !current.isPublic);
      replaceForm(updated);
      toast.success(updated.isPublic
        ? "Ahora es publico: todos pueden responderlo desde Compartidos."
        : "Ya no es publico.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPublic(false);
    }
  };

  // Los enlaces vienen ordenados del que vence mas tarde al que antes.
  const activeLink = links.find((l) => new Date(l.expiresAt).getTime() > Date.now());

  const copyLink = async (link) => {
    if (await copy(linkUrl(link.token))) {
      setCopied(true);
      toast.success(`Enlace copiado. Vence el ${formatDate(link.expiresAt)}.`);
    }
  };

  const createAndCopy = async (ms) => {
    if (linkBusy) return;

    setLinkBusy(true);
    try {
      const link = await linksApi.create(form.id, new Date(Date.now() + ms).toISOString());
      setLinks((list) => [link, ...list]);
      await copyLink(link);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLinkBusy(false);
    }
  };

  const pick = (candidate) => {
    setSelected(candidate);
    setQuery(candidate.displayName);
    setPickerOpen(false);
  };

  const handleQueryKey = (event) => {
    if (!pickerOpen || candidates.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % candidates.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + candidates.length) % candidates.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      pick(candidates[activeIndex] ?? candidates[0]);
    }
  };

  const handleShare = async () => {
    if (!selected || busyId) return;

    setBusyId(selected.id);
    try {
      setShares(await sharesApi.share(form.id, selected.id));
      toast.success(`${selected.displayName} ya puede editarlo.`);
      setSelected(null);
      setQuery("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (share) => {
    setBusyId(share.userId);
    try {
      await sharesApi.unshare(form.id, share.userId);
      setShares((list) => list.filter((s) => s.userId !== share.userId));
      toast.info(`${share.displayName} ya no tiene acceso.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return createPortal(
    <Overlay onMouseDown={onClose}>
      <Dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <Header>
          <div>
            <h2 id="share-title">Compartir formulario</h2>
            <p>{current.title}</p>
          </div>
          <Button $variant="ghost" onClick={onClose} aria-label="Cerrar"><FiX size={18} /></Button>
        </Header>

        <Body>
          <Block>
            <BlockHeader>
              <BlockIcon><FiGlobe size={16} /></BlockIcon>
              <BlockText>
                <h3>Publico</h3>
                <p>
                  Todos los usuarios lo ven en Compartidos y lo abren para responder.
                  No pueden editarlo ni ver los resultados.
                </p>
              </BlockText>
              <Switch
                type="button"
                role="switch"
                aria-checked={Boolean(current.isPublic)}
                aria-label="Formulario publico"
                $on={current.isPublic}
                disabled={savingPublic}
                onClick={togglePublic}
              />
            </BlockHeader>
            {current.isPublic && current.status !== "Activo" && (
              <Note>
                <FiAlertCircle size={15} />
                Esta en borrador: aparecera en Publicos cuando lo publiques.
              </Note>
            )}

            {status === "ready" && (activeLink ? (
              <CopyRow>
                <Button $variant="secondary" $size="sm" onClick={() => copyLink(activeLink)}>
                  {copied ? <FiCheck size={14} /> : <FiLink size={14} />} Copiar enlace
                </Button>
                <CopyHint>Para responder sin sesion · vence el {formatDate(activeLink.expiresAt)}</CopyHint>
              </CopyRow>
            ) : (
              <CopyRow>
                <CopyHint>Crear y copiar un enlace para responder sin sesion, que vence en:</CopyHint>
                {DURATIONS.map((d) => (
                  <Button key={d.label} $variant="secondary" $size="sm" disabled={linkBusy} onClick={() => createAndCopy(d.ms)}>
                    <FiLink size={13} /> {d.label}
                  </Button>
                ))}
                {linkBusy && <Spinner $size={14} />}
              </CopyRow>
            ))}

            {status === "ready" && current.status !== "Activo" && (
              <CopyHint>El enlace solo funciona cuando el formulario esta publicado.</CopyHint>
            )}
          </Block>

          <Block>
            <BlockHeader>
              <BlockIcon><FiLock size={16} /></BlockIcon>
              <BlockText>
                <h3>Privado</h3>
                <p>
                  Personas que pueden editarlo contigo. Lo ven en Compartidos y lo abren
                  en el editor. Solo tu puedes compartirlo o eliminarlo.
                </p>
              </BlockText>
            </BlockHeader>

            {status === "loading" && <Muted><Spinner $size={14} /> Cargando...</Muted>}
            {status === "error" && <Muted>{loadError}</Muted>}

            {status === "ready" && (
              <>
                <AddRow>
                  <PickerWrapper>
                    <Input
                      placeholder="Nombre o correo de la persona"
                      value={query}
                      aria-label="Buscar usuario"
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setSelected(null);
                        setPickerOpen(true);
                        setActiveIndex(0);
                      }}
                      onFocus={() => setPickerOpen(true)}
                      onBlur={() => setTimeout(() => setPickerOpen(false), 150)}
                      onKeyDown={handleQueryKey}
                    />
                    {pickerOpen && !selected && (
                      <Suggestions role="listbox">
                        {candidates.length === 0 ? (
                          <NoMatch>
                            {query.trim() ? "Ningun usuario coincide." : "No hay mas usuarios con quien compartir."}
                          </NoMatch>
                        ) : (
                          candidates.map((c, i) => (
                            <Suggestion
                              key={c.id}
                              role="option"
                              aria-selected={i === activeIndex}
                              $active={i === activeIndex}
                              onMouseDown={(e) => { e.preventDefault(); pick(c); }}
                              onMouseMove={() => setActiveIndex(i)}
                            >
                              <strong>{c.displayName}</strong>
                              <span>{c.email}</span>
                            </Suggestion>
                          ))
                        )}
                      </Suggestions>
                    )}
                  </PickerWrapper>

                  <Button onClick={handleShare} disabled={!selected || Boolean(busyId)}>
                    {busyId && selected && busyId === selected.id
                      ? <Spinner $size={13} $color="currentColor" />
                      : <FiUserPlus size={14} />}
                    Agregar
                  </Button>
                </AddRow>

                {shares.length === 0 ? (
                  <Muted><FiUsers size={14} /> Todavia no lo compartiste con nadie.</Muted>
                ) : (
                  <People>
                    {shares.map((share) => (
                      <Person key={share.userId}>
                        <Avatar $size={32}>{initialsOf(share.displayName)}</Avatar>
                        <PersonInfo>
                          <strong>{share.displayName}</strong>
                          <span>{share.email}</span>
                        </PersonInfo>
                        <Button
                          $variant="ghost"
                          $size="sm"
                          onClick={() => handleRemove(share)}
                          disabled={busyId === share.userId}
                          aria-label={`Quitar a ${share.displayName}`}
                          title="Quitar acceso"
                        >
                          <FiTrash2 size={14} />
                        </Button>
                      </Person>
                    ))}
                  </People>
                )}
              </>
            )}
          </Block>
        </Body>
      </Dialog>
    </Overlay>,
    document.body
  );
}

export default ShareFormModal;
