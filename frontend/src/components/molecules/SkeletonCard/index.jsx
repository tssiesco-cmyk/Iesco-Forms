import styled from "styled-components";
import { Skeleton } from "../StateView";

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`;

const Preview = styled(Skeleton)`
  height: 120px;
  border-radius: 0;
`;

const Body = styled.div`
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Row = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

/** Ocupa el mismo espacio que un FormCard mientras llegan los datos. */
function SkeletonCard() {
  return (
    <Card aria-hidden="true">
      <Preview />
      <Body>
        <Skeleton $width="70%" $height="16px" />
        <Skeleton $width="40%" $height="11px" />
        <Row>
          <Skeleton $width="60px" $height="11px" />
          <Skeleton $width="52px" $height="18px" $radius="20px" />
        </Row>
      </Body>
    </Card>
  );
}

export default SkeletonCard;
