import styled from "styled-components";
import { Outlet } from "react-router-dom";
import Sidebar from "../../organisms/Sidebar";
import TopBar from "../../organisms/TopBar";

const AppWrapper = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`;

const MainContent = styled.main`
  margin-left: ${({ theme }) => theme.sidebar.width};
  width: calc(100% - ${({ theme }) => theme.sidebar.width});
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-left: ${({ theme }) => theme.sidebar.collapsedWidth};
    width: calc(100% - ${({ theme }) => theme.sidebar.collapsedWidth});
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 32px 40px;
  max-width: 1200px;
  width: 100%;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 24px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 20px 16px;
  }
`;

function MainLayout() {
  return (
    <AppWrapper>
      <Sidebar />
      <MainContent>
        <TopBar />
        <Content>
          <Outlet />
        </Content>
      </MainContent>
    </AppWrapper>
  );
}

export default MainLayout;
