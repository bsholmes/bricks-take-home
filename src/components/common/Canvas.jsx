// import react from 'react';
import useCanvas from './useCanvas';

export default ({ draw, options = {}, ...rest }) => {
  const canvasRef = useCanvas(draw, options);

  return <canvas ref={canvasRef} {...rest} />;
};
