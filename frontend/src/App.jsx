import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import theme from "./styles/theme";
import GlobalStyles from "./styles/GlobalStyles";
import { FormProvider } from "./context/FormContext";
import MainLayout from "./components/templates/MainLayout";
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
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <FormProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/formularios" element={<Forms />} />
              <Route path="/plantillas" element={<Templates />} />
              <Route path="/compartidos" element={<Shared />} />
              <Route path="/papelera" element={<Trash />} />
              <Route path="/configuracion" element={<Settings />} />
            </Route>
            <Route path="/formularios/:id/editar" element={<FormBuilder />} />
            <Route path="/formularios/:id/vista" element={<FormView />} />
            <Route path="/formularios/:id/resultados" element={<FormResults />} />
          </Routes>
        </BrowserRouter>
      </FormProvider>
    </ThemeProvider>
  );
}

export default App;
