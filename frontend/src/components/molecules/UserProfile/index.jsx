import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { FiChevronDown, FiLogOut } from "react-icons/fi";
import Avatar from "../../atoms/Avatar";

const Container = styled.div`
  position: relative;
`;

const Menu = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  margin-bottom: 6px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: 6px;
  z-index: 30;
`;

const MenuEmail = styled.div`
  padding: 8px 10px 6px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  margin-bottom: 4px;
`;

const MenuItem = styled.button`
  width: 100%;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.danger};
  text-align: left;

  &:hover { background: ${({ theme }) => theme.colors.dangerBg}; }
`;

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

function UserProfile({ name, role, email, initial, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <Container ref={ref}>
      {open && onLogout && (
        <Menu>
          {email && <MenuEmail>{email}</MenuEmail>}
          <MenuItem onClick={() => { setOpen(false); onLogout(); }}>
            <FiLogOut size={14} /> Cerrar sesion
          </MenuItem>
        </Menu>
      )}
      <Wrapper onClick={() => onLogout && setOpen((v) => !v)}>
        <Avatar $size={32}>{initial}</Avatar>
        <Info>
          <strong>{name}</strong>
          <span>{role}</span>
        </Info>
        <ChevronWrapper>
          <FiChevronDown size={16} />
        </ChevronWrapper>
      </Wrapper>
    </Container>
  );
}

export default UserProfile;
