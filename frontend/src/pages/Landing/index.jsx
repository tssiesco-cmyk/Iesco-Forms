import { Link, Navigate, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import {
  FiArrowRight, FiEdit3, FiLayout, FiEye, FiBarChart2,
  FiSun, FiMoon, FiCheck, FiLogIn
} from "react-icons/fi";
import { useThemeMode } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/atoms/Button";
import logo from "../../assets/logoiescogroup.png";

/* ===== LAYOUT ===== */

const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 32px;
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 16px;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
`;

const Logo = styled.img`
  width: 30px;
  height: 30px;
  object-fit: contain;
  flex-shrink: 0;
  /* El logo es blanco sobre transparente: en tema claro se invierte a negro. */
  filter: ${({ theme }) => (theme.mode === "light" ? "invert(1)" : "none")};
`;

const BrandName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: -0.3px;
  white-space: nowrap;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Main = styled.main`
  flex: 1;
`;

const Section = styled.section`
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 32px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 20px;
  }
`;

/* ===== HERO ===== */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Hero = styled(Section)`
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 56px;
  align-items: center;
  padding-top: 88px;
  padding-bottom: 88px;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
    gap: 48px;
    padding-top: 56px;
    padding-bottom: 56px;
  }
`;

const HeroText = styled.div`
  animation: ${fadeUp} 0.5s ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Eyebrow = styled.span`
  display: inline-block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 5px 12px;
  border-radius: 20px;
  margin-bottom: 22px;
`;

const Title = styled.h1`
  font-size: clamp(34px, 5vw, 52px);
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  line-height: 1.1;
  letter-spacing: -1.2px;
  margin: 0 0 20px;
`;

const Lead = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
  margin: 0 0 32px;
  max-width: 30em;
`;

const HeroActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const HeroNote = styled.p`
  margin: 22px 0 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  gap: 7px;
`;

/* ===== MAQUETA ===== */

const Mockup = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: 26px;
  animation: ${fadeUp} 0.5s ease 0.1s backwards;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const MockStep = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  display: block;
  margin-bottom: 8px;
`;

const MockQuestion = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin: 0 0 20px;
  line-height: 1.3;
`;

const MockOption = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 15px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.primary : theme.colors.border};
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.primaryBg : "transparent"};
  margin-bottom: 9px;
  font-size: ${({ theme }) => theme.fontSizes.base};
`;

const MockKey = styled.span`
  width: 24px;
  height: 24px;
  border-radius: 5px;
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.primary : theme.colors.surfaceAlt};
  color: ${({ $selected, theme }) =>
    $selected ? theme.colors.textInverse : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const MockFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const MockProgress = styled.div`
  width: 100%;
  height: 4px;
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 20px;

  span {
    display: block;
    height: 100%;
    width: 40%;
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 2px;
  }
`;

/* ===== FUNCIONES ===== */

const Band = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 72px 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 52px 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: clamp(24px, 3vw, 32px);
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: -0.6px;
  margin: 0 0 10px;
  text-align: center;
`;

const SectionLead = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 auto 44px;
  text-align: center;
  max-width: 34em;
  line-height: 1.6;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const Feature = styled.div`
  display: flex;
  flex-direction: column;
  gap: 11px;

  h3 {
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    margin: 0;
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.md};
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.55;
    margin: 0;
  }
`;

const FeatureIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
`;

/* ===== PASOS ===== */

const Steps = styled(Section)`
  padding-top: 72px;
  padding-bottom: 72px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 28px;
    padding-top: 52px;
    padding-bottom: 52px;
  }
`;

const Step = styled.div`
  h3 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    margin: 14px 0 8px;
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.base};
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.6;
    margin: 0;
  }
`;

const StepNumber = styled.span`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textInverse};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  display: flex;
  align-items: center;
  justify-content: center;
`;

/* ===== CIERRE ===== */

const Closing = styled(Section)`
  text-align: center;
  padding-top: 20px;
  padding-bottom: 88px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding-bottom: 56px;
  }
`;

const Footer = styled.footer`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: 26px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};
  flex-wrap: wrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 22px 20px;
    justify-content: center;
    text-align: center;
  }
`;

const FooterLink = styled(Link)`
  color: ${({ theme }) => theme.colors.textSecondary};

  &:hover { color: ${({ theme }) => theme.colors.text}; }
