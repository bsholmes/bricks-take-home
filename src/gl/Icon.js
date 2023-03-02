import {
  LoadTexture,
  LoadGeometry,
} from '../utils/utils';
import {
  TranslationMatrix,
  getTranslation,
  vec4Add
} from '../utils/vectorMath';

export default class Icon {
  // used for deletion to prevent the need to search
  index;

  geometry;
  indices;
  transformMatrix;
  textureIndex;
  secondaryTextureIndex;
  extents; // [[xMin, xMax], [yMin, yMax]]

  clicked = false;
  onClick = () => {}

  constructor(
    index,
    geometry,
    indices,
    textureIndex,
    secondaryTextureIndex,
    transformMatrix,
    extents,
    onClick = () => {}
  ) {
    this.index = index;
    this.geometry = geometry;
    this.indices = indices;
    this.textureIndex = textureIndex;
    this.secondaryTextureIndex = secondaryTextureIndex;
    this.transformMatrix = transformMatrix;
    // we could calculate the AABB from the geometry but it's faster just to set it
    // since we should already know it from mesh generation
    this.extents = extents;
    this.onClick = onClick;
  }

  draw (gl, program) {
    // TODO: enable batch rendering for instances with the same geo and texture
    LoadTexture(gl, program, this.textureIndex);

    // load geo
    LoadGeometry(gl, program, this.geometry, this.indices, 4, 2);

    const modelMatrixUniform = gl.getUniformLocation(program, 'uModelMatrix');
    gl.uniformMatrix4fv(
      modelMatrixUniform,
      false,
      new Float32Array(
        this.transformMatrix,
      )
    );

    gl.drawElements(gl.TRIANGLE_STRIP, this.indices.length, gl.UNSIGNED_SHORT, 0);
  }

  onMouseOver (event) {

  }

  onMouseMove (event) {
    if (this.dragging) {
      this.transformMatrix = TranslationMatrix(vec4Add(event.worldMousePos, this.clickOffset));
    }
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
  }

  onMouseUp (event) {
    if (this.clicked && this.onClick) {
      this.onClick();
    }
  }

  isMouseWithinBounds (worldMousePos) {
    // get our position from transformMatrix
    const bounds = this.getBounds();

    return (
      worldMousePos[0] >= bounds[0] &&
      worldMousePos[0] <= bounds[1] &&
      worldMousePos[1] >= bounds[2] &&
      worldMousePos[1] <= bounds[3]
    );
  }

  getBoundsForPos (position) {
    return [
      position[0] + this.extents[0][0], // left
      position[0] + this.extents[0][1], // right
      position[1] + this.extents[1][0], // bottom
      position[1] + this.extents[1][1], // top
    ];
  }

  getBounds () {
    return this.getBoundsForPos(getTranslation(this.transformMatrix));
  }
};