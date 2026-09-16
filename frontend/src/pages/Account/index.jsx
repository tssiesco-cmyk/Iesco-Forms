import { useState } from "react";
import { FiUser, FiMail, FiShield, FiLock, FiLogOut } from "react-icons/fi";
import Avatar from "../../components/atoms/Avatar";
import Button from "../../components/atoms/Button";
import Spinner from "../../components/atoms/Spinner";
import {
  Page, Header, HeaderInfo, Section, SectionTitle,
  Option, OptionInfo, OptionIcon, OptionText,
  Fields, FieldRow, FieldError, FieldActions,
} from "../../components/molecules/SettingsPanel";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { accountApi } from "../../services/api";

const MIN_PASSWORD = 8;

function initialsOf(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Nombre editable en la propia fila: no merece un modal. */
function NameOption() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const start = () => {
    setName(user?.displayName ?? "");
    setEditing(true);
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;

    if (trimmed === user?.displayName) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      updateProfile(await accountApi.update(trimmed));
      toast.success("Nombre actualizado.");
      setEditing(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <Option>
        <OptionInfo>
          <OptionIcon><FiUser size={16} /></OptionIcon>
          <OptionText>
            <strong>Nombre</strong>
            <span>{user?.displayName ?? "-"}</span>
          </OptionText>
        </OptionInfo>
        <Button $variant="secondary" $size="sm" onClick={start}>Editar</Button>
      </Option>
    );
  }

  return (
    <Option>
      <Fields $flush style={{ flex: 1 }}>
        <div>
          <label htmlFor="account-name">Nombre</label>
          <input
            id="account-name"
            value={name}
            maxLength={150}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
          />
        </div>
        <FieldActions>
          <Button $variant="secondary" $size="sm" onClick={() => setEditing(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button $size="sm" onClick={save} disabled={saving || !name.trim()}>
            {saving && <Spinner $size={12} $color="currentColor" />}
            Guardar
          </Button>
        </FieldActions>
      </Fields>
    </Option>
  );
}

function PasswordSection() {
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setOpen(false);
    setCurrent("");
    setNext("");
    setConfirm("");
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;

    if (!current) return setError("Escribe tu contrasena actual.");
    if (next.length < MIN_PASSWORD) return setError(`La contrasena nueva debe tener al menos ${MIN_PASSWORD} caracteres.`);
    if (next !== confirm) return setError("Las contrasenas nuevas no coinciden.");
    if (next === current) return setError("La contrasena nueva tiene que ser distinta de la actual.");

    setError("");
    setSaving(true);
    try {
      await accountApi.changePassword(current, next);
      toast.success("Contrasena cambiada.");
      reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section>
      <SectionTitle><h2>Seguridad</h2></SectionTitle>

      {!open ? (
        <Option>
          <OptionInfo>
            <OptionIcon><FiLock size={16} /></OptionIcon>
            <OptionText>
              <strong>Contrasena</strong>
              <span>Te pediremos la actual antes de cambiarla.</span>
            </OptionText>
          </OptionInfo>
          <Button $variant="secondary" $size="sm" onClick={() => setOpen(true)}>
            Cambiar contrasena
          </Button>
        </Option>
      ) : (
        <form onSubmit={submit}>
          <Fields>
            <div>
              <label htmlFor="pwd-current">Contrasena actual</label>
              <input
                id="pwd-current"
                type="password"
                autoComplete="current-password"
                value={current}
                autoFocus
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>
            <FieldRow>
              <div>
                <label htmlFor="pwd-new">Contrasena nueva</label>
                <input
                  id="pwd-new"
                  type="password"
                  autoComplete="new-password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="pwd-confirm">Repite la contrasena nueva</label>
                <input
                  id="pwd-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            </FieldRow>
            {error && <FieldError role="alert">{error}</FieldError>}
            <FieldActions>
              <Button type="button" $variant="secondary" $size="sm" onClick={reset} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" $size="sm" disabled={saving}>
                {saving && <Spinner $size={12} $color="currentColor" />}
                Guardar contrasena
              </Button>
            </FieldActions>
          </Fields>
        </form>
      )}
    </Section>
  );
}

function Account() {
  const { user, logout } = useAuth();

  return (
    <Page>
      <Header>
        <Avatar $size={56}>{initialsOf(user?.displayName)}</Avatar>
        <HeaderInfo>
          <h1>Mi cuenta</h1>
          <p>Tus datos y tu contrasena.</p>
        </HeaderInfo>
      </Header>

      <Section>
        <SectionTitle><h2>Perfil</h2></SectionTitle>
        <NameOption />
        <Option>
          <OptionInfo>
            <OptionIcon><FiMail size={16} /></OptionIcon>
            <OptionText>
              <strong>Correo electronico</strong>
              <span>{user?.email ?? "-"}</span>
            </OptionText>
          </OptionInfo>
        </Option>
        <Option>
          <OptionInfo>
            <OptionIcon><FiShield size={16} /></OptionIcon>
            <OptionText>
              <strong>Rol</strong>
              <span>{user?.role ?? "-"}</span>
            </OptionText>
          </OptionInfo>
        </Option>
      </Section>

      <PasswordSection />

      <Section>
        <SectionTitle><h2>Sesion</h2></SectionTitle>
        <Option>
          <OptionInfo>
            <OptionIcon><FiLogOut size={16} /></OptionIcon>
            <OptionText>
              <strong>Cerrar sesion</strong>
              <span>Saldras de la aplicacion en este navegador.</span>
            </OptionText>
          </OptionInfo>
          <Button $variant="danger" $size="sm" onClick={logout}>
            <FiLogOut size={14} /> Cerrar sesion
          </Button>
        </Option>
      </Section>
    </Page>
  );
}

export default Account;
