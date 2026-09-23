import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import QRCode from "qrcode";
import { FiLink, FiCopy, FiTrash2, FiClock, FiCheck, FiPlus, FiDownload, FiX } from "react-icons/fi";
import { MdQrCode2 } from "react-icons/md";
import Spinner from "../../atoms/Spinner";
import { useToast } from "../../../context/ToastContext";
import { linksApi, linkUrl } from "../../../services/api";

const HOUR = 60 * 60 * 1000;

export const DURATIONS = [
  { label: "1 hora", ms: HOUR },
  { label: "1 dia", ms: 24 * HOUR },
  { label: "1 semana", ms: 7 * 24 * HOUR },
];

const Section = styled.div`
  padding: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 6px 8px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const Hint = styled.p`
  margin: 0 6px 8px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ $tone, theme }) => ($tone === "warning" ? theme.colors.warning : theme.colors.textMuted)};
  line-height: 1.45;
`;

const Label = styled.p`
  margin: 0 6px 6px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Group = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin: 0 6px;
`;

const Choice = styled.button`
  padding: 8px 4px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled { opacity: 0.5; cursor: default; }
`;

const CustomRow = styled.div`
  display: flex;
  gap: 4px;
  margin: 6px 6px 0;
`;

const DateInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

const SmallButton = styled.button`
  padding: 6px 8px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ $primary, theme }) => ($primary ? theme.colors.primary : theme.colors.border)};
  background: ${({ $primary, theme }) => ($primary ? theme.colors.primary : theme.colors.surface)};
  color: ${({ $primary, $danger, theme }) =>
    $primary ? theme.colors.textInverse : $danger ? theme.colors.danger : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;

  &:hover:not(:disabled) {
    border-color: ${({ $danger, theme }) => ($danger ? theme.colors.danger : theme.colors.primary)};
  }

  &:disabled { opacity: 0.5; cursor: default; }
`;

const LinkList = styled.ul`
  list-style: none;
  margin: 12px 6px 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LinkItem = styled.li`
  padding: 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ $expired, theme }) => ($expired ? theme.colors.surfaceAlt : theme.colors.surface)};
`;

const LinkStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ $expired, theme }) => ($expired ? theme.colors.danger : theme.colors.success)};
`;

const LinkWhen = styled.div`
  margin: 2px 0 8px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const LinkUrl = styled.code`
  display: block;
  margin-bottom: 8px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const QrOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: ${({ theme }) => theme.colors.overlay};
`;

const QrCard = styled.div`
  position: relative;
  width: 100%;
  max-width: 340px;
  padding: 20px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.modal};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
`;

const QrTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

/* Blanco siempre, tambien en tema oscuro: un QR claro sobre oscuro no lo leen todos los moviles. */
const QrImageBox = styled.div`
  width: 256px;
  height: 256px;
  padding: 8px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;

  img { width: 100%; height: 100%; image-rendering: pixelated; }
`;

const QrClose = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  display: inline-flex;

  &:hover { color: ${({ theme }) => theme.colors.text}; }
