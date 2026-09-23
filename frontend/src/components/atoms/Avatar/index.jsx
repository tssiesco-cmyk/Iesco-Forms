import { useState } from "react";
import styled from "styled-components";

const Circle = styled.div`
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
  overflow: hidden;
`;

const Photo = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

/**
 * El circulo del usuario. Sin $src pinta lo que le pongan dentro, que son
 * siempre las iniciales; con $src, la foto de perfil recortada en circulo.
 *
 * Si la foto no carga (el archivo ya no esta, o no hay red) se vuelve a las
 * iniciales en vez de dejar un circulo vacio.
 */
function Avatar({ $src, children, ...rest }) {
  // Se guarda la foto que fallo, no un simple "fallo": asi, al cambiarla, la
  // nueva se intenta sola, sin tener que reiniciar nada al cambiar la prop.
  const [failedSrc, setFailedSrc] = useState(null);

  return (
    <Circle {...rest}>
      {$src && $src !== failedSrc
        ? <Photo src={$src} alt="" onError={() => setFailedSrc($src)} />
        : children}
    </Circle>
  );
}

export default Avatar;
