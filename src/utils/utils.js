import {
  TEXTURE_SLOTS,
  FLOAT_BYTE_SIZE
} from './constants';
import {
  DEG_TO_RAD,
  vec4Add,
  vec4Mult,
  mat4Mult,
  RotationMatrix,
  ScaleMatrix,
  TranslationMatrix
} from './vectorMath';

export const isPowerOfTwo = (x) => {
  return (Math.log(x) / Math.log(2)) % 1 === 0;
};

export const CreateAndCompileShader = (glContext, shaderSource, shaderType) => {
  const shader = glContext.createShader(shaderType);
  glContext.shaderSource(shader, shaderSource);
  glContext.compileShader(shader);

  const shaderCompileStatus = glContext.getShaderParameter(shader, glContext.COMPILE_STATUS);

  if (!shaderCompileStatus) {
    const shaderInfoLog = glContext.getShaderInfoLog(shader);

    console.error(`shader failed to compile \n\n${shaderInfoLog}`);
  }

  return shader;
};

export const CreateAndLinkProgramWithShaders = (glContext, vertShaderSource, fragShaderSource) => {
  const program = glContext.createProgram();

  const vertexShader = CreateAndCompileShader(glContext, vertShaderSource, glContext.VERTEX_SHADER);
  const fragmentShader = CreateAndCompileShader(glContext, fragShaderSource, glContext.FRAGMENT_SHADER);

  // Attach pre-existing shaders
  glContext.attachShader(program, vertexShader);
  glContext.attachShader(program, fragmentShader);

  glContext.linkProgram(program);

  if (!glContext.getProgramParameter(program, glContext.LINK_STATUS)) {
    const info = glContext.getProgramInfoLog(program);
    throw new Error(`Could not compile WebGL program. \n\n${info}`);
  }

  return program;
};

export const CreateTexture = (gl, program, image, textureIndex = 0) => {
  // load texture
  // get width and height of image
  const img = new Image();
  img.src = image;

  // TODO: THIS NEEDS TO BE SYNCHRONOUS, we can't wait for
  img.onload = () => {
    const texture = gl.createTexture();
    const texWidth = img.width;
    const texHeight = img.height;

    gl.activeTexture(TEXTURE_SLOTS(gl)[textureIndex]);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      img
    );

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOfTwo(texWidth) && isPowerOfTwo(texHeight)) {
      // Yes, it's a power of 2. Generate mips.
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // No, it's not a power of 2. Turn off mips and set
      // wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    // const texUniformIndex = gl.getUniformLocation(program, 'uTex2d');

    // gl.uniform1i(texUniformIndex, textureIndex);
  };
};

export const LoadTexture = (gl, program, textureIndex = 0) => {
  // load texture
  const texUniformIndex = gl.getUniformLocation(program, 'uTex2d');

  gl.uniform1i(texUniformIndex, textureIndex);
};

// currently supports 4-component verts interlaced with 2-component UVs
// add normals, tangents, colors, etc?
export const LoadGeometry = (gl, program, vertData, indices, vertComponentNum = 4, texCoordComponentNum = 2) => {
  // Create array buffer
  const geoBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, geoBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertData), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  const vertPosIndex = gl.getAttribLocation(program, 'aVertPos');
  gl.enableVertexAttribArray(vertPosIndex);
  gl.vertexAttribPointer(
    vertPosIndex,
    vertComponentNum,
    gl.FLOAT,
    false,
    (vertComponentNum + texCoordComponentNum) * FLOAT_BYTE_SIZE,
    0
  );

  if (texCoordComponentNum > 0) {
    const texCoordsIndex = gl.getAttribLocation(program, 'aTexCoords');
    gl.enableVertexAttribArray(texCoordsIndex);
    gl.vertexAttribPointer(
      texCoordsIndex,
      texCoordComponentNum,
      gl.FLOAT,
      false,
      (vertComponentNum + texCoordComponentNum) * FLOAT_BYTE_SIZE,
      vertComponentNum * FLOAT_BYTE_SIZE
    );
  }
};

export const getViewWidthHeightAtZ = (fovY, aspect, zPos) => {
  const height = 2 * Math.tan(fovY * DEG_TO_RAD / 2) * zPos;
  const width = height * aspect;

  return { height, width };
};

export const projectMouseCoordsToWorldSpace = (mouseCoords, canvasSize, camera, zPos) => {
  // normalize to view-space coordinates, from center, inverting y
  const viewCoords = [
    -0.5 + (mouseCoords[0] / canvasSize[0]),
    0.5 - (mouseCoords[1] / canvasSize[1]),
    1,
    0
  ];

  const distance = zPos - camera.position[2];

  // calculate the plane width and height at the distance of the zPos
  const height = 2 * Math.tan((camera.fov * DEG_TO_RAD) / 2) * distance;
  const width = height * camera.aspect;

  // multiply by the viewCoords
  const worldPos = vec4Add(camera.position, vec4Mult([width, height, distance, 0], viewCoords));

  return worldPos;
};

export const getArrowTransformMatrix = (icon, sideIndex, position, scale, startPos) => {
  if (icon) {
    // rotate and offset based on side index
    let offset = [];
    let rotDegrees = 0;
    switch (sideIndex) {
      case 1:
        offset = [scale[0] * 0.5, 0, 0, 0];
        // implicitly rotDegrees = 0
        break;
      case 2:
        offset = [0, scale[1] * -0.5, 0, 0];
        rotDegrees = -90;
        break;
      case 3:
        offset = [0, scale[1] * 0.5, 0, 0];
        rotDegrees = 90;
        break;
      case 0:
      default:
        offset = [scale[0] * -0.5, 0, 0, 0];
        rotDegrees = 180;
        break;
    }

    const location = vec4Add(
      position,
      offset
    );

    return mat4Mult(
      RotationMatrix(rotDegrees, [0, 0, 1, 0]),
      mat4Mult(
        ScaleMatrix(scale),
        TranslationMatrix(location)
      )
    );
  } else {
    // get rotation based on connection axes
    let rotDegrees = 0;

    const xDist = position[0] - startPos[0];
    const yDist = position[1] - startPos[1];

    const absXDist = Math.abs(xDist);
    const absYDist = Math.abs(yDist);

    if (absXDist > absYDist) {
      rotDegrees = Math.sign(xDist) > 0 ? 180 : 0;
    } else {
      rotDegrees = Math.sign(yDist) > 0 ? -90 : 90;
    }

    return mat4Mult(
      RotationMatrix(rotDegrees, [0, 0, 1, 0]),
      mat4Mult(
        ScaleMatrix(scale),
        TranslationMatrix(position)
      )
    );
  }
};

export const getArrowDirection = (side) => {
  switch (side) {
    case 1:
      return [-1, 0, 0, 0];
    case 2:
      return [0, 1, 0, 0];
    case 3:
      return [0, -1, 0, 0];
    case 0:
    default:
      return [1, 0, 0, 0];
  }
};
