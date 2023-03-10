import { QUAD } from '../utils/proceduralMeshes';
import {
  LoadTexture,
  LoadGeometry,
} from '../utils/utils';
import { getTranslation } from '../utils/vectorMath';

export default class Icon {
  // used for deletion to prevent the need to search
  index;

  geometry;
  indices;
  transformMatrix;
  textureIndex;
  secondaryTextureIndex;
  extents; // [[xMin, xMax], [yMin, yMax]]
  colorMultiply = null;

  clicked = false;
  onClick = () => {};
  onRemove = () => {};

  constructor(
    index,
    textureIndex,
    secondaryTextureIndex,
    transformMatrix,
    extents,
    colorMultiply = null,
    onClick = () => {},
    onRemove = () => {}
  ) {
    this.index = index;
    this.geometry = QUAD.vertData;
    this.indices = QUAD.indices;
    this.textureIndex = textureIndex;
    this.secondaryTextureIndex = secondaryTextureIndex;
    this.transformMatrix = transformMatrix;
    // we could calculate the AABB from the geometry but it's faster just to set it
    // since we should already know it from mesh generation
    this.extents = extents;
    this.colorMultiply = colorMultiply;
    this.onClick = onClick;
    this.onRemove = onRemove;
  }

  draw (gl, program) {
    // TODO: enable batch rendering for instances with the same geo and texture
    LoadTexture(gl, program, this.textureIndex);

    // load geo
    LoadGeometry(gl, program, this.geometry, this.indices, 4, 2);

    if (this.colorMultiply) {
      const colorMultiplyUniform = gl.getUniformLocation(program, 'uColorMultiply');
      gl.uniform4fv(
        colorMultiplyUniform,
        new Float32Array (this.colorMultiply)
      );
    }

    const modelMatrixUniform = gl.getUniformLocation(program, 'uModelMatrix');
    gl.uniformMatrix4fv(
      modelMatrixUniform,
      false,
      new Float32Array(
        this.transformMatrix,
      )
    );

    gl.drawElements(gl.TRIANGLE_STRIP, this.indices.length, gl.UNSIGNED_SHORT, 0);

    if (this.colorMultiply) {
      // reset color
      const colorMultiplyUniform = gl.getUniformLocation(program, 'uColorMultiply');
      gl.uniform4fv(
        colorMultiplyUniform,
        new Float32Array ([1, 1, 1, 1])
      );
    }
  }

  onMouseOver (event) {
  }

  onMouseMove (event) {
  }

  onMouseOut (event) {
  }

  onMouseDown (event) {
    if (this.isMouseWithinBounds(event.worldMousePos)) {
      this.clicked = true;
    }
    else {
      this.clicked = false;
    }

    return this.clicked;
  }

  onMouseUp (event) {
    if (this.clicked && this.onClick) {
      this.onClick();
    }
  }

  isMouseWithinBounds (worldMousePos, extentsScale = 1) {
    // get our position from transformMatrix
    const bounds = this.getBounds(extentsScale);

    return (
      worldMousePos[0] >= bounds[0] &&
      worldMousePos[0] <= bounds[1] &&
      worldMousePos[1] >= bounds[2] &&
      worldMousePos[1] <= bounds[3]
    );
  }

  getBoundsForPos (position, extentsScale = 1) {
    return [
      position[0] + this.extents[0][0] * extentsScale, // left
      position[0] + this.extents[0][1] * extentsScale, // right
      position[1] + this.extents[1][0] * extentsScale, // bottom
      position[1] + this.extents[1][1] * extentsScale, // top
    ];
  }

  getBounds (extentsScale = 1) {
    return this.getBoundsForPos(getTranslation(this.transformMatrix), extentsScale);
  }

  getSideMidpoints () {
    const position = getTranslation(this.transformMatrix);
    const bounds = this.getBounds();

    return [
      [bounds[0], position[1], position[2], 0], // left
      [bounds[1], position[1], position[2], 0], // right
      [position[0], bounds[2], position[2], 0], // bottom
      [position[0], bounds[3], position[2], 0], // top
    ];
  }
};