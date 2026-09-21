import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FiEdit3, FiGlobe, FiLock, FiSearch } from "react-icons/fi";
import PageHeader from "../../components/molecules/PageHeader";
import SearchToolbar from "../../components/molecules/SearchToolbar";
import FormCard from "../../components/molecules/FormCard";
import { coverImageOf } from "../../services/formCover";
import SkeletonCard from "../../components/molecules/SkeletonCard";
import { EmptyState, ErrorState } from "../../components/molecules/StateView";
import Button from "../../components/atoms/Button";
import { useForms } from "../../context/FormContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { sharesApi } from "../../services/api";
import { matchesSearch } from "../../services/search";

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

/**
 * Formularios de otros usuarios, en dos grupos:
 *
 * - Privados: te los compartieron para editarlos entre varios. Vienen en la
 *   misma lista que los tuyos (marcados con sharedPermission) y se abren en el
 *   editor, igual que en Mis formularios.
 * - Publicos: cualquiera los ve. Se piden aparte y se abren para responder.
 */
function Shared() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const { forms, status, error, reload, removeFormLocally } = useForms();

  const [tab, setTab] = useState("privados");
  const [search, setSearch] = useState("");

  const [publicForms, setPublicForms] = useState([]);
  // loading | ready | error
  const [publicStatus, setPublicStatus] = useState("loading");
  const [publicError, setPublicError] = useState(null);

  // Lo que te compartieron o publicaron despues de entrar a la aplicacion no
  // estaria en la lista: se refresca al abrir la pagina.
  const loadPublic = (signal) => {
    setPublicStatus("loading");
    sharesApi.listPublic({ signal })
      .then((list) => {
        setPublicForms(list ?? []);
        setPublicStatus("ready");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setPublicError(err);
        setPublicStatus("error");
      });
  };

  useEffect(() => {
    reload();
    const controller = new AbortController();
    loadPublic(controller.signal);
    return () => controller.abort();
  }, [reload]);

  const privateForms = forms.filter((f) => f.sharedPermission);
  const list = tab === "privados" ? privateForms : publicForms;
  const listStatus = tab === "privados" ? status : publicStatus;

  const filtered = list.filter((f) => matchesSearch(search, f.title, f.description, f.ownerName));

  const leave = async (f) => {
    try {
      await sharesApi.unshare(f.id, user.id);
      removeFormLocally(f.id);
      toast.info(`"${f.title}" ya no esta en tus compartidos.`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const retry = () => (tab === "privados" ? reload() : loadPublic());

  return (
    <div>
      <PageHeader title="Compartidos" subtitle="Formularios de otros usuarios: para editar en equipo o para responder." />

      <SearchToolbar
        placeholder={tab === "privados" ? "Buscar en privados..." : "Buscar en publicos..."}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        filters={{
          value: tab,
          onChange: setTab,
          options: [
            { value: "privados", label: "Privados", count: privateForms.length },
            { value: "publicos", label: "Publicos", count: publicStatus === "ready" ? publicForms.length : undefined },
          ],
        }}
      />

      {listStatus === "error" && (
        <ErrorState error={tab === "privados" ? error : publicError} onRetry={retry} />
      )}

      {listStatus === "loading" && list.length === 0 && (
        <CardGrid>
          {Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)}
        </CardGrid>
      )}

      {listStatus === "ready" && list.length === 0 && (
        tab === "privados" ? (
          <EmptyState
            icon={<FiLock size={24} />}
            title="Nadie te ha compartido formularios para editar"
            text="Cuando alguien te agregue a un formulario aparecera aqui y te llegara un aviso."
          />
        ) : (
          <EmptyState
            icon={<FiGlobe size={24} />}
            title="No hay formularios publicos"
            text="Aqui aparecen los formularios publicados que otros usuarios marcaron como publicos."
          />
        )
      )}

      {list.length > 0 && filtered.length === 0 && (
        <EmptyState
          icon={<FiSearch size={24} />}
          title="Sin resultados"
          text={`Ningun formulario coincide con "${search.trim()}".`}
          compact
        >
          <Button $variant="secondary" onClick={() => setSearch("")}>Borrar busqueda</Button>
        </EmptyState>
      )}

      {filtered.length > 0 && (
        <CardGrid>
          {tab === "privados"
            ? filtered.map((f) => (
                <FormCard
                  key={f.id}
                  icon={<FiEdit3 size={24} />}
                  image={coverImageOf(f)}
                  title={f.title}
                  date={`De ${f.ownerName ?? "otro usuario"}`}
                  responses={f.responseCount ?? 0}
                  status={f.status}
                  onClick={() => navigate(`/formularios/${f.id}/editar`)}
                  onEdit={() => navigate(`/formularios/${f.id}/editar`)}
                  onPreview={() => navigate(`/formularios/${f.id}/vista`)}
                  onResults={() => navigate(`/formularios/${f.id}/resultados`)}
                  onLeave={() => leave(f)}
                />
              ))
            : filtered.map((f) => (
                <FormCard
                  key={f.id}
                  icon={<FiGlobe size={24} />}
                  image={coverImageOf(f)}
                  title={f.title}
                  date={`De ${f.ownerName ?? "otro usuario"}`}
                  badge="Responder"
                  onClick={() => navigate(`/formularios/${f.id}/vista`)}
                />
              ))}
        </CardGrid>
      )}
    </div>
  );
}

export default Shared;
