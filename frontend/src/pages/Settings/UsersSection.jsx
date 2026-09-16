import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { FiUserPlus, FiX, FiKey, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import Button from "../../components/atoms/Button";
import Badge from "../../components/atoms/Badge";
import Spinner from "../../components/atoms/Spinner";
import {
  Section, SectionTitle, Fields, FieldRow, FieldError,
  ModalOverlay, Modal, ModalHeader, ModalBody, ModalActions,
} from "../../components/molecules/SettingsPanel";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { usersApi } from "../../services/api";

const ROLES = ["Administrador", "Editor"];
const MIN_PASSWORD = 8;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Row = styled.li`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px 16px;
  padding: 14px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  opacity: ${({ $inactive }) => ($inactive ? 0.6 : 1)};

  &:last-child { border-bottom: none; }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Identity = styled.div`
  min-width: 0;

  strong {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
  }

  span {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.md};
    color: ${({ theme }) => theme.colors.textMuted};
    overflow-wrap: anywhere;
  }
`;

const RoleSelect = styled.select`
  padding: 6px 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-family: inherit;

  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const RowActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const Message = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 32px 24px;
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  flex-wrap: wrap;
`;

const Notice = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 16px 24px 4px;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.warningBg};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: 1.45;

  svg { color: ${({ theme }) => theme.colors.warning}; flex-shrink: 0; margin-top: 2px; }
`;

const formatDate = (value) =>
  new Date(value).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" });

const emptyDraft = { displayName: "", email: "", role: "Editor", password: "", confirm: "" };

function CreateUserModal({ onClose, onCreated }) {
  const toast = useToast();
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;

    if (!draft.displayName.trim()) return setError("Escribe el nombre.");
    if (!draft.email.trim()) return setError("Escribe el correo.");
    if (draft.password.length < MIN_PASSWORD) return setError(`La contrasena debe tener al menos ${MIN_PASSWORD} caracteres.`);
    if (draft.password !== draft.confirm) return setError("Las contrasenas no coinciden.");

    setError("");
    setSaving(true);
    try {
      const created = await usersApi.create({
        displayName: draft.displayName.trim(),
        email: draft.email.trim(),
        role: draft.role,
        password: draft.password,
      });
      toast.success(`Usuario ${created.email} creado.`);
      onCreated(created);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <ModalOverlay onClick={saving ? undefined : onClose}>
      <Modal role="dialog" aria-modal="true" aria-labelledby="create-user-title" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={submit}>
          <ModalHeader>
            <h2 id="create-user-title">Nuevo usuario</h2>
            <Button type="button" $variant="ghost" onClick={onClose} aria-label="Cerrar" disabled={saving}>
              <FiX size={18} />
            </Button>
          </ModalHeader>
          <ModalBody>
            <Fields $flush>
              <div>
                <label htmlFor="new-user-name">Nombre</label>
                <input id="new-user-name" value={draft.displayName} maxLength={150} autoFocus onChange={set("displayName")} />
              </div>
              <div>
                <label htmlFor="new-user-email">Correo electronico</label>
                <input id="new-user-email" type="email" value={draft.email} maxLength={256} autoComplete="off" onChange={set("email")} />
              </div>
              <div>
                <label htmlFor="new-user-role">Rol</label>
                <select id="new-user-role" value={draft.role} onChange={set("role")}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <FieldRow>
                <div>
                  <label htmlFor="new-user-password">Contrasena</label>
                  <input id="new-user-password" type="password" autoComplete="new-password" value={draft.password} onChange={set("password")} />
                </div>
                <div>
                  <label htmlFor="new-user-confirm">Repite la contrasena</label>
                  <input id="new-user-confirm" type="password" autoComplete="new-password" value={draft.confirm} onChange={set("confirm")} />
                </div>
              </FieldRow>
              {error && <FieldError role="alert">{error}</FieldError>}
            </Fields>
          </ModalBody>
          <ModalActions>
            <Button type="button" $variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Spinner $size={13} $color="currentColor" />}
              {saving ? "Creando..." : "Crear usuario"}
            </Button>
          </ModalActions>
        </form>
      </Modal>
    </ModalOverlay>
  );
}

function ResetPasswordModal({ target, onClose, onDone }) {
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;

    if (password.length < MIN_PASSWORD) return setError(`La contrasena debe tener al menos ${MIN_PASSWORD} caracteres.`);
    if (password !== confirm) return setError("Las contrasenas no coinciden.");

    setError("");
    setSaving(true);
    try {
      await usersApi.resetPassword(target.id, password);
      toast.success(`Contrasena de ${target.email} restablecida.`);
      onDone();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <ModalOverlay onClick={saving ? undefined : onClose}>
      <Modal role="dialog" aria-modal="true" aria-labelledby="reset-title" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={submit}>
          <ModalHeader>
            <h2 id="reset-title">Restablecer contrasena</h2>
            <Button type="button" $variant="ghost" onClick={onClose} aria-label="Cerrar" disabled={saving}>
              <FiX size={18} />
            </Button>
          </ModalHeader>
          <ModalBody>
            <Fields $flush>
              <p style={{ margin: 0 }}>
                Nueva contrasena para <strong>{target.displayName}</strong> ({target.email}).
                Tendras que hacersela llegar tu mismo.
              </p>
              <div>
                <label htmlFor="reset-password">Contrasena nueva</label>
                <input id="reset-password" type="password" autoComplete="new-password" value={password} autoFocus onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div>
                <label htmlFor="reset-confirm">Repite la contrasena</label>
                <input id="reset-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              {error && <FieldError role="alert">{error}</FieldError>}
            </Fields>
          </ModalBody>
          <ModalActions>
            <Button type="button" $variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Spinner $size={13} $color="currentColor" />}
              Guardar
            </Button>
          </ModalActions>
        </form>
      </Modal>
    </ModalOverlay>
  );
}

