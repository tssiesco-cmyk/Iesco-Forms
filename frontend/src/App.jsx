import { BrowserRouter, Routes, Route } from "react-router-dom";
import GlobalStyles from "./styles/GlobalStyles";
import { ThemeModeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { FormProvider } from "./context/FormContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/templates/MainLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Forms from "./pages/Forms";
import FormBuilder from "./pages/FormBuilder";
import FormView from "./pages/FormView";
import FormResults from "./pages/FormResults";
import Templates from "./pages/Templates";
import Shared from "./pages/Shared";
import Trash from "./pages/Trash";
import Settings from "./pages/Settings";

function App() {
  return (
    <ThemeModeProvider>
      <GlobalStyles />
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <NotificationsProvider>
            <Routes>
              {/* Publicas: portada, entrar, y responder un formulario publicado. */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/formularios/:id/vista"
                element={
                  <FormProvider>
                    <FormView />
                  </FormProvider>
                }
              />

              {/* Todo lo demas exige sesion. FormProvider vive aqui dentro para
                  que no pida datos antes de saber si hay usuario. */}
              <Route element={<ProtectedRoute />}>
                <Route
                  element={
                    <FormProvider>
                      <MainLayout />
                    </FormProvider>
                  }
                >
                  <Route path="/panel" element={<Home />} />
                  <Route path="/formularios" element={<Forms />} />
                  <Route path="/plantillas" element={<Templates />} />
                  <Route path="/compartidos" element={<Shared />} />
                  <Route path="/papelera" element={<Trash />} />
                  <Route path="/configuracion" element={<Settings />} />
                </Route>

                <Route
                  path="/formularios/:id/editar"
                  element={
                    <FormProvider>
                      <FormBuilder />
                    </FormProvider>
                  }
                />
                <Route
                  path="/formularios/:id/resultados"
                  element={
                    <FormProvider>
                      <FormResults />
                    </FormProvider>
                  }
                />
              </Route>
            </Routes>
            </NotificationsProvider>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeModeProvider>
  );
}

export default App;
