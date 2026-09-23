import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertTriangle, FiArrowRight, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useThemeMode } from "../../context/ThemeContext";
import { authApi } from "../../services/api";
import Button from "../../components/atoms/Button";
import Spinner from "../../components/atoms/Spinner";
import logo from "../../assets/logoiescogroup.png";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
`;

/**
 * Vuelve siempre a la portada, no al historial: a esta pantalla se puede llegar
 * de varias formas (desde la portada, tecleando la URL, o redirigido al caducar
 * la sesion) y "atras" llevaria a sitios distintos cada vez.
 */
const BackButton = styled.button`
  position: absolute;
  top: 24px;
  left: 24px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 13px 8px 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.text};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    top: 12px;
    left: 12px;
  }
`;

const Card = styled.div`
  width: 100%;
  max-width: 400px;
  animation: ${fadeUp} 0.35s ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Brand = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  margin-bottom: 32px;
`;

const Logo = styled.img`
  width: 52px;
  height: 52px;
  object-fit: contain;
  /* El logo es blanco sobre transparente: en tema claro se invierte a negro. */
  filter: ${({ theme }) => (theme.mode === "light" ? "invert(1)" : "none")};
`;

const BrandName = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes["2xl"]};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  letter-spacing: -0.4px;
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: -8px 0 0;
  text-align: center;
`;

const Form = styled.form`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  height: 44px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ $invalid, theme }) =>
    $invalid ? theme.colors.danger : theme.colors.borderInput};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: border-color 0.15s ease;

  &:focus-within {
    border-color: ${({ $invalid, theme }) =>
      $invalid ? theme.colors.danger : theme.colors.borderFocus};
  }
`;

const InputIcon = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text};

  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`;

const RevealButton = styled.button`
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 2px;

  &:hover { color: ${({ theme }) => theme.colors.text}; }
`;

const FieldError = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.danger};
`;

const Remember = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  user-select: none;

  input {
    width: 15px;
    height: 15px;
    accent-color: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
  }
`;

const Alert = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.dangerBg};
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: 1.45;
`;

const SubmitButton = styled(Button)`
  height: 44px;
  width: 100%;
  margin-top: 4px;
`;

const OptionsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const LinkButton = styled.button`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover { color: ${({ theme }) => theme.colors.text}; }
`;

const Success = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.successBg};
  color: ${({ theme }) => theme.colors.success};
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: 1.45;
`;

const Explanation = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
`;

/**
 * "Olvide mi contrasena". Todavia no hay servidor de correo, asi que no envia
 * un enlace: deja una solicitud que los administradores ven en Configuracion >
 * Usuarios, y ellos le ponen una contrasena nueva.
 *
 * El mensaje de exito es el mismo exista o no el correo, igual que en el
 * servidor: si no, esta pantalla serviria para averiguar que cuentas hay.
 */
