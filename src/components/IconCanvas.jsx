import {
  useState,
  useRef
} from 'react';
import styled from 'styled-components';

import Canvas from './common/Canvas';
import {
  CreateAndLinkProgramWithShaders,
  CreateTexture,
  LoadTexture,
  LoadGeometry,
  projectMouseCoordsToWorldSpace
} from './common/utils';
import { PlaneModel } from './common/proceduralMeshes';
import {
  mat4Mult,
  ProjectionMatrix,
  TranslationMatrix,
  ViewMatrix
} from './common/vectorMath';
import Camera from '../gl/Camera';
import DraggableIcon from '../gl/DraggableIcon';

import unlitVertexShader from '../shaders/unlitVertexShader.glsl';
import unlitFragmentShader from '../shaders/unlitFragmentShader.glsl';
import CircuitIcon from '../static/circuit_icon.svg';
import DeleteIcon from '../static/delete_icon.svg';
import ConnectArrowIcon from '../static/connect_arrow_icon.svg';


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

const IconCanvas = () => {
  const [glProgram, setGLProgram] = useState(null);
  const [icons, _setIcons] = useState([]);

  const iconsRef = useRef(icons);
  const setIcons = icons => {
    iconsRef.current = icons;
    _setIcons(icons);
  };

  const mouseDownHandler = (event) => {
    event.preventDefault();

    const currentIcons = iconsRef.current;
    const worldMousePos = projectMouseCoordsToWorldSpace(
      [event.pageX - event.target.offsetLeft, event.pageY - event.target.offsetTop],
      CANVAS_SIZE,
      CAMERA,
      2,
    );
    event.worldMousePos = worldMousePos;

    if (currentIcons && currentIcons.length) {
      for (let i = 0; i < currentIcons.length; ++i) {
        currentIcons[i].onMouseDown(event);
      }
    }
  };

  const mouseUpHandler = (event) => {
    const currentIcons = iconsRef.current;
    const worldMousePos = projectMouseCoordsToWorldSpace(
      [event.pageX - event.target.offsetLeft, event.pageY - event.target.offsetTop],
      CANVAS_SIZE,
      CAMERA,
      2,
    );
    event.worldMousePos = worldMousePos;

    if (currentIcons && currentIcons.length) {
      for (let i = 0; i < currentIcons.length; ++i) {
        currentIcons[i].onMouseUp(event);
      }
    }
  };

  const mouseOutHandler = (event) => {
    const currentIcons = iconsRef.current;
    const worldMousePos = projectMouseCoordsToWorldSpace(
      [event.pageX - event.target.offsetLeft, event.pageY - event.target.offsetTop],
      CANVAS_SIZE,
      CAMERA,
      2,
    );
    event.worldMousePos = worldMousePos;

    if (currentIcons && currentIcons.length) {
      for (let i = 0; i < currentIcons.length; ++i) {
        currentIcons[i].onMouseOut(event);
      }
    }
  };

  const mouseOverHandler = (event) => {
    const currentIcons = iconsRef.current;
    const worldMousePos = projectMouseCoordsToWorldSpace(
      [event.pageX - event.target.offsetLeft, event.pageY - event.target.offsetTop],
      CANVAS_SIZE,
      CAMERA,
      2,
    );
    event.worldMousePos = worldMousePos;

    if (currentIcons && currentIcons.length) {
      for (let i = 0; i < currentIcons.length; ++i) {
        currentIcons[i].onMouseOver(event);
      }
    }
  };

  const mouseMoveHandler = (event) => {
    const currentIcons = iconsRef.current;
    const worldMousePos = projectMouseCoordsToWorldSpace(
      [event.pageX - event.target.offsetLeft, event.pageY - event.target.offsetTop],
      CANVAS_SIZE,
      CAMERA,
      2,
    );
    event.worldMousePos = worldMousePos;
    event.icons = currentIcons;
    event.camera = CAMERA;

    if (currentIcons && currentIcons.length) {
      for (let i = 0; i < currentIcons.length; ++i) {
        currentIcons[i].onMouseMove(event);
      }
    }
  };

  const draw = (gl) => {
    if (gl === null) {
      window.alert('WebGL not supported');
    }

    gl.clearColor(0.95, 0.95, 0.95, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

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
    const vpUniform = gl.getUniformLocation(program, 'uVPMatrix');
    gl.uniformMatrix4fv(
      vpUniform,
      false,
      new Float32Array(
        mat4Mult(
          ViewMatrix(CAMERA.position, CAMERA.target, CAMERA.upDir),
          ProjectionMatrix(CAMERA.fov, CAMERA.aspect, CAMERA.nearDist, CAMERA.farDist)
        )
      )
    );

    // load model
    const { vertData, indices } = PlaneModel(1, 1, [1, 1, 0]);

    const removeIcon = (index) => {
      const deleteIndex = iconsRef.current.findIndex(icon => icon.index === index);
      if (deleteIndex === 0) {
        setIcons(iconsRef.current.slice(1, iconsRef.current.length));
      }
      else {
        setIcons([
          ...iconsRef.current.slice(0, deleteIndex),
          ...iconsRef.current.slice(deleteIndex + 1, iconsRef.current.length)
        ]);
      }
    }

    CreateTexture(gl, program, CircuitIcon, 0);

    CreateTexture(gl, program, DeleteIcon, 1);

    CreateTexture(gl, program, ConnectArrowIcon, 2);

    setIcons([
      new DraggableIcon(
        0,
        vertData,
        indices,
        0,
        1,
        TranslationMatrix([0, 0, 2]),
        [[-0.5, 0.5], [-0.458, 0.458]],
        null,
        removeIcon
      ),
      new DraggableIcon(
        1,
        vertData,
        indices,
        0,
        1,
        TranslationMatrix([1, 1, 2]),
        [[-0.5, 0.5], [-0.458, 0.458]],
        null,
        removeIcon
      ),
      new DraggableIcon(
        2,
        vertData,
        indices,
        0,
        1,
        TranslationMatrix([2, 2, 2]),
        [[-0.5, 0.5], [-0.458, 0.458]],
        null,
        removeIcon
      ),
      new DraggableIcon(
        3,
        vertData,
        indices,
        0,
        1,
        TranslationMatrix([-1, -1, 2]),
        [[-0.5, 0.5], [-0.458, 0.458]],
        null,
        removeIcon
      ),
      new DraggableIcon(
        4,
        vertData,
        indices,
        0,
        1,
        TranslationMatrix([-2, -2, 2]),
        [[-0.5, 0.5], [-0.458, 0.458]],
        null,
        removeIcon
      )
    ]);

    gl.canvas.addEventListener('mousedown', mouseDownHandler);
    gl.canvas.addEventListener('mouseup', mouseUpHandler);
    gl.canvas.addEventListener('mouseout', mouseOutHandler);
    gl.canvas.addEventListener('mouseover', mouseOverHandler);
    gl.canvas.addEventListener('mousemove', mouseMoveHandler);
  };

  return (
    <div>
      <RoundedCorners>
        <Canvas draw={draw} options={{ contextType: 'webgl', init }} width={CANVAS_SIZE[0]} height={CANVAS_SIZE[1]} />
      </RoundedCorners>
    </div>
  );
};

const RoundedCorners = styled.div`
  border: 1px solid #CCCCCC;
  border-radius: 18px;
  overflow: hidden;
  display: inline-block;
  height: 900px;
`;

export default IconCanvas;