`;

/** Nombre de archivo sin caracteres raros: "qr-encuesta-de-satisfaccion.png". */
function qrFileName(title, token) {
  const base = (title || token)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `qr-${base || token}.png`;
}

/**
 * Codigo QR de un enlace, para imprimirlo o proyectarlo. Se genera en el
 * navegador: la direccion no sale a ningun servicio externo.
 */
function QrModal({ link, formTitle, onClose }) {
  const url = linkUrl(link.token);
  const [dataUrl, setDataUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    // 1024 px para que al imprimirlo en grande siga nitido.
    QRCode.toDataURL(url, { width: 1024, margin: 2, errorCorrectionLevel: "M" })
      .then((result) => { if (alive) setDataUrl(result); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [url]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const download = () => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = qrFileName(formTitle, link.token);
    a.click();
  };

  return createPortal(
    <QrOverlay onClick={onClose}>
      <QrCard role="dialog" aria-modal="true" aria-label="Codigo QR del enlace" onClick={(e) => e.stopPropagation()}>
        <QrClose type="button" onClick={onClose} aria-label="Cerrar"><FiX size={16} /></QrClose>
        <QrTitle>Codigo QR</QrTitle>
        <QrImageBox>
          {dataUrl ? <img src={dataUrl} alt={`Codigo QR de ${url}`} /> : failed ? null : <Spinner $size={20} />}
        </QrImageBox>
        {failed && <Hint $tone="warning">No se pudo generar el codigo QR.</Hint>}
        <Hint>
          Vence el {formatDate(link.expiresAt)}. Despues el QR deja de abrir el formulario,
          salvo que le cambies la hora al enlace.
        </Hint>
        <SmallButton type="button" $primary disabled={!dataUrl} onClick={download}>
          <FiDownload size={11} /> Descargar PNG
        </SmallButton>
      </QrCard>
    </QrOverlay>,
    document.body
  );
}

/** "2026-09-16T14:30" en hora local, el formato de <input type="datetime-local">. */
function toLocalInput(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(value) {
  return new Date(value).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" });
}

/** "en 45 min", "en 3 h", "en 2 dias", o "hace 10 min" si ya paso. */
function relative(value, now) {
  const diff = new Date(value).getTime() - now;
  const abs = Math.abs(diff);
  const minutes = Math.round(abs / 60000);

  let text;
  if (minutes < 1) text = "menos de 1 min";
  else if (minutes < 60) text = `${minutes} min`;
  else if (minutes < 48 * 60) text = `${Math.round(minutes / 60)} h`;
  else text = `${Math.round(minutes / (24 * 60))} dias`;

  return diff >= 0 ? `en ${text}` : `hace ${text}`;
}

export async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Sin permiso de portapapeles (por ejemplo sin https): se muestra para copiar a mano.
    window.prompt("Copia el enlace:", text);
    return false;
  }
}

/**
 * Enlaces para responder sin iniciar sesion, con hora de vencimiento. Vencido
 * un enlace solo cae ese enlace: el formulario sigue abierto y se puede crear
 * otro, o cambiarle la hora para volver a abrirlo.
 */
function FormLinksPanel({ formId, isPublished, formTitle }) {
  const toast = useToast();

  const [links, setLinks] = useState([]);
  // loading | ready | error
  const [status, setStatus] = useState("loading");
  const [creating, setCreating] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [qrLink, setQrLink] = useState(null);
  const closeQr = useCallback(() => setQrLink(null), []);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async (signal) => {
    try {
      setLinks(await linksApi.list(formId, { signal }));
      setStatus("ready");
    } catch (err) {
      if (err.name === "AbortError") return;
      setStatus("error");
    }
  }, [formId]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // "Vence en ..." se mantiene al dia, y un enlace pasa a vencido sin recargar.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const create = async (expiresAt) => {
    if (creating) return;

    setCreating(true);
    try {
      const link = await linksApi.create(formId, expiresAt.toISOString());
      setLinks((list) => [link, ...list]);
      setNow(Date.now());
      setCustomOpen(false);

      const copied = await copy(linkUrl(link.token));
      if (copied) {
        setCopiedId(link.id);
        toast.success(`Enlace creado y copiado. Vence el ${formatDate(link.expiresAt)}.`);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const createCustom = () => {
    if (!customValue) return;
    create(new Date(customValue));
  };

  const startEdit = (link) => {
    setEditingId(link.id);
    // Si ya vencio, se propone una hora desde ahora para reabrirlo.
    const base = new Date(link.expiresAt).getTime() > Date.now() ? link.expiresAt : Date.now() + HOUR;
    setEditValue(toLocalInput(base));
  };

  const saveExpiry = async (link, expiresAt) => {
    setBusyId(link.id);
    try {
      const updated = await linksApi.updateExpiry(formId, link.id, expiresAt.toISOString());
      setLinks((list) => list.map((l) => (l.id === link.id ? updated : l)));
      setNow(Date.now());
      setEditingId(null);
      toast.success(`Ahora vence el ${formatDate(updated.expiresAt)}.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (link) => {
    setBusyId(link.id);
    try {
      await linksApi.remove(formId, link.id);
      setLinks((list) => list.filter((l) => l.id !== link.id));
      toast.info("Enlace anulado: ya no abre el formulario.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleCopy = async (link) => {
    if (await copy(linkUrl(link.token))) {
      setCopiedId(link.id);
      toast.success("Enlace copiado.");
    }
  };

  return (
    <Section>
      <Title><FiLink size={12} /> Enlace para responder</Title>

      <Hint>
        Quien tenga el enlace responde sin iniciar sesion hasta la hora de vencimiento.
        Al vencer solo cae ese enlace; el formulario sigue abierto.
      </Hint>

      {!isPublished && (
        <Hint $tone="warning">Publica el formulario para que los enlaces funcionen.</Hint>
      )}

      <Label>Nuevo enlace que vence en:</Label>
      <Group>
        {DURATIONS.map((d) => (
          <Choice
            key={d.label}
            type="button"
            disabled={creating}
            onClick={() => create(new Date(Date.now() + d.ms))}
          >
            {d.label}
          </Choice>
        ))}
      </Group>

      {customOpen ? (
        <CustomRow>
          <DateInput
            type="datetime-local"
            value={customValue}
            min={toLocalInput(Date.now())}
            onChange={(e) => setCustomValue(e.target.value)}
            aria-label="Fecha y hora de vencimiento"
          />
          <SmallButton type="button" $primary disabled={!customValue || creating} onClick={createCustom}>
            Crear
          </SmallButton>
        </CustomRow>
      ) : (
        <CustomRow>
          <SmallButton
            type="button"
            onClick={() => { setCustomValue(toLocalInput(Date.now() + 2 * HOUR)); setCustomOpen(true); }}
          >
            <FiPlus size={11} /> Otra fecha y hora
          </SmallButton>
          {creating && <Spinner $size={14} />}
        </CustomRow>
      )}

      {status === "error" && <Hint $tone="warning">No se pudieron cargar los enlaces.</Hint>}

      {links.length > 0 && (
        <LinkList>
          {links.map((link) => {
            const expired = new Date(link.expiresAt).getTime() <= now;
            const busy = busyId === link.id;

            return (
              <LinkItem key={link.id} $expired={expired}>
                <LinkStatus $expired={expired}>
                  <FiClock size={12} />
                  {expired ? "Vencido" : "Vigente"}
                </LinkStatus>
                <LinkWhen>
                  {expired ? "Vencio" : "Vence"} {relative(link.expiresAt, now)} · {formatDate(link.expiresAt)}
                </LinkWhen>
                <LinkUrl title={linkUrl(link.token)}>{linkUrl(link.token)}</LinkUrl>

                {editingId === link.id ? (
                  <>
                    <CustomRow style={{ margin: "0 0 6px" }}>
                      <DateInput
                        type="datetime-local"
                        value={editValue}
                        min={toLocalInput(Date.now())}
                        onChange={(e) => setEditValue(e.target.value)}
                        aria-label="Nueva hora de vencimiento"
                      />
                    </CustomRow>
                    <Actions>
                      <SmallButton type="button" disabled={busy} onClick={() => saveExpiry(link, new Date(Date.now() + HOUR))}>
                        1 hora desde ahora
                      </SmallButton>
                      <SmallButton type="button" $primary disabled={busy || !editValue} onClick={() => saveExpiry(link, new Date(editValue))}>
                        Guardar
                      </SmallButton>
                      <SmallButton type="button" disabled={busy} onClick={() => setEditingId(null)}>
                        Cancelar
                      </SmallButton>
                    </Actions>
                  </>
                ) : (
                  <Actions>
                    <SmallButton type="button" disabled={expired} onClick={() => handleCopy(link)}>
                      {copiedId === link.id ? <FiCheck size={11} /> : <FiCopy size={11} />} Copiar
                    </SmallButton>
                    <SmallButton
                      type="button"
                      disabled={expired}
                      onClick={() => setQrLink(link)}
                      title="Codigo QR para imprimir o proyectar"
                    >
                      <MdQrCode2 size={12} /> QR
                    </SmallButton>
                    <SmallButton type="button" disabled={busy} onClick={() => startEdit(link)}>
                      <FiClock size={11} /> {expired ? "Reabrir" : "Cambiar hora"}
                    </SmallButton>
                    <SmallButton
                      type="button"
                      $danger
                      disabled={busy}
                      onClick={() => remove(link)}
                      title="Anular el enlace ahora"
                      aria-label="Anular enlace"
                    >
                      <FiTrash2 size={11} />
                    </SmallButton>
                  </Actions>
                )}
              </LinkItem>
            );
          })}
        </LinkList>
      )}

      {qrLink && <QrModal link={qrLink} formTitle={formTitle} onClose={closeQr} />}
    </Section>
  );
}

export default FormLinksPanel;