function ForgotPassword({ initialEmail, onBack }) {
  const [email, setEmail] = useState(initialEmail);
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const emailInvalid = touched && !email.trim();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (sending) return;

    setTouched(true);
    if (!email.trim()) return;

    setSending(true);
    setError(null);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Form as="div">
        <Success role="status">
          <FiCheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Solicitud enviada. Si <strong>{email.trim()}</strong> tiene una cuenta, un
            administrador te pondra una contrasena nueva y te la hara llegar.
          </span>
        </Success>
        <SubmitButton type="button" $variant="secondary" onClick={onBack}>
          <FiArrowLeft size={16} /> Volver a entrar
        </SubmitButton>
      </Form>
    );
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <Explanation>
        Escribe tu correo. Un administrador recibira la solicitud y te dara una
        contrasena nueva.
      </Explanation>

      {error && (
        <Alert role="alert">
          <FiAlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            {error.isNetwork
              ? "No se pudo conectar con el servidor. Comprueba que el backend este corriendo."
              : error.status === 429
                ? "Demasiadas solicitudes seguidas. Espera unos minutos y vuelve a intentarlo."
                : error.message}
          </span>
        </Alert>
      )}

      <Field>
        <Label htmlFor="forgot-email">Correo electronico</Label>
        <InputWrapper $invalid={emailInvalid}>
          <InputIcon><FiMail size={16} /></InputIcon>
          <Input
            id="forgot-email"
            type="email"
            autoComplete="username"
            placeholder="ejemplo@iescogroup.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            autoFocus
          />
        </InputWrapper>
        {emailInvalid && <FieldError>Escribe tu correo.</FieldError>}
      </Field>

      <SubmitButton type="submit" disabled={sending}>
        {sending ? <Spinner $size={15} $color="currentColor" /> : null}
        {sending ? "Enviando..." : "Enviar solicitud"}
      </SubmitButton>

      <LinkButton type="button" onClick={onBack} style={{ alignSelf: "center" }}>
        Volver a entrar
      </LinkButton>
    </Form>
  );
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  useThemeMode();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [forgotten, setForgotten] = useState(false);

  const emailInvalid = touched.email && !email.trim();
  const passwordInvalid = touched.password && !password;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setTouched({ email: true, password: true });
    if (!email.trim() || !password) return;

    setSubmitting(true);
    setError(null);

    const result = await login(email.trim(), password, rememberMe);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      setPassword("");
      return;
    }

    // Si llego aqui redirigido desde una ruta protegida, lo devolvemos alli.
    const target = location.state?.from ?? "/panel";
    navigate(target, { replace: true });
  };

  return (
    <Page>
      <BackButton onClick={() => navigate("/")}>
        <FiArrowLeft size={16} /> Volver
      </BackButton>

      <Card>
        <Brand>
          <Logo src={logo} alt="IESCO" />
          <BrandName>IESCO Forms</BrandName>
          <Subtitle>
            {forgotten ? "Recupera el acceso a tu cuenta." : "Entra para gestionar tus formularios."}
          </Subtitle>
        </Brand>

        {forgotten ? (
          <ForgotPassword initialEmail={email} onBack={() => setForgotten(false)} />
        ) : (
        <Form onSubmit={handleSubmit} noValidate>
          {error && (
            <Alert role="alert">
              <FiAlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                {error.isNetwork
                  ? "No se pudo conectar con el servidor. Comprueba que el backend este corriendo."
                  : error.status === 429
                    // El bloqueo por cuenta trae su mensaje con los minutos que
                    // faltan; el limite por IP responde sin cuerpo ("Error 429").
                    ? (error.message && !error.message.startsWith("Error ")
                      ? error.message
                      : "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.")
                    : error.message}
              </span>
            </Alert>
          )}

          <Field>
            <Label htmlFor="email">Correo electronico</Label>
            <InputWrapper $invalid={emailInvalid}>
              <InputIcon><FiMail size={16} /></InputIcon>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="ejemplo@iescogroup.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                autoFocus
              />
            </InputWrapper>
            {emailInvalid && <FieldError>Escribe tu correo.</FieldError>}
          </Field>

          <Field>
            <Label htmlFor="password">Contrasena</Label>
            <InputWrapper $invalid={passwordInvalid}>
              <InputIcon><FiLock size={16} /></InputIcon>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              />
              <RevealButton
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </RevealButton>
            </InputWrapper>
            {passwordInvalid && <FieldError>Escribe tu contrasena.</FieldError>}
          </Field>

          <OptionsRow>
            <Remember>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Mantener la sesion abierta
            </Remember>
            <LinkButton type="button" onClick={() => { setError(null); setForgotten(true); }}>
              Olvidaste tu contrasena?
            </LinkButton>
          </OptionsRow>

          <SubmitButton type="submit" disabled={submitting}>
            {submitting ? <Spinner $size={15} $color="currentColor" /> : null}
            {submitting ? "Entrando..." : "Entrar"}
            {!submitting && <FiArrowRight size={16} />}
          </SubmitButton>
        </Form>
        )}
      </Card>
    </Page>
  );
}

export default Login;
