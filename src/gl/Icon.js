import {
  LoadTexture,
  LoadGeometry,
  projectMouseCoordsToWorldSpace
} from '../components/common/utils';
import {
  IdentityMatrix,
  mat4Mult,
  ProjectionMatrix,
  TranslationMatrix,
  RotationMatrix,
  ViewMatrix,
  getTranslation
} from '../components/common/vectorMath';

export default class Icon {
  geometry;
  indices;
  transformMatrix;
  texture;
  extents; // [[xMin, xMax], [yMin, yMax]]

  constructor(geometry, indices, texture, transformMatrix, extents) {
    this.geometry = geometry;
    this.indices = indices;
    this.texture = texture;
    this.transformMatrix = transformMatrix;
    // we could calculate the AABB from the geometry but it's faster just to set it
    // since we should already know it from mesh generation
    this.extents = extents; 
  }

  draw = (gl, program) => {
    // TODO: enable batch rendering for instances with the same geo and texture

    // load geo
    LoadGeometry(gl, program, this.geometry, this.indices, 4, 2);

    // load texture
    LoadTexture(gl, program, this.texture, 0);

    // console.log(this.transformMatrix);

    const mvpUniform = gl.getUniformLocation(program, 'uMVP');
    gl.uniformMatrix4fv(
      mvpUniform,
      false,
      new Float32Array(
        mat4Mult(
          this.transformMatrix,
          mat4Mult(
            ViewMatrix([0, 0, -1, 0], [0, 0, 1, 0], [0, 1, 0, 0]),
            ProjectionMatrix(90, gl.canvas.width / gl.canvas.height, 0.00000001, 1000)
          )
        )
      )
    );

    gl.drawElements(gl.TRIANGLE_STRIP, this.indices.length, gl.UNSIGNED_SHORT, 0);
  }

  onMouseOver = (event) => {

  }

  onMouseMove = (event) => {
    
  }

  onMouseOut = (event) => {
    
  }

  onMouseDown = (event) => {
    
  }

  onMouseUp = (event) => {
    
    let worldMousePos = projectMouseCoordsToWorldSpace(
      [event.pageX - event.target.offsetLeft, event.pageY - event.target.offsetTop],
      event.canvasSize,
      event.camera,
      event.zDepth,
    );

    console.log("Set to " + worldMousePos);

    this.transformMatrix = TranslationMatrix(worldMousePos);
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