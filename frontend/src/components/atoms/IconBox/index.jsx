import styled from "styled-components";

const IconBox = styled.div`
  width: ${({ $size = 40 }) => `${$size}px`};
  height: ${({ $size = 40 }) => `${$size}px`};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ $bg, theme }) => $bg || theme.colors.primaryLight};
  color: ${({ $color, theme }) => $color || theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
`;

export default IconBox;
