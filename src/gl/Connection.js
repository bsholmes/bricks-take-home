import { QUAD } from '../utils/proceduralMeshes';
import {
  LoadTexture,
  LoadGeometry,
  getArrowTransformMatrix
} from '../utils/utils';
import {
  IdentityMatrix,
  mat4Mult,
  RotationMatrix,
  ScaleMatrix,
  TranslationMatrix,
  vec4Add
} from '../utils/vectorMath';

const SCALE = [0.1, 0.1, 0.1];

export default class Connection {
  index;

  startIcon;
  startSide;
  endIcon;
  endSide;

  geometry;
  indices;
  textureIndex;

  constructor(
    index,
    startIcon,
    startSide,
    endIcon,
    endSide,
    textureIndex,
  ) {
    this.index = index;
    this.startIcon = startIcon;
    this.startSide = startSide;
    this.endIcon = endIcon;
    this.endSide = endSide;

    this.geometry = QUAD.vertData;
    this.indices = QUAD.indices;
    this.textureIndex = textureIndex;
  }

  setEnd(endIcon, endSide) {
    this.endIcon = endIcon;
    this.endSide = endSide;
  }

  drawArrow(gl, program, icon, side, position) {
    const location = icon ? icon.getSideMidpoints()[side] : position;
    
    const transformMatrix = getArrowTransformMatrix(side, location, SCALE);

    const modelMatrixUniform = gl.getUniformLocation(program, 'uModelMatrix');
    gl.uniformMatrix4fv(
      modelMatrixUniform,
      false,
      new Float32Array(
        transformMatrix
      )
    );

    gl.drawElements(gl.TRIANGLE_STRIP, this.indices.length, gl.UNSIGNED_SHORT, 0);
  }

  drawLines(gl, program, worldMousePos) {
    // draw lines from start arrow to end arrow, aligned to axes and with only 90 degree turns
    const startPos = this.startIcon.getSideMidpoints()[this.startSide];
    let endPos = worldMousePos; // cursor position

    if (this.endIcon) {
      endPos = this.endIcon.getSideMidpoints()[this.endSide];
    }

    // determine number of lines based on number of turns
    const vertData = [...startPos, 0.5, 0.5, ...endPos, 0.5, 0.5];
    const indices = [0, 1];

    LoadGeometry(gl, program, vertData, indices, 4, 2);

    const modelMatrixUniform = gl.getUniformLocation(program, 'uModelMatrix');
    gl.uniformMatrix4fv(
      modelMatrixUniform,
      false,
      new Float32Array(
        IdentityMatrix()
      )
    );

    gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_SHORT, 0);
  }

  draw (gl, program, worldMousePos) {
    // TODO: enable batch rendering for instances with the same geo and texture
    LoadTexture(gl, program, this.textureIndex);

    // load geo
    LoadGeometry(gl, program, this.geometry, this.indices, 4, 2);

    // draw start
    this.drawArrow(gl, program, this.startIcon, this.startSide);

    // draw end
    this.drawArrow(gl, program, this.endIcon, this.endSide, worldMousePos);

    // draw lines
    this.drawLines(gl, program, worldMousePos);
  }

}