function UsersSection() {
  const { user: me } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  // loading | ready | error
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);

  const load = useCallback(async (signal) => {
    setStatus("loading");
    try {
      setUsers(await usersApi.list({ signal }));
      setStatus("ready");
    } catch (err) {
      if (err.name === "AbortError") return;
      setLoadError(err.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const replace = (updated) =>
    setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));

  const dismissRequest = async (target) => {
    setBusyId(target.id);
    try {
      replace(await usersApi.dismissPasswordRequest(target.id));
      toast.info(`Solicitud de ${target.displayName} descartada.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  // Quien pidio contrasena nueva sube arriba: es lo que el administrador viene a atender.
  const pending = users.filter((u) => u.passwordResetRequestedAt);
  const sorted = [...pending, ...users.filter((u) => !u.passwordResetRequestedAt)];

  const change = async (target, changes, successMessage) => {
    setBusyId(target.id);
    try {
      replace(await usersApi.update(target.id, changes));
      toast.success(successMessage);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Section>
      <SectionTitle>
        <div>
          <h2>Usuarios</h2>
          <p>Solo los administradores ven este apartado.</p>
        </div>
        <Button $size="sm" onClick={() => setCreating(true)}>
          <FiUserPlus size={14} /> Nuevo usuario
        </Button>
      </SectionTitle>

      {status === "loading" && (
        <Message><Spinner $size={16} /> Cargando usuarios...</Message>
      )}

      {status === "error" && (
        <Message>
          {loadError}
          <Button $variant="secondary" $size="sm" onClick={() => load()}>
            <FiRefreshCw size={13} /> Reintentar
          </Button>
        </Message>
      )}

      {status === "ready" && pending.length > 0 && (
        <Notice role="status">
          <FiAlertCircle size={16} />
          <span>
            {pending.length === 1
              ? "1 usuario olvido su contrasena."
              : `${pending.length} usuarios olvidaron su contrasena.`}{" "}
            Pulsa <strong>Contrasena</strong> en su fila para ponerle una nueva y hazsela llegar.
            Si no reconoces la solicitud, descartala.
          </span>
        </Notice>
      )}

      {status === "ready" && (
        <List>
          {sorted.map((u) => {
            const isMe = u.id === me?.id;
            const busy = busyId === u.id;

            return (
              <Row key={u.id} $inactive={!u.isActive}>
                <Identity>
                  <strong>
                    {u.displayName}
                    {isMe && <Badge>Tu</Badge>}
                    {!u.isActive && <Badge $variant="danger">Desactivado</Badge>}
                    {u.passwordResetRequestedAt && (
                      <Badge $variant="warning" title={`Pedida el ${formatDate(u.passwordResetRequestedAt)}`}>
                        Pidio contrasena nueva
                      </Badge>
                    )}
                  </strong>
                  <span>{u.email}</span>
                </Identity>

                {/* Uno mismo no puede cambiarse el rol: se quedaria fuera de esta pantalla. */}
                <RoleSelect
                  aria-label={`Rol de ${u.displayName}`}
                  value={u.role}
                  disabled={isMe || busy}
                  title={isMe ? "No puedes cambiar tu propio rol" : undefined}
                  onChange={(e) => change(u, { role: e.target.value }, `${u.displayName} ahora es ${e.target.value}.`)}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </RoleSelect>

                <RowActions>
                  {u.passwordResetRequestedAt && (
                    <Button
                      $variant="ghost"
                      $size="sm"
                      onClick={() => dismissRequest(u)}
                      disabled={busy}
                      title="Descartar la solicitud sin cambiar la contrasena"
                    >
                      Descartar
                    </Button>
                  )}
                  <Button
                    $variant="secondary"
                    $size="sm"
                    onClick={() => setResetTarget(u)}
                    disabled={busy}
                    title="Restablecer contrasena"
                  >
                    <FiKey size={13} /> Contrasena
                  </Button>
                  <Button
                    $variant={u.isActive ? "danger" : "secondary"}
                    $size="sm"
                    disabled={isMe || busy}
                    title={isMe ? "No puedes desactivar tu propia cuenta" : undefined}
                    onClick={() => change(
                      u,
                      { isActive: !u.isActive },
                      u.isActive ? `${u.displayName} ya no puede entrar.` : `${u.displayName} puede volver a entrar.`
                    )}
                  >
                    {busy && <Spinner $size={12} $color="currentColor" />}
                    {u.isActive ? "Desactivar" : "Activar"}
                  </Button>
                </RowActions>
              </Row>
            );
          })}
        </List>
      )}

      {creating && (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onCreated={(created) => {
            setUsers((list) =>
              [...list, created].sort((a, b) => a.displayName.localeCompare(b.displayName))
            );
            setCreating(false);
          }}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          target={resetTarget}
          onClose={() => setResetTarget(null)}
          onDone={() => {
            // El servidor ya cerro la solicitud; aqui solo se refleja.
            replace({ ...resetTarget, passwordResetRequestedAt: undefined });
            setResetTarget(null);
          }}
        />
      )}
    </Section>
  );
}

export default UsersSection;
