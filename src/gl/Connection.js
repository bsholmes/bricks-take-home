import { LinePath, QUAD } from '../utils/proceduralMeshes';
import {
  LoadTexture,
  LoadGeometry,
  getArrowTransformMatrix
} from '../utils/utils';

import {
  getTranslation,
  IdentityMatrix,
  mat4Mult,
  ScaleMatrix,
  TranslationMatrix,
  vec4Add
} from '../utils/vectorMath';

import Icon from './Icon';

const DELETE_ICON_OFFSET = [0.1, 0.1, 0];

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

  worldMousePos;

  startDeleteIcon = null;
  endDeleteIcon = null;

  onRemove = (index) => {};

  constructor(
    index,
    startIcon,
    startSide,
    endIcon,
    endSide,
    textureIndex,
    onRemove
  ) {
    this.index = index;
    this.startIcon = startIcon;
    this.startSide = startSide;
    this.endIcon = endIcon;
    this.endSide = endSide;

    this.geometry = QUAD.vertData;
    this.indices = QUAD.indices;
    this.textureIndex = textureIndex;
    this.onRemove = onRemove;
  }

  setEnd(endIcon, endSide) {
    this.endIcon = endIcon;
    this.endSide = endSide;

    if (!this.startDeleteIcon) {
      const startPos = this.startIcon.getSideMidpoints()[this.startSide];
      this.startDeleteIcon = new Icon(
        -1,
        1,
        null,
        mat4Mult(
          ScaleMatrix([0.05, 0.05, 1, 0]),
          TranslationMatrix(vec4Add(startPos, DELETE_ICON_OFFSET))
        ),
        [[-0.075, 0.075], [-0.075, 0.075]],
        null,
        () => {
          this.onRemove(this.index);

          this.startDeleteIcon = null;
          this.endDeleteIcon = null;
        }
      );
    }
    if (!this.endDeleteIcon) {
      const endPos = this.endIcon.getSideMidpoints()[this.endSide];
      this.endDeleteIcon = new Icon(
        -1,
        1,
        null,
        mat4Mult(
          ScaleMatrix([0.05, 0.05, 1, 0]),
          TranslationMatrix(vec4Add(endPos, DELETE_ICON_OFFSET))
        ),
        [[-0.075, 0.075], [-0.075, 0.075]],
        null,
        () => {
          this.onRemove(this.index);

          this.startDeleteIcon = null;
          this.endDeleteIcon = null;
        }
      );
    }
  }

  onMouseDown(event) {
    // TODO: only send events if we're drawing these
    this.startDeleteIcon && this.startDeleteIcon.onMouseDown(event);
    this.endDeleteIcon && this.endDeleteIcon.onMouseDown(event);
  }

  onMouseUp(event) {
    // TODO: only send events if we're drawing these
    this.startDeleteIcon && this.startDeleteIcon.onMouseUp(event);
    this.endDeleteIcon && this.endDeleteIcon.onMouseUp(event);
  }

  onMouseMove(event) {
    // necessary for drawing
    this.worldMousePos = event.worldMousePos;
  }

  getBounds() {
    const startPos = this.startIcon.getSideMidpoints()[this.startSide];
    const endPos = this.endIcon ? this.endIcon.getSideMidpoints()[this.endSide] : this.worldMousePos;

    return [
      Math.min(startPos[0], endPos[0]),
      Math.max(startPos[0], endPos[0]),
      Math.min(startPos[1], endPos[1]),
      Math.max(startPos[1], endPos[1]),
    ];
  }

  isMouseWithinBounds(worldMousePos, extraDistance = 0) {
    const bounds = this.getBounds();

    return (
      worldMousePos[0] > bounds[0] - extraDistance &&
      worldMousePos[0] < bounds[1] + extraDistance &&
      worldMousePos[1] > bounds[2] - extraDistance &&
      worldMousePos[1] < bounds[3] + extraDistance
    );
  }

  drawArrow(gl, program, icon, side, position) {
    const location = icon ? icon.getSideMidpoints()[side] : position;

    const startPos = this.startIcon.getSideMidpoints()[this.startSide];

    let transformMatrix = getArrowTransformMatrix(icon, side, location, SCALE, startPos);

    const modelMatrixUniform = gl.getUniformLocation(program, 'uModelMatrix');
    gl.uniformMatrix4fv(
      modelMatrixUniform,
      false,
      new Float32Array(
        transformMatrix
      )
    );

    gl.drawElements(gl.TRIANGLE_STRIP, this.indices.length, gl.UNSIGNED_SHORT, 0);

    return getTranslation(transformMatrix);
  }

  drawLines(gl, program, worldMousePos) {
    // draw lines from start arrow to end arrow, aligned to axes and with only 90 degree turns
    const startPos = this.startIcon.getSideMidpoints()[this.startSide];
    let endPos = worldMousePos; // cursor position
    let endBounds = [
      worldMousePos[0],
      worldMousePos[0],
      worldMousePos[1],
      worldMousePos[1]
    ];

    if (this.endIcon) {
      endPos = this.endIcon.getSideMidpoints()[this.endSide];
      endBounds = this.endIcon.getBounds()
    }

    const xDist = endPos[0] - startPos[0];
    const yDist = endPos[1] - startPos[1];

    const absXDist = Math.abs(xDist);
    const absYDist = Math.abs(yDist);

    let cursorSide = 0;

    if (absXDist > absYDist) {
      cursorSide = Math.sign(xDist) > 0 ? 0 : 1;
    } else {
      cursorSide = Math.sign(yDist) > 0 ? 2 : 3;
    }

    const { vertData, indices } = LinePath(
      startPos,
      this.startSide,
      endPos,
      this.endIcon ? this.endSide : cursorSide,
      this.startIcon.getBounds(),
      endBounds
    );

    LoadGeometry(gl, program, vertData, indices, 4, 2);

    const modelMatrixUniform = gl.getUniformLocation(program, 'uModelMatrix');
    gl.uniformMatrix4fv(
      modelMatrixUniform,
      false,
      new Float32Array(
        IdentityMatrix()
      )
    );

    gl.drawElements(gl.LINE_STRIP, indices.length, gl.UNSIGNED_SHORT, 0);
  }

  drawDeleteIcons(gl, program, startPos, endPos) {
    if (this.startDeleteIcon) {
      this.startDeleteIcon.transformMatrix = mat4Mult(
        ScaleMatrix([0.15, 0.15, 1, 0]),
        TranslationMatrix(vec4Add(startPos, DELETE_ICON_OFFSET))
      );

      this.startDeleteIcon.draw(gl, program);
    }

    if (this.endDeleteIcon) {
      this.endDeleteIcon.transformMatrix = mat4Mult(
        ScaleMatrix([0.15, 0.15, 1, 0]),
        TranslationMatrix(vec4Add(endPos, DELETE_ICON_OFFSET))
      );

      this.endDeleteIcon.draw(gl, program);
    }
  }

  draw (gl, program, drawDelete = false) {
    // TODO: enable batch rendering for instances with the same geo and texture
    LoadTexture(gl, program, this.textureIndex);

    // load geo
    LoadGeometry(gl, program, this.geometry, this.indices, 4, 2);

    // draw start
    const startPos = this.drawArrow(gl, program, this.startIcon, this.startSide);

    // draw end
    const endPos = this.drawArrow(gl, program, this.endIcon, this.endSide, this.worldMousePos);

    // draw lines
    this.drawLines(gl, program, this.worldMousePos);

    // TODO: only draw these if the mouse is near this connection
    if (drawDelete && this.endIcon && this.isMouseWithinBounds(this.worldMousePos, 0.2)) {
      this.drawDeleteIcons(gl, program, startPos, endPos);
    }
  }

}