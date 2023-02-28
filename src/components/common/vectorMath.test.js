import {
  expect,
  jest,
  test,
  describe
} from '@jest/globals';
import {
  vec4Dot,
  vec4Cross,
  vec4Add,
  vec4Sub,
  vec4Scale,
  vec4Magnitude,
  vec4Normalize,
  mat4Mult,
  mat4Transpose,
  IdentityMatrix,
  ProjectionMatrix,
  ViewMatrix
} from './vectorMath';

describe('vector math', () => {
  test('vec4 dot product', () => {
    const vec1 = [2, 3, 4, 5];
    const vec2 = [3, 6, 8, 10];
    const result = vec4Dot(vec1, vec2);
    expect(result).toEqual(106);
  });

  test('vec4 cross product', () => {
    const vec1 = [1, 0, 0, 0];
    const vec2 = [0, 1, 0, 0];
    const result = vec4Cross(vec1, vec2);
    expect(result).toEqual([0, 0, 1, 0]);
  });

  test('vec4 add', () => {
    const vec1 = [2, 3, 4, 5];
    const vec2 = [3, 6, 8, 10];
    const result = vec4Add(vec1, vec2);
    expect(result).toEqual([5, 9, 12, 15]);
  });

  test('vec4 subtract', () => {
    const vec1 = [2, 3, 4, 5];
    const vec2 = [3, 6, 8, 10];
    const result = vec4Sub(vec1, vec2);
    expect(result).toEqual([-1, -3, -4, -5]);
  });

  test('vec4 scale', () => {
    const vec = [2, 3, 4, 5];
    const scalar = 3;
    const result = vec4Scale(vec, scalar);
    expect(result).toEqual([6, 9, 12, 15]);
  });

  test('vec4 magnitude', () => {
    const vec = [2, 3, 4, 5];
    const result = vec4Magnitude(vec);
    expect(result).toBeCloseTo(7.3484692283495342945918522241177);
  });

  test('vec4 normalize', () => {
    const vec = [6, 0, 0, 0];
    const result = vec4Normalize(vec);
    expect(result).toEqual([1, 0, 0, 0]);
  });
});

describe('matrix math', () => {
  test('mat4 Mult', () => {
    const mat1 = [
      2,  3,  4,  5,
      6,  7,  8,  9,
      10, 11, 12, 13,
      14, 15, 16, 17
    ];
    const mat2 = [
      5,  7,  9,  11,
      13, 15, 17, 19,
      21, 23, 25, 27,
      29, 31, 33, 35
    ];
    const result = mat4Mult(mat1, mat2);

    const expected = [
      278, 306, 334, 362,
      550, 610, 670, 730,
      822, 914, 1006, 1098,
      1094, 1218, 1342, 1466
    ];

    const result2 = mat4Mult(mat2, mat1);
    const expected2 = [
      296, 328, 360, 392,
      552, 616, 680, 744,
      808, 904, 1000, 1096,
      1064, 1192, 1320, 1448
    ];

    expect(result).toEqual(expected);

    expect(result2).toEqual(expected2);
  });

  test('mat4 Transpose', () => {
    const mat1 = [
      2,  3,  4,  5,
      6,  7,  8,  9,
      10, 11, 12, 13,
      14, 15, 16, 17
    ];
    const expected = [
      2, 6, 10, 14,
      3, 7, 11, 15,
      4, 8, 12, 16,
      5, 9, 13, 17
    ];
    const result = mat4Transpose(mat1);

    expect(result).toEqual(expected);
  });

  test('identity matrix', () => {
    const expected = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
    const result = IdentityMatrix();

    expect(result).toEqual(expected);
  });

  test('projection matrix', () => {
    const expected = [
      0.9999999999977429,0,0,0,
      0,0.9999999999977429,0,0,
      0,0,-1.0000200002000021,-0.0020000200002000023,
      0,0,-1,1
    ];
    const result = ProjectionMatrix(90, 1, 0.001, 100);

    expect(result).toEqual(expected);
  });

  test('view matrix', () => {
    const expected = [
      1, 0, 0, -0,
      -0, 1, 0, -0,
      0, 0, -1, 1,
      0, 0, 0, 1
    ];
    const result = ViewMatrix([0, 0, -1, 0], [0, 0, 1, 0], [0, 1, 0, 0]);

    expect(result).toEqual(expected);
  });
});