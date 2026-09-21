import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FiEdit3, FiPlus, FiX, FiSearch } from "react-icons/fi";
import { useForms } from "../../context/FormContext";
import PageHeader from "../../components/molecules/PageHeader";
import SearchToolbar from "../../components/molecules/SearchToolbar";
import FormCard from "../../components/molecules/FormCard";
import { coverImageOf } from "../../services/formCover";
import CreateCard from "../../components/molecules/CreateCard";
import SkeletonCard from "../../components/molecules/SkeletonCard";
import { ErrorState, EmptyState } from "../../components/molecules/StateView";
import Button from "../../components/atoms/Button";
import Spinner from "../../components/atoms/Spinner";
import { matchesSearch } from "../../services/search";
import ShareFormModal from "../../components/organisms/ShareFormModal";

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

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  width: 480px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.modal};
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }
`;

const ModalBody = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  label {
    display: block;
    margin-bottom: 6px;
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  input, textarea {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.md};
    font-size: ${({ theme }) => theme.fontSizes.base};
    transition: border-color 0.15s;
    &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const ConfirmText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  margin: 0;

  strong {
    color: ${({ theme }) => theme.colors.text};
  }
`;

function Forms() {
  const navigate = useNavigate();
  const { forms, status, error, reload, createForm, trashForm } = useForms();
  const [search, setSearch] = useState("");
  // todos | Activo | Borrador
  const [statusFilter, setStatusFilter] = useState("todos");
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);

  // Los que te compartieron viven en Compartidos, no aqui.
  const myForms = forms.filter((f) => !f.sharedPermission);

  const filtered = myForms.filter((f) =>
    (statusFilter === "todos" || f.status === statusFilter) &&
    matchesSearch(search, f.title, f.description)
  );

  const statusOptions = [
    { value: "todos", label: "Todos", count: myForms.length },
    { value: "Activo", label: "Activos", count: myForms.filter((f) => f.status === "Activo").length },
    { value: "Borrador", label: "Borradores", count: myForms.filter((f) => f.status === "Borrador").length },
  ];

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("todos");
  };

  const statusLabel = { Activo: "activos", Borrador: "en borrador" }[statusFilter];
  const noResultsText = search.trim()
    ? `Ningun formulario${statusLabel ? ` ${statusLabel}` : ""} coincide con "${search.trim()}".`
    : `No tienes formularios ${statusLabel}.`;

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);

    const newId = await createForm(formName, formDesc);
    setCreating(false);

    // Si fallo, el aviso ya lo mostro el contexto: dejamos el modal abierto
    // con lo que el usuario habia escrito para que pueda reintentar.
    if (!newId) return;

    setShowModal(false);
    setFormName("");
    setFormDesc("");
    navigate(`/formularios/${newId}/editar`);
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    const ok = await trashForm(deleteTarget.id);
    setDeleting(false);

    if (ok) setDeleteTarget(null);
  };

  return (
    <div>
      <PageHeader title="Mis formularios" subtitle="Crea, edita y administra todos tus formularios.">
        <Button onClick={() => setShowModal(true)}>
          <FiPlus size={16} /> Nuevo formulario
        </Button>
      </PageHeader>

      <SearchToolbar
        placeholder="Buscar formularios..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        filters={{ value: statusFilter, onChange: setStatusFilter, options: statusOptions }}
      />

      {status === "error" && <ErrorState error={error} onRetry={reload} />}

      {status === "loading" && (
        <CardGrid>
          {Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)}
        </CardGrid>
      )}

      {status === "ready" && myForms.length === 0 && (
        <EmptyState
          icon={<FiEdit3 size={24} />}
          title="Todavia no tienes formularios"
          text="Crea el primero desde cero o parte de una plantilla."
        >
          <Button onClick={() => setShowModal(true)}>
            <FiPlus size={16} /> Nuevo formulario
          </Button>
          <Button $variant="secondary" onClick={() => navigate("/plantillas")}>
            Ver plantillas
          </Button>
        </EmptyState>
      )}

      {status === "ready" && myForms.length > 0 && filtered.length === 0 && (
        <EmptyState
          icon={<FiSearch size={24} />}
          title="Sin resultados"
          text={noResultsText}
          compact
        >
          <Button $variant="secondary" onClick={clearFilters}>Quitar filtros</Button>
        </EmptyState>
      )}

      {status === "ready" && filtered.length > 0 && (
      <CardGrid>
        <CreateCard label="Nuevo formulario" onClick={() => setShowModal(true)} />
        {filtered.map((f) => {
          return (
            <FormCard
              key={f.id}
              icon={<FiEdit3 size={24} />}
              image={coverImageOf(f)}
              title={f.title}
              date={f.status === "Borrador" ? "Borrador" : f.createdAt}
              responses={f.responseCount ?? 0}
              status={f.status}
              badge={f.isPublic ? "Publico" : undefined}
              onClick={() => navigate(`/formularios/${f.id}/editar`)}
              onEdit={() => navigate(`/formularios/${f.id}/editar`)}
              onPreview={() => navigate(`/formularios/${f.id}/vista`)}
              onResults={() => navigate(`/formularios/${f.id}/resultados`)}
              onShare={f.access === "owner" ? () => setShareTarget(f) : undefined}
              onDelete={f.access === "owner" ? () => setDeleteTarget(f) : undefined}
            />
          );
        })}
      </CardGrid>
      )}

      {shareTarget && <ShareFormModal form={shareTarget} onClose={() => setShareTarget(null)} />}

      {/* Modal crear */}
      {showModal && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>Nuevo formulario</h2>
              <Button $variant="ghost" onClick={() => setShowModal(false)}><FiX size={18} /></Button>
            </ModalHeader>
            <ModalBody>
              <div>
                <label>Nombre del formulario</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Mi formulario"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <div>
                <label>Descripcion (opcional)</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Describe el proposito de tu formulario..."
                />
              </div>
            </ModalBody>
            <ModalActions>
              <Button $variant="secondary" onClick={() => setShowModal(false)} disabled={creating}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Spinner $size={13} $color="currentColor" />}
                {creating ? "Creando..." : "Crear formulario"}
              </Button>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}

      {/* Modal eliminar */}
      {deleteTarget && (
        <ModalOverlay onClick={() => setDeleteTarget(null)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>Eliminar formulario</h2>
              <Button $variant="ghost" onClick={() => setDeleteTarget(null)}><FiX size={18} /></Button>
            </ModalHeader>
            <ModalBody>
              <ConfirmText>
                Deseas enviar <strong>"{deleteTarget.title}"</strong> a la papelera?
                Podras restaurarlo desde la papelera en cualquier momento.
              </ConfirmText>
            </ModalBody>
            <ModalActions>
              <Button $variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancelar
              </Button>
              <Button $variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting && <Spinner $size={13} $color="currentColor" />}
                {deleting ? "Eliminando..." : "Enviar a papelera"}
              </Button>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
    </div>
  );
}

export default Forms;
