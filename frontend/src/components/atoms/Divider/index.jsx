import styled from "styled-components";

const Divider = styled.div`
  height: 1px;
  background: ${({ $color, theme }) => $color || theme.colors.border};
  margin: ${({ $margin = "16px 0" }) => $margin};
`;

export default Divider;
