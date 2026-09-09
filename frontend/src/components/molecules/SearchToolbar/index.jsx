import styled from "styled-components";
import SearchInput from "../../atoms/SearchInput";
import Button from "../../atoms/Button";
import { FiSliders } from "react-icons/fi";

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing["2xl"]};
`;

function SearchToolbar({ placeholder, value, onChange, showFilter = true }) {
  return (
    <Toolbar>
      <SearchInput
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {showFilter && (
        <Button $variant="ghost" $size="sm">
          <FiSliders size={14} />
          Filtros
        </Button>
      )}
    </Toolbar>
  );
}

export default SearchToolbar;
