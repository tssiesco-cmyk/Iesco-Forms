import styled from "styled-components";
import { FiSearch } from "react-icons/fi";

const Wrapper = styled.div`
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "320px")};
  height: 40px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  transition: border-color 0.15s ease;

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.borderFocus};
  }
`;

const Icon = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  border: none;
  font-size: ${({ theme }) => theme.fontSizes.base};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

function SearchInput({ placeholder = "Buscar...", value, onChange, fullWidth }) {
  return (
    <Wrapper $fullWidth={fullWidth}>
      <Icon>
        <FiSearch size={16} />
      </Icon>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </Wrapper>
  );
}

export default SearchInput;
