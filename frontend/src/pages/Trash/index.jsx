import { useState } from "react";
import styled from "styled-components";
import { FiEdit3, FiRotateCcw, FiTrash2, FiX, FiAlertTriangle } from "react-icons/fi";
import { useForms } from "../../context/FormContext";
import PageHeader from "../../components/molecules/PageHeader";
import SearchToolbar from "../../components/molecules/SearchToolbar";
import Button from "../../components/atoms/Button";

const ListWrapper = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`;

const ListHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  background: ${({ theme }) => theme.colors.surfaceAlt};

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }

  span {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  transition: background 0.1s;

  &:last-child { border-bottom: none; }
  &:hover { background: ${({ theme }) => theme.colors.surfaceAlt}; }
`;

const IconBox = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    margin-bottom: 2px;
  }

  span {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 24px;

  h3 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    color: ${({ theme }) => theme.colors.textSecondary};
    margin: 16px 0 6px;
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.base};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const EmptyIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
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
  width: 440px;
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
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const ModalText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  margin: 0;

  strong { color: ${({ theme }) => theme.colors.text}; }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const WarningIcon = styled.span`
  color: ${({ theme }) => theme.colors.danger};
  display: flex;
  align-items: center;
`;

function formatTrashedDate(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 1) return "Eliminado hace un momento";
  if (minutes < 60) return `Eliminado hace ${minutes} min`;
  if (hours < 24) return `Eliminado hace ${hours}h`;
  if (days === 1) return "Eliminado hace 1 dia";
  return `Eliminado hace ${days} dias`;
}

function Trash() {
  const { trashedForms, restoreForm, permanentDeleteForm, emptyTrash } = useForms();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  const filtered = trashedForms.filter((f) =>
    f.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Papelera" subtitle="Los formularios eliminados se conservan aqui.">
        {trashedForms.length > 0 && (
          <Button $variant="danger" $size="sm" onClick={() => setShowEmptyConfirm(true)}>
            <FiTrash2 size={14} /> Vaciar papelera
          </Button>
        )}
      </PageHeader>

      {trashedForms.length > 0 && (
        <SearchToolbar
          placeholder="Buscar en papelera..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          showFilter={false}
        />
      )}

      {filtered.length > 0 ? (
        <ListWrapper>
          <ListHeader>
            <h2>Eliminados</h2>
            <span>{filtered.length} formularios</span>
          </ListHeader>
          {filtered.map((f) => (
            <Row key={f.id}>
              <IconBox><FiEdit3 size={16} /></IconBox>
              <Info>
                <strong>{f.title}</strong>
                <span>{f.questions.length} preguntas · {formatTrashedDate(f.trashedAt)}</span>
              </Info>
              <Actions>
                <Button $variant="secondary" $size="sm" onClick={() => restoreForm(f.id)}>
                  <FiRotateCcw size={12} /> Restaurar
                </Button>
                <Button $variant="ghost" $size="sm" onClick={() => setDeleteTarget(f)}>
                  <FiTrash2 size={14} />
                </Button>
              </Actions>
            </Row>
          ))}
        </ListWrapper>
      ) : (
        <EmptyState>
          <EmptyIcon><FiTrash2 size={24} /></EmptyIcon>
          <h3>La papelera esta vacia</h3>
          <p>Los formularios que elimines apareceran aqui.</p>
        </EmptyState>
      )}

      {/* Modal eliminar permanentemente */}
      {deleteTarget && (
        <ModalOverlay onClick={() => setDeleteTarget(null)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>
                <WarningIcon><FiAlertTriangle size={20} /></WarningIcon>
                Eliminar permanentemente
              </h2>
              <Button $variant="ghost" onClick={() => setDeleteTarget(null)}><FiX size={18} /></Button>
            </ModalHeader>
            <ModalBody>
              <ModalText>
                Estas seguro de que deseas eliminar permanentemente <strong>"{deleteTarget.title}"</strong>?
                Se eliminaran todas las respuestas asociadas. Esta accion no se puede deshacer.
              </ModalText>
            </ModalBody>
            <ModalActions>
              <Button $variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button $variant="danger" onClick={() => {
                permanentDeleteForm(deleteTarget.id);
                setDeleteTarget(null);
              }}>
                Eliminar permanentemente
              </Button>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}

      {/* Modal vaciar papelera */}
      {showEmptyConfirm && (
        <ModalOverlay onClick={() => setShowEmptyConfirm(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>
                <WarningIcon><FiAlertTriangle size={20} /></WarningIcon>
                Vaciar papelera
              </h2>
              <Button $variant="ghost" onClick={() => setShowEmptyConfirm(false)}><FiX size={18} /></Button>
            </ModalHeader>
            <ModalBody>
              <ModalText>
                Estas seguro de que deseas eliminar permanentemente <strong>todos los {trashedForms.length} formularios</strong> de la papelera?
                Se eliminaran todas las respuestas asociadas. Esta accion no se puede deshacer.
              </ModalText>
            </ModalBody>
            <ModalActions>
              <Button $variant="secondary" onClick={() => setShowEmptyConfirm(false)}>Cancelar</Button>
              <Button $variant="danger" onClick={() => {
                emptyTrash();
                setShowEmptyConfirm(false);
              }}>
                Vaciar papelera
              </Button>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
    </div>
  );
}

export default Trash;
