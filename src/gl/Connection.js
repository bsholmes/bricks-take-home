import { QUAD } from '../utils/proceduralMeshes';
import {
  LoadTexture,
  LoadGeometry,
} from '../utils/utils';
import {
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

  draw (gl, program) {
    // draw start arrow at start icon, on start side
    // TODO: enable batch rendering for instances with the same geo and texture
    LoadTexture(gl, program, this.textureIndex);

    // load geo
    LoadGeometry(gl, program, this.geometry, this.indices, 4, 2);

    // TODO: rotate based on side index
    let offset = [];
    let rotDegrees = 0;
    switch(this.startSide) {
      case 0:
        offset = [SCALE[0] * -0.5, 0, 0, 0];
        rotDegrees = 180;
        break;
      case 1:
        offset = [SCALE[0] * 0.5, 0, 0, 0];
        break;
      case 2:
        offset = [0, SCALE[1] * -0.5, 0, 0];
        rotDegrees = -90;
        break;
      case 3:
        offset = [0, SCALE[1] * 0.5, 0, 0];
        rotDegrees = 90;
        break;
    }

    const location = vec4Add(
      this.startIcon.getSideMidpoints()[this.startSide],
      offset
    );

    const modelMatrixUniform = gl.getUniformLocation(program, 'uModelMatrix');
    gl.uniformMatrix4fv(
      modelMatrixUniform,
      false,
      new Float32Array(
        mat4Mult(
          RotationMatrix(rotDegrees, [0, 0, 1, 0]),
          mat4Mult(
            ScaleMatrix(SCALE),
            TranslationMatrix(location)
          )
        )
      )
    );

    gl.drawElements(gl.TRIANGLE_STRIP, this.indices.length, gl.UNSIGNED_SHORT, 0);

    // draw lines from start arrow to end arrow, aligned to axes and with only 90 degree turns

    // draw end arrow at end icon, on end side
    // or draw end arrow at cursor position
  }

}