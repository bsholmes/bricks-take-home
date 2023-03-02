import { useRef, useEffect } from 'react';

const DEFAULT_CONTEXT_TYPE = '2d';

const useCanvas = (draw, options = {}) => {
  const canvasRef = useRef(null);
  const {
    contextType,
    preDraw,
    postDraw,
    init,
    exit
  } = options;

  useEffect(() => {
    if (canvasRef) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext(contextType || DEFAULT_CONTEXT_TYPE);

      init && init(ctx);
    }
  }, [canvasRef]);

  useEffect(() => {
    if (canvasRef) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext(contextType || DEFAULT_CONTEXT_TYPE);
      let frameCount = 0;
      let animationFrameId;

      const render = () => {
        frameCount++;
        preDraw && preDraw();
        draw(ctx, frameCount);
        postDraw && postDraw();
        animationFrameId = window.requestAnimationFrame(render);
      };
      render();
      return () => {
        window.cancelAnimationFrame(animationFrameId);
      };
    }
  }, [draw]);

  useEffect(() => {
    return () => {
      const canvas = canvasRef.current;
      exit && exit(canvas);
    };
  });

  return canvasRef;
};

export default useCanvas;
