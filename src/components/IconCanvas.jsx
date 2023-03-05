import {
  useState,
  useRef
} from 'react';
import styled from 'styled-components';

import {
  CreateAndLinkProgramWithShaders,
  CreateTexture,
  projectMouseCoordsToWorldSpace
} from '../utils/utils';
import {
  mat4Mult,
  ProjectionMatrix,
  ViewMatrix
} from '../utils/vectorMath';
import { TOOL_INDICES } from '../utils/constants';
import Canvas from './Canvas';
import Camera from '../gl/Camera';

import unlitVertexShader from '../shaders/unlitVertexShader.glsl';
import unlitFragmentShader from '../shaders/unlitFragmentShader.glsl';

import CircuitIcon from '../static/circuit_icon.svg';
import DeleteIcon from '../static/delete_icon.svg';
import ConnectArrowIcon from '../static/connect_arrow_icon.svg';

const CANVAS_SIZE = [1500, 1300];
const CAMERA = new Camera(
  [0, 0, -1, 0],
  [0, 0, 1, 0],
  [0, 1, 0, 0],
  0.00000001,
  1000,
  90,
  CANVAS_SIZE[0] / CANVAS_SIZE[1]
);
const Z_POS = 3.33;

const IconCanvas = ({
  tool
}) => {
  const [glProgram, setGLProgram] = useState(null);
  const [icons, _setIcons] = useState([]);
  const [iconsCreated, _setIconsCreated] = useState(0);
  const [connections, _setConnections] = useState([]);
  const [connectionsCreated, _setConnectionsCreated] = useState(0);

  const iconsRef = useRef(icons);
  const setIcons = icons => {
    iconsRef.current = icons;
    _setIcons(icons);
  };

  const iconsCreatedRef = useRef(iconsCreated);
  const setIconsCreated = num => {
    iconsCreatedRef.current = num;
    _setIconsCreated(num);
  };

  const connectionsRef = useRef(connections);
  const setConnections = connections => {
    connectionsRef.current = connections;
    _setConnections(connections);
  };

  const connectionsCreatedRef = useRef(connectionsCreated);
  const setConnectionsCreated = num => {
    connectionsCreatedRef.current = num;
    _setConnectionsCreated(num);
  };

  const toolRef = useRef(tool);
  toolRef.current = tool;

  const addIcon = (icon) => {
    setIcons([...iconsRef.current, icon]);
    setIconsCreated(iconsCreatedRef.current + 1);
  };

  const removeIcon = (index) => {
    const deleteIndex = iconsRef.current.findIndex(icon => icon.index === index);

    if (deleteIndex === 0) {
      setIcons(iconsRef.current.slice(1, iconsRef.current.length));
    } else {
      setIcons([
        ...iconsRef.current.slice(0, deleteIndex),
        ...iconsRef.current.slice(deleteIndex + 1, iconsRef.current.length)
      ]);
    }
  };

  const addConnection = (connection) => {
    setConnections([...connectionsRef.current, connection]);
    setConnectionsCreated(connectionsCreatedRef.current + 1);
  };

  const removeConnection = (index) => {
    const deleteIndex = connectionsRef.current.findIndex(connection => connection.index === index);

    if (deleteIndex < 0) {
      return;
    }

    const connectionToRemove = connectionsRef.current[deleteIndex];

    if (connectionToRemove) {
      // reset icon connections
      connectionToRemove.startIcon.sideConnections[connectionToRemove.startSide] = null;
      if (connectionToRemove.endIcon) {
        connectionToRemove.endIcon.sideConnections[connectionToRemove.endSide] = null;
      }
    }

    if (deleteIndex === 0) {
      setConnections(connectionsRef.current.slice(1, connectionsRef.current.length));
    } else {
      setConnections([
        ...connectionsRef.current.slice(0, deleteIndex),
        ...connectionsRef.current.slice(deleteIndex + 1, connectionsRef.current.length)
      ]);
    }
  };

  const modifyMouseEvent = (event) => {
    const worldMousePos = projectMouseCoordsToWorldSpace(
      [event.pageX - event.target.offsetLeft, event.pageY - event.target.offsetTop],
      CANVAS_SIZE,
      CAMERA,
      Z_POS
    );

    event = {
      ...event,

      worldMousePos,
      icons: [...iconsRef.current],
      iconsCreated: iconsCreatedRef.current,
      connections: [...connectionsRef.current],
      connectionsCreated: connectionsCreatedRef.current,
      camera: CAMERA,
      addIcon,
      removeIcon,
      addConnection,
      removeConnection
    };

    return event;
  };

  const mouseDownHandler = (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    toolRef.current.onMouseDown && toolRef.current.onMouseDown(modifyMouseEvent(event));
  };

  const mouseUpHandler = (event) => {
    toolRef.current.onMouseUp && toolRef.current.onMouseUp(modifyMouseEvent(event));
  };

  const mouseOutHandler = (event) => {
    toolRef.current.onMouseOut && toolRef.current.onMouseOut(modifyMouseEvent(event));
  };

  const mouseOverHandler = (event) => {
    toolRef.current.onMouseOver && toolRef.current.onMouseOver(modifyMouseEvent(event));
  };

  const mouseMoveHandler = (event) => {
    toolRef.current.onMouseMove && toolRef.current.onMouseMove(modifyMouseEvent(event));
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
    if (connections && connections.length) {
      for (let i = 0; i < connections.length; ++i) {
        connections[i].draw(gl, glProgram, tool.id === TOOL_INDICES.ConnectTool);
      }
    }
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

    const colorMultiplyUniform = gl.getUniformLocation(program, 'uColorMultiply');
    gl.uniform4fv(
      colorMultiplyUniform,
      new Float32Array([1, 1, 1, 1])
    );

    CreateTexture(gl, program, CircuitIcon, 0);

    CreateTexture(gl, program, DeleteIcon, 1);

    CreateTexture(gl, program, ConnectArrowIcon, 2);

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
`;

export default IconCanvas;
