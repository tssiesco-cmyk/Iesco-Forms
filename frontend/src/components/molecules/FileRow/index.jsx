import styled from "styled-components";
import { FiMoreVertical } from "react-icons/fi";
import IconBox from "../../atoms/IconBox";

const Row = styled.div`
  min-height: 60px;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  transition: background 0.1s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }
`;

const Info = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 2px;
  }

  span {
    display: block;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`;

const Meta = styled.span`
  width: ${({ $width = "70px" }) => $width};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  flex-shrink: 0;
`;

const MenuButton = styled.button`
  width: 28px;
  height: 28px;
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.sm};
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.text};
  }
`;

function FileRow({ icon, iconBg, name, subtitle, meta, metaWidth, children }) {
  return (
    <Row>
      <Info>
        <IconBox $size={36} $bg={iconBg}>{icon}</IconBox>
        <div>
          <strong>{name}</strong>
          <span>{subtitle}</span>
        </div>
      </Info>
      {meta && <Meta $width={metaWidth}>{meta}</Meta>}
      {children}
      <MenuButton>
        <FiMoreVertical size={16} />
      </MenuButton>
    </Row>
  );
}

export default FileRow;
