import styled from "styled-components";
import { FiChevronDown } from "react-icons/fi";
import Avatar from "../../atoms/Avatar";

const Wrapper = styled.div`
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.sidebarHover};
  }
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;

  strong {
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ theme }) => theme.colors.sidebarTextActive};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.sidebarText};
    margin-top: 1px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`;

const ChevronWrapper = styled.span`
  color: ${({ theme }) => theme.colors.sidebarText};
  display: flex;
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`;

function UserProfile({ name, role, initial }) {
  return (
    <Wrapper>
      <Avatar $size={32}>{initial}</Avatar>
      <Info>
        <strong>{name}</strong>
        <span>{role}</span>
      </Info>
      <ChevronWrapper>
        <FiChevronDown size={16} />
      </ChevronWrapper>
    </Wrapper>
  );
}

export default UserProfile;