`;

const features = [
  {
    icon: <FiEdit3 size={18} />,
    title: "Constructor visual",
    text: "Texto corto, texto largo, opcion unica y multiple. Ves como queda mientras lo editas.",
  },
  {
    icon: <FiLayout size={18} />,
    title: "Nueve plantillas",
    text: "Satisfaccion, NPS, contacto, registro, evaluacion de desempeno y mas. Listas para usar.",
  },
  {
    icon: <FiEye size={18} />,
    title: "Una pregunta por pantalla",
    text: "Quien responde avanza con Enter, sin formularios largos que abruman.",
  },
  {
    icon: <FiBarChart2 size={18} />,
    title: "Resultados al momento",
    text: "Graficos por pregunta, tabla de respuestas y aviso cuando llega una nueva.",
  },
];

const steps = [
  {
    title: "Crea",
    text: "Empieza desde cero o parte de una plantilla. Se guarda solo mientras escribes.",
  },
  {
    title: "Publica y comparte",
    text: "Publicalo y pasa el enlace. Quien responde no necesita cuenta ni instalar nada.",
  },
  {
    title: "Analiza",
    text: "Mira los resultados en graficos y recibe un aviso cada vez que alguien responde.",
  },
];

function Landing() {
  const navigate = useNavigate();
  const { mode, toggleMode } = useThemeMode();
  const { status } = useAuth();
  const isDark = mode === "dark";

  // Quien ya entro no tiene nada que hacer en la portada.
  // Mientras se comprueba la sesion se muestra la portada igual: es contenido
  // publico y es el caso mas comun, mejor eso que una pantalla en blanco.
  if (status === "authenticated") return <Navigate to="/panel" replace />;

  return (
    <Page>
      <Header>
        <Brand>
          <Logo src={logo} alt="IESCO" />
          <BrandName>IESCO Forms</BrandName>
        </Brand>

        <HeaderActions>
          <IconButton
            onClick={toggleMode}
            title={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
            aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
          >
            {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
          </IconButton>

          <Button onClick={() => navigate("/login")}>
            <FiLogIn size={15} /> Iniciar sesion
          </Button>
        </HeaderActions>
      </Header>

      <Main>
        <Hero>
          <HeroText>
            <Eyebrow>Herramienta interna de IESCO Group</Eyebrow>
            <Title>Formularios que la gente si termina de llenar</Title>
            <Lead>
              Crea encuestas y formularios, compartelos con un enlace y mira los
              resultados mientras llegan. Sin hojas de calculo dando vueltas por
              correo.
            </Lead>

            <HeroActions>
              <Button $size="lg" onClick={() => navigate("/login")}>
                Entrar <FiArrowRight size={16} />
              </Button>
            </HeroActions>

            <HeroNote>
              <FiCheck size={15} /> Quien responde no necesita cuenta.
            </HeroNote>
          </HeroText>

          {/* Maqueta de la pantalla de responder, hecha con CSS para que siga el tema */}
          <Mockup aria-hidden="true">
            <MockProgress><span /></MockProgress>
            <MockStep>Pregunta 2 de 5</MockStep>
            <MockQuestion>Como calificarias nuestro servicio?</MockQuestion>

            <MockOption $selected>
              <MockKey $selected>A</MockKey> Excelente
            </MockOption>
            <MockOption>
              <MockKey>B</MockKey> Bueno
            </MockOption>
            <MockOption>
              <MockKey>C</MockKey> Regular
            </MockOption>

            <MockFooter>
              <span>Presiona Enter ↵</span>
              <span>Siguiente →</span>
            </MockFooter>
          </Mockup>
        </Hero>

        <Band>
          <Section>
            <SectionTitle>Todo lo que necesitas</SectionTitle>
            <SectionLead>
              Desde armar la primera pregunta hasta leer los resultados.
            </SectionLead>

            <Grid>
              {features.map((feature) => (
                <Feature key={feature.title}>
                  <FeatureIcon>{feature.icon}</FeatureIcon>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </Feature>
              ))}
            </Grid>
          </Section>
        </Band>

        <Steps>
          {steps.map((step, index) => (
            <Step key={step.title}>
              <StepNumber>{index + 1}</StepNumber>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </Step>
          ))}
        </Steps>

        <Closing>
          <SectionTitle>Listo para empezar</SectionTitle>
          <SectionLead>
            Entra con tu cuenta de IESCO y crea tu primer formulario en un minuto.
          </SectionLead>
          <Button $size="lg" onClick={() => navigate("/login")}>
            Iniciar sesion <FiArrowRight size={16} />
          </Button>
        </Closing>
      </Main>

      <Footer>
        <span>IESCO Group · {new Date().getFullYear()}</span>
        <FooterLink to="/login">Iniciar sesion</FooterLink>
      </Footer>
    </Page>
  );
}

export default Landing;
