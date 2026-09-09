import styled from "styled-components";

const Avatar = styled.div`
  width: ${({ $size = 36 }) => `${$size}px`};
  height: ${({ $size = 36 }) => `${$size}px`};
  border-radius: ${({ theme }) => theme.radii.full};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $bg, theme }) => $bg || theme.colors.primary};
  color: ${({ theme }) => theme.colors.textInverse};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ $size = 36 }) => `${Math.round($size * 0.38)}px`};
  flex-shrink: 0;
`;

export default Avatar;
