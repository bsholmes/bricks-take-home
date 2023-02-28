import {
  LoadTexture,
  LoadGeometry
} from '../components/common/utils';
import {
  IdentityMatrix,
  mat4Mult,
  ProjectionMatrix,
  RotationMatrix,
  ViewMatrix
} from '../components/common/vectorMath';

export default class Icon {
  geometry;
  indices;
  transformMatrix;
  texture;

  constructor(geometry, indices, texture, transformMatrix) {
    this.geometry = geometry;
    this.indices = indices;
    this.texture = texture;
    this.transformMatrix = transformMatrix;
  }

  draw = (gl, program) => {
    // TODO: enable batch rendering for instances with the same geo and texture

    // load geo
    LoadGeometry(gl, program, this.geometry, this.indices, 4, 2);

    // load texture
    LoadTexture(gl, program, this.texture, 0);

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

    gl.drawElements(gl.LINE_STRIP, this.indices.length, gl.UNSIGNED_SHORT, 0);
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
    
  }

  isMouseWithinBounds = (worldMousePos) => {

  }
};