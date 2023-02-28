export const DEG_TO_RAD = 1 / 57.295779513;
export const RAD_TO_DEG = 57.295779513;

/**
 **************** VECTOR ****************
 */

export const vec4Dot = (left, right) => {
  let dProduct = 0;

  for (let i = 0; i < 4; ++i) {
    dProduct += (left[i] * right[i]);
  }

  return dProduct;
};

export const vec4Cross = (left, right) => {
  const tempVec = [];

  tempVec[0] = left[1] * right[2] - right[1] * left[2];
  tempVec[1] = left[2] * right[0] - right[2] * left[0];
  tempVec[2] = left[0] * right[1] - right[0] * left[1];
  tempVec[3] = 0;

  return tempVec;
};

export const vec4Add = (left, right) => {
  const tempVec = [];

  for (let i = 0; i < 4; ++i) {
    tempVec[i] = left[i] + right[i];
  }

  return tempVec;
};

export const vec4Sub = (left, right) => {
  const tempVec = [];

  for (let i = 0; i < 4; ++i) {
    tempVec[i] = left[i] - right[i];
  }

  return tempVec;
};

export const vec4Scale = (leftVec4, rightScalar) => {
  const tempVec = [];

  for (let i = 0; i < 4; ++i) {
    tempVec[i] = leftVec4[i] * rightScalar;
  }

  return tempVec;
};

export const vec4Magnitude = (vec4) => {
  return Math.sqrt(vec4Dot(vec4, vec4));
};

export const vec4Normalize = (vec4) => {
  return vec4Scale(vec4, 1 / vec4Magnitude(vec4));
};

/**
 **************** MATRIX ****************
 */

export const mat4Mult = (left, right) => {
  const tempMat = [];
  const n = 4;

  for (let i = 0; i < n; ++i) {
    for (let e = 0; e < n; ++e) {
      tempMat[i * n + e] = vec4Dot(
        [left[i * n], left[i * n + 1], left[i * n + 2], left[i * n + 3]],
        [right[e], right[e + n], right[e + n * 2], right[e + n * 3]]
      );
    }
  }

  return tempMat;
};

export const mat4Transpose = (mat4) => {
  const tempMat = [];

  for (let i = 0; i < 4; ++i) {
    for (let e = 0; e < 4; ++e) {
      tempMat[i + e * 4] = mat4[i * 4 + e];
    }
  }

  return tempMat;
};

export const IdentityMatrix = () => {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ];
};

export const ViewMatrix = (camPos, targetPos, upDir) => {
  const z = vec4Normalize(vec4Sub(camPos, targetPos));
  const x = vec4Normalize(vec4Cross(z, upDir));
  const y = vec4Normalize(vec4Cross(z, vec4Scale(x, -1)));

  return mat4Transpose([
    x[0], x[1], x[2], -camPos[0],
    y[0], y[1], y[2], -camPos[1],
    z[0], z[1], z[2], -camPos[2],
    0,    0,    1,    1
  ]);
};

export const ProjectionMatrix = (fovy, aspect, near, far) => {
  const f = 1 / Math.tan((fovy * DEG_TO_RAD) / 2);
  return mat4Transpose([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 1
  ]);
};

export const RotationMatrix = (angle, axisOfRotation) => {
  const angleRad = angle * DEG_TO_RAD;

  const rotMat = IdentityMatrix();

  const vN = vec4Normalize(axisOfRotation);
  const c = Math.cos(angleRad);
  let s = Math.sin(angleRad);

  if (axisOfRotation[0] !== 0 && axisOfRotation[1] === 0 && axisOfRotation[2] === 0) {
    // Rotation around the X axis
    if (axisOfRotation[0] < 0) {
      s = -s;
    }

    rotMat[0] = 1; rotMat[4] = 0; rotMat[8] = 0; rotMat[12] = 0;
    rotMat[1] = 0; rotMat[5] = c; rotMat[9] = -s; rotMat[13] = 0;
    rotMat[2] = 0; rotMat[6] = s; rotMat[10] = c; rotMat[14] = 0;
    rotMat[3] = 0; rotMat[7] = 0; rotMat[11] = 0; rotMat[15] = 1;
  } else if (axisOfRotation[0] === 0 && axisOfRotation[1] !== 0 && axisOfRotation[2] === 0) {
    // Rotation around Y axis
    if (axisOfRotation[1] < 0) {
      s = -s;
    }

    rotMat[0] = c; rotMat[4] = 0; rotMat[8] = s; rotMat[12] = 0;
    rotMat[1] = 0; rotMat[5] = 1; rotMat[9] = 0; rotMat[13] = 0;
    rotMat[2] = -s; rotMat[6] = 0; rotMat[10] = c; rotMat[14] = 0;
    rotMat[3] = 0; rotMat[7] = 0; rotMat[11] = 0; rotMat[15] = 1;
  } else if (axisOfRotation[0] === 0 && axisOfRotation[1] === 0 && axisOfRotation[2] !== 0) {
    // Rotation around Z axis
    if (axisOfRotation[2] < 0) {
      s = -s;
    }

    rotMat[0] = c; rotMat[4] = -s; rotMat[8] = 0; rotMat[12] = 0;
    rotMat[1] = s; rotMat[5] = c; rotMat[9] = 0; rotMat[13] = 0;
    rotMat[2] = 0; rotMat[6] = 0; rotMat[10] = 1; rotMat[14] = 0;
    rotMat[3] = 0; rotMat[7] = 0; rotMat[11] = 0; rotMat[15] = 1;
  } else {
    // Rotation around any arbitrary axis
    const ux = vN[0];
    const uy = vN[1];
    const uz = vN[2];

    const c1 = 1 - c;

    rotMat[0] = c + ux * ux * c1;
    rotMat[1] = uy * ux * c1 + uz * s;
    rotMat[2] = uz * ux * c1 - uy * s;
    rotMat[3] = 0;

    rotMat[4] = ux * uy * c1 - uz * s;
    rotMat[5] = c + uy * uy * c1;
    rotMat[6] = uz * uy * c1 + ux * s;
    rotMat[7] = 0;

    rotMat[8] = ux * uz * c1 + uy * s;
    rotMat[9] = uy * uz * c1 - ux * s;
    rotMat[10] = c + uz * uz * c1;
    rotMat[11] = 0;

    rotMat[12] = 0;
    rotMat[13] = 0;
    rotMat[14] = 0;
    rotMat[15] = 1;
  }

  return rotMat;
};

export const TranslationMatrix = (translateVec) => {
  return ([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    translateVec[0], translateVec[1], translateVec[2], 1
  ]);
};
