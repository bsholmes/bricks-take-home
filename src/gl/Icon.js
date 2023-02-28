import {
  LoadTexture,
  LoadGeometry,
} from '../components/common/utils';
import {
  mat4Mult,
  ProjectionMatrix,
  TranslationMatrix,
  RotationMatrix,
  ViewMatrix,
  getTranslation,
  vec4Add
} from '../components/common/vectorMath';

export default class Icon {
  geometry;
  indices;
  transformMatrix;
  texture;
  extents; // [[xMin, xMax], [yMin, yMax]]

  clicked = false;
  clickOffset = [0, 0, 0];

  constructor(geometry, indices, texture, transformMatrix, extents) {
    this.geometry = geometry;
    this.indices = indices;
    this.texture = texture;
    this.transformMatrix = transformMatrix;
    // we could calculate the AABB from the geometry but it's faster just to set it
    // since we should already know it from mesh generation
    this.extents = extents; 
  }

  draw = (gl, program, camera) => {
    // TODO: enable batch rendering for instances with the same geo and texture

    // load geo
    LoadGeometry(gl, program, this.geometry, this.indices, 4, 2);

    // load texture
    LoadTexture(gl, program, this.texture, 0);

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

  onMouseOver = (event) => {

  }

  onMouseMove = (event) => {
    if (this.clicked) {
      this.transformMatrix = TranslationMatrix(vec4Add(event.worldMousePos, this.clickOffset));
    }
  }

  onMouseOut = (event) => {
    
  }

  onMouseDown = (event) => {
    if (this.isMouseWithinBounds(event.worldMousePos)) {
      this.clicked = true;
      let worldPos = getTranslation(this.transformMatrix);
      this.clickOffset = [
        worldPos[0] - event.worldMousePos[0],
        worldPos[1] - event.worldMousePos[1],
        0
      ];
    }
  }

  onMouseUp = (event) => {
    this.clicked = false;
  }

  isMouseWithinBounds = (worldMousePos) => {
    // get our position from transformMatrix
    let worldPos = getTranslation(this.transformMatrix);

    const xMin = worldPos[0] + this.extents[0][0];
    const xMax = worldPos[0] + this.extents[0][1];
    const yMin = worldPos[1] + this.extents[1][0];
    const yMax = worldPos[1] + this.extents[1][1];

    return (
      worldMousePos[0] >= xMin &&
      worldMousePos[0] <= xMax &&
      worldMousePos[1] >= yMin &&
      worldMousePos[1] <= yMax
    );
  }
};