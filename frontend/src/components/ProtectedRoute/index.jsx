import { Navigate, Outlet, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../atoms/Spinner";

const Center = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background};
`;

/**
 * Envuelve las rutas que exigen sesion.
 *
 * Mientras se comprueba si hay sesion no se decide nada: si mandaramos al login
 * durante ese instante, al recargar una pagina estando conectado veriamos un
 * parpadeo hacia el login antes de volver.
 */
function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "checking") {
    return (
      <Center>
        <Spinner $size={28} />
      </Center>
    );
  }

  if (status !== "authenticated") {
    // Se recuerda a donde queria ir para devolverlo alli tras entrar.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
