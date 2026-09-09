import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FiEdit3, FiPlus, FiX } from "react-icons/fi";
import { useForms } from "../../context/FormContext";
import PageHeader from "../../components/molecules/PageHeader";
import SearchToolbar from "../../components/molecules/SearchToolbar";
import FormCard from "../../components/molecules/FormCard";
import CreateCard from "../../components/molecules/CreateCard";
import Button from "../../components/atoms/Button";

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
  background: rgba(0, 0, 0, 0.4);
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

const colors = [
  "linear-gradient(135deg, #6542F4 0%, #9B7DFF 100%)",
  "linear-gradient(135deg, #8B5CF6 0%, #C4B5FD 100%)",
  "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
  "linear-gradient(135deg, #6366F1 0%, #818CF8 100%)",
  "linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)",
  "linear-gradient(135deg, #0891B2 0%, #67E8F9 100%)",
];

function Forms() {
  const navigate = useNavigate();
  const { forms, createForm, trashForm, getFormResponses } = useForms();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");

  const filtered = forms.filter((f) =>
    f.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    const newId = createForm(formName, formDesc);
    setShowModal(false);
    setFormName("");
    setFormDesc("");
    navigate(`/formularios/${newId}/editar`);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      trashForm(deleteTarget.id);
      setDeleteTarget(null);
    }
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
      />

      <CardGrid>
        <CreateCard label="Nuevo formulario" />
        {filtered.map((f, i) => {
          const responseCount = getFormResponses(f.id).length;
          return (
            <FormCard
              key={f.id}
              icon={<FiEdit3 size={24} />}
              title={f.title}
              date={f.status === "Borrador" ? "Borrador" : f.createdAt}
              responses={responseCount}
              status={f.status}
              color={colors[i % colors.length]}
              onClick={() => navigate(`/formularios/${f.id}/editar`)}
              onEdit={() => navigate(`/formularios/${f.id}/editar`)}
              onPreview={() => navigate(`/formularios/${f.id}/vista`)}
              onResults={() => navigate(`/formularios/${f.id}/resultados`)}
              onDelete={() => setDeleteTarget(f)}
            />
          );
        })}
      </CardGrid>

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
              <Button $variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={handleCreate}>Crear formulario</Button>
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
              <Button $variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button $variant="danger" onClick={handleDelete}>Enviar a papelera</Button>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
    </div>
  );
}

export default Forms;
