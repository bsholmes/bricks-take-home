import {
  useState,
  useRef
} from 'react';
import styled from 'styled-components';

import Canvas from './common/Canvas';
import {
  CreateAndLinkProgramWithShaders,
  LoadTexture,
  LoadGeometry,
  projectMouseCoordsToWorldSpace
} from './common/utils';
import { PlaneModel } from './common/proceduralMeshes';
import {
  IdentityMatrix,
  mat4Mult,
  ProjectionMatrix,
  TranslationMatrix,
  ViewMatrix
} from './common/vectorMath';
import Camera from '../gl/Camera';
import unlitVertexShader from '../shaders/unlitVertexShader.glsl';
import unlitFragmentShader from '../shaders/unlitFragmentShader.glsl';
import icon from '../static/circuit_icon.svg';
import Icon from '../gl/Icon';

const CANVAS_SIZE = [1600, 900];
const CAMERA = new Camera(
  [0, 0, -1, 0],
  [0, 0, 1, 0],
  [0, 1, 0, 0],
  0.00000001,
  1000,
  90,
  CANVAS_SIZE[0] / CANVAS_SIZE[1],
);

export default () => {
  const [indexCount, setIndexCount] = useState(0);
  const [mouseDown, _setMouseDown] = useState(false);
  const [mouseDownPos, _setMouseDownPos] = useState([]);

  //TODO: array of transforms for icons

  const [glProgram, setGLProgram] = useState(null);
  const [icons, _setIcons] = useState([]);

  const iconsRef = useRef(icons);
  const setIcons = icons => {
    iconsRef.current = icons;
    _setIcons(icons);
  };

  const mouseDownRef = useRef(mouseDown);
  const setMouseDown = down => {
    mouseDownRef.current = down;
    _setMouseDown(down);
  };

  const mouseDownPosRef = useRef(mouseDownPos);
  const setMouseDownPos = pos => {
    mouseDownPosRef.current = pos;
    _setMouseDownPos(pos);
  };

  const mouseDownHandler = (event) => {
    event.preventDefault();

    if (icons && icons.length) {
      for (let i = 0; i < icons.length; ++i) {
        icons[i].onMouseDown(event);
      }
    }

    setMouseDown(true);
    setMouseDownPos([event.clientX, event.clientY]);
  };

  const mouseUpHandler = (event) => {
    event.canvasSize = CANVAS_SIZE;
    event.camera = CAMERA;
    event.zDepth = 2;

    if (iconsRef.current && iconsRef.current.length) {
      for (let i = 0; i < iconsRef.current.length; ++i) {
        iconsRef.current[i].onMouseUp(event);
      }
    }
    setMouseDown(false);
  };

  const mouseOutHandler = (event) => {
    if (icons && icons.length) {
      for (let i = 0; i < icons.length; ++i) {
        icons[i].onMouseOut(event);
      }
    }

    if (mouseDownRef.current) {
      setMouseDown(false);
    }
  };

  const mouseOverHandler = (event) => {
    if (icons && icons.length) {
      for (let i = 0; i < icons.length; ++i) {
        icons[i].onMouseOver(event);
      }
    }

    if (event.buttons === 1 && event.button === 0) {
      setMouseDown(true);
      setMouseDownPos([event.clientX, event.clientY]);
    }
  };

  const mouseMoveHandler = (event) => {
    if (icons && icons.length) {
      for (let i = 0; i < icons.length; ++i) {
        icons[i].onMouseMove(event);
      }
    }

    if (mouseDownRef.current) {

      const dMouse = [
        event.clientX - mouseDownPosRef.current[0],
        event.clientY - mouseDownPosRef.current[1]
      ];  
    }
  };

  const draw = (gl) => {
    if (gl === null) {
      window.alert('WebGL not supported');
    }

    gl.clearColor(0.95, 0.95, 0.95, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // draw icons
    if (icons && icons.length) {
      for (let i = 0; i < icons.length; ++i) {
        icons[i].draw(gl, glProgram);
      }
    }

    // draw connections

    // draw a sphere with the given image as its texture with a spherical projection
    // gl.drawElements(gl.TRIANGLE_STRIP, indexCount, gl.UNSIGNED_SHORT, 0);
  };

  const init = (gl) => {
    // load program
    const program = CreateAndLinkProgramWithShaders(gl, unlitVertexShader, unlitFragmentShader);
    gl.useProgram(program);
    setGLProgram(program);

    CAMERA.aspect = gl.canvas.width / gl.canvas.height;

    // set uniforms, attributes, etc.
    const mvpUniform = gl.getUniformLocation(program, 'uMVP');
    gl.uniformMatrix4fv(
      mvpUniform,
      false,
      new Float32Array(
        mat4Mult(
          IdentityMatrix(),
          mat4Mult(
            ViewMatrix(CAMERA.position, CAMERA.target, CAMERA.upDir),
            ProjectionMatrix(CAMERA.fov, CAMERA.aspect, CAMERA.nearDist, CAMERA.farDist)
          )
        )
      )
    );


    // load model
    const { vertData, indices } = PlaneModel(1, 1, [1, 1, 0]);

    setIcons([
      new Icon(vertData, indices, icon, TranslationMatrix([0, 0, 2]), [[-0.5, 0.5], [-0.5, 0.5]])
    ]);

    LoadGeometry(gl, program, vertData, indices, 4, 2);

    setIndexCount(indices.length);

    // load texture
    LoadTexture(gl, program, icon, 0);

    gl.canvas.addEventListener('mousedown', mouseDownHandler);
    gl.canvas.addEventListener('mouseup', mouseUpHandler);
    gl.canvas.addEventListener('mouseout', mouseOutHandler);
    gl.canvas.addEventListener('mouseover', mouseOverHandler);
    gl.canvas.addEventListener('mousemove', mouseMoveHandler);
  };

  return (
    <Container>
      <RoundedCorners>
        <Canvas draw={draw} options={{ contextType: 'webgl', init }} width={CANVAS_SIZE[0]} height={CANVAS_SIZE[1]} />
        {/* <img src={icon} width={150} heighht={150} /> */}
      </RoundedCorners>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  padding: 0 calc((100% - 1600px) / 2);
`;

const RoundedCorners = styled.div`
  border-radius: 18px;
  overflow: hidden;
  display: inline-block;
  height: 900px;
`;