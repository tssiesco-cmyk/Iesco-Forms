import styled from "styled-components";
import { FiX } from "react-icons/fi";
import SearchInput from "../../atoms/SearchInput";

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: ${({ theme }) => theme.spacing["2xl"]};
`;

const SearchBox = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  max-width: 100%;
`;

const ClearButton = styled.button`
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Filters = styled.div`
  display: flex;
  gap: 4px;
  padding: 3px;
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border-radius: ${({ theme }) => theme.radii.md};
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ $active, theme }) => ($active ? theme.colors.text : theme.colors.textSecondary)};
  background: ${({ $active, theme }) => ($active ? theme.colors.surface : "transparent")};
  box-shadow: ${({ $active, theme }) => ($active ? theme.shadows.sm : "none")};
  transition: all 0.15s ease;

  &:hover { color: ${({ theme }) => theme.colors.text}; }

  span {
    margin-left: 6px;
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: ${({ theme }) => theme.fontWeights.normal};
  }
`;

/**
 * Buscador de listado con filtros opcionales.
 *
 * `filters` es { value, onChange, options: [{ value, label, count? }] }. Sin
 * filtros no se pinta nada a la derecha: un boton que no hace nada confunde mas
 * que no tenerlo.
 */
function SearchToolbar({ placeholder, value, onChange, filters }) {
  return (
    <Toolbar>
      <SearchBox>
        <SearchInput placeholder={placeholder} value={value} onChange={onChange} />
        {value && (
          <ClearButton
            type="button"
            aria-label="Borrar busqueda"
            onClick={() => onChange({ target: { value: "" } })}
          >
            <FiX size={14} />
          </ClearButton>
        )}
      </SearchBox>

      {filters && (
        <Filters role="group" aria-label="Filtros">
          {filters.options.map((option) => (
            <FilterButton
              key={option.value}
              type="button"
              $active={filters.value === option.value}
              aria-pressed={filters.value === option.value}
              onClick={() => filters.onChange(option.value)}
            >
              {option.label}
              {option.count !== undefined && <span>{option.count}</span>}
            </FilterButton>
          ))}
        </Filters>
      )}
    </Toolbar>
  );
}

export default SearchToolbar;
