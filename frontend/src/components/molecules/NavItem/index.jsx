import styled from "styled-components";
import { NavLink } from "react-router-dom";

const StyledNavLink = styled(NavLink)`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.sidebarText};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.normal};
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.sidebarHover};
    color: ${({ theme }) => theme.colors.sidebarTextActive};
  }

  &.active {
    background: ${({ theme }) => theme.colors.sidebarActive};
    color: ${({ theme }) => theme.colors.sidebarTextActive};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    justify-content: center;
    padding: 10px;

    span:last-child {
      display: none;
    }
  }
`;

const IconWrapper = styled.span`
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
`;

function NavItem({ to, icon, label }) {
  return (
    <StyledNavLink to={to} end={to === "/"}>
      <IconWrapper>{icon}</IconWrapper>
      <span>{label}</span>
    </StyledNavLink>
  );
}

export default NavItem;
