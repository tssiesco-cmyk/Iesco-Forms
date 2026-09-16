import { FiSettings, FiSun, FiMoon } from "react-icons/fi";
import Button from "../../components/atoms/Button";
import {
  Page, Header, HeaderInfo, HeaderIcon, Section, SectionTitle,
  Option, OptionInfo, OptionIcon, OptionText,
} from "../../components/molecules/SettingsPanel";
import { useThemeMode } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import UsersSection from "./UsersSection";

/**
 * Configuracion de la aplicacion. Lo personal (nombre, contrasena, sesion) esta
 * en Mi cuenta. La gestion de usuarios solo se muestra a administradores; el
 * backend lo exige igualmente, esto solo evita ensenar algo que no funcionaria.
 */
function Settings() {
  const { mode, toggleMode } = useThemeMode();
  const { isAdmin } = useAuth();
  const isDark = mode === "dark";

  return (
    <Page>
      <Header>
        <HeaderIcon><FiSettings size={24} /></HeaderIcon>
        <HeaderInfo>
          <h1>Configuracion</h1>
          <p>{isAdmin ? "Preferencias de la aplicacion y gestion de usuarios." : "Preferencias de la aplicacion."}</p>
        </HeaderInfo>
      </Header>

      <Section>
        <SectionTitle><h2>Preferencias</h2></SectionTitle>
        <Option>
          <OptionInfo>
            <OptionIcon>{isDark ? <FiMoon size={16} /> : <FiSun size={16} />}</OptionIcon>
            <OptionText>
              <strong>Tema</strong>
              <span>{isDark ? "Oscuro" : "Claro"}</span>
            </OptionText>
          </OptionInfo>
          <Button $variant="secondary" $size="sm" onClick={toggleMode}>
            {isDark ? <FiSun size={14} /> : <FiMoon size={14} />}
            Cambiar a {isDark ? "claro" : "oscuro"}
          </Button>
        </Option>
      </Section>

      {isAdmin && <UsersSection />}
    </Page>
  );
}

export default Settings;
