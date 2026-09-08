import { useState } from "react";
import "./index.css";

const forms = [
  {
    id: 1,
    title: "Encuesta de satisfacción",
    description: "Conoce la opinión de tus usuarios.",
    responses: 24,
    status: "Activo",
    date: "08 Sep 2026",
  },
  {
    id: 2,
    title: "Evaluación de proyecto",
    description: "Evaluación final del proyecto.",
    responses: 15,
    status: "Activo",
    date: "07 Sep 2026",
  },
  {
    id: 3,
    title: "Registro de participantes",
    description: "Formulario para registrar participantes.",
    responses: 42,
    status: "Cerrado",
    date: "03 Sep 2026",
  },
];

function App() {
  const [activePage, setActivePage] = useState("Inicio");

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="logo">
          <div className="logo-icon">G</div>
          <span>Giesco<span className="logo-light"> Forms</span></span>
        </div>

        <nav className="navigation">

          <button
            className={activePage === "Inicio" ? "nav-item active" : "nav-item"}
            onClick={() => setActivePage("Inicio")}
          >
            <span>⌂</span>
            Inicio
          </button>

          <button
            className={
              activePage === "Formularios"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setActivePage("Formularios")}
          >
            <span>▤</span>
            Mis formularios
          </button>

          <button
            className={
              activePage === "Resultados"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setActivePage("Resultados")}
          >
            <span>▥</span>
            Resultados
          </button>

        </nav>

        <div className="sidebar-bottom">

          <button
            className={
              activePage === "Configuración"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setActivePage("Configuración")}
          >
            <span>⚙</span>
            Configuración
          </button>

          <div className="user">

            <div className="avatar">
              A
            </div>

            <div className="user-info">
              <strong>Adriano</strong>
              <span>Administrador</span>
            </div>

            <span className="more">⋮</span>

          </div>

        </div>

      </aside>


      {/* CONTENIDO PRINCIPAL */}
      <main className="main">

        {/* HEADER */}
        <header className="header">

          <div>
            <h1>Buenos días, Adriano 👋</h1>
            <p>Administra tus formularios desde un solo lugar.</p>
          </div>

          <button className="profile-button">
            A
          </button>

        </header>


        {/* DASHBOARD */}
        {activePage === "Inicio" && (
          <section>

            {/* BOTÓN CREAR */}
            <div className="create-section">

              <div>
                <h2>¿Qué quieres crear?</h2>
                <p>Comienza un nuevo formulario.</p>
              </div>

              <button className="create-button">
                <span>＋</span>
                Crear formulario
              </button>

            </div>


            {/* ESTADÍSTICAS */}
            <div className="stats">

              <div className="stat-card">
                <div className="stat-icon">▤</div>
                <div>
                  <span>Formularios</span>
                  <strong>12</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">●</div>
                <div>
                  <span>Activos</span>
                  <strong>8</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">↗</div>
                <div>
                  <span>Respuestas</span>
                  <strong>324</strong>
                </div>
              </div>

            </div>


            {/* FORMULARIOS */}
            <div className="forms-header">

              <div>
                <h2>Mis formularios</h2>
                <p>Gestiona tus formularios recientes.</p>
              </div>

              <button className="view-all">
                Ver todos →
              </button>

            </div>


            <div className="forms-list">

              {forms.map((form) => (

                <div className="form-card" key={form.id}>

                  <div className="form-icon">
                    ▤
                  </div>

                  <div className="form-content">

                    <div className="form-title">
                      <h3>{form.title}</h3>

                      <span
                        className={
                          form.status === "Activo"
                            ? "status active-status"
                            : "status closed-status"
                        }
                      >
                        ● {form.status}
                      </span>
                    </div>

                    <p>{form.description}</p>

                    <div className="form-meta">

                      <span>
                        ◉ {form.responses} respuestas
                      </span>

                      <span>
                        ◷ {form.date}
                      </span>

                    </div>

                  </div>

                  <button className="form-menu">
                    ⋮
                  </button>

                </div>

              ))}

            </div>

          </section>
        )}


        {/* FORMULARIOS */}
        {activePage === "Formularios" && (
          <section className="placeholder-page">
            <h2>Mis formularios</h2>
            <p>Aquí estarán todos tus formularios.</p>
          </section>
        )}


        {/* RESULTADOS */}
        {activePage === "Resultados" && (
          <section className="placeholder-page">
            <h2>Resultados</h2>
            <p>Aquí podrás analizar las respuestas.</p>
          </section>
        )}


        {/* CONFIGURACIÓN */}
        {activePage === "Configuración" && (
          <section className="placeholder-page">
            <h2>Configuración</h2>
            <p>Configuración de tu cuenta y Giesco Forms.</p>
          </section>
        )}

      </main>

    </div>
  );
}

export default App;