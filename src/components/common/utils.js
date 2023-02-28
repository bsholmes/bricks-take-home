import {
  TEXTURE_SLOTS,
  FLOAT_BYTE_SIZE
} from './constants';
import { DEG_TO_RAD } from './vectorMath';

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

export const LoadTexture = (gl, program, image, textureIndex = 0) => {
  // load texture
  // get width and height of image
  const img = new Image();
  img.src = image;

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

    const texUniformIndex = gl.getUniformLocation(program, 'uTex2d');

    gl.uniform1i(texUniformIndex, textureIndex);
  };
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
  let height = 2 * Math.tan(fovY * DEG_TO_RAD / 2) * zPos;
  let width = height * aspect;

  return { height, width };
};