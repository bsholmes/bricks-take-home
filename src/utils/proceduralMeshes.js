import {
  DEG_TO_RAD,
  vec4Add,
  vec4Scale
} from './vectorMath';

import { getArrowDirection } from './utils';

// Creates sphere vertex data given a number of segments and rings
export const SphereModel = (segments, rings, radius) => {
  let vertData = [];
  let indices = [];

  if (segments < 3 || rings < 3) {
    throw new Error('Sphere must have at least 3 segments and rings');
  }

  const dSegment = (180 / segments) * DEG_TO_RAD;
  const dRing = (360 / rings) * DEG_TO_RAD;

  for (let i = 0; i <= rings; ++i) {
    for (let j = 0; j <= segments; ++j) {
      const v = [
        Math.sin(i * dSegment) * Math.cos(j * dRing),
        -Math.cos(i * dSegment),
        Math.sin(i * dSegment) * Math.sin(j * dRing)
      ];

      vertData = [
        ...vertData,
        ...[
          radius * v[0],
          radius * v[1],
          radius * v[2],
          1,
          j / segments,
          i / rings
        ]
      ];

      if ((i * rings + j) === 0) {
        indices = [...indices, (i + 1) * rings + j];
      }

      indices = [...indices, i * segments + j];
      indices = [...indices, (i + 1) * segments + j + 1];
    }
  }

  return { vertData, indices };
};

export const PlaneModel = (xSegments, ySegments, extents = [1, 1, 1]) => {
  // verts and uvs
  let vertData = [];
  let indices = [];

  const halfX = extents[0] / 2;
  const halfY = extents[1] / 2;

  for (let i = 0; i <= ySegments; ++i) {
    for (let j = 0; j <= xSegments; ++j) {
      vertData = [
        ...vertData,
        -halfX + extents[0] * (j / xSegments),
        -halfY + extents[1] * (i / ySegments),
        extents[2],
        1,
        j / xSegments,
        i / ySegments
      ];
    }
  }

  const directions = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0]
  ];

  indices = [0];

  // for a strip we need to spiral inwards
  // start from 0, 0
  // make a quad
  // go up to 0, 1
  // keep making quads and going up until you reach the top
  // go right until end
  // go down until end
  // go left until end, less the first quad we already made
  // if there are more then go inwards and do the same process (resursive)
  const recursivelySpiralIndices = (_indices, _start, _columns, _rows) => {
    for (let i = 0; i < 4; ++i) {
      const segments = directions[i][0] * xSegments + directions[i][1] * ySegments;
      if (directions[i][0] !== 0 && directions[i][1] === 0) {
        const direction = directions[i][0];
        // horizontal
        // either start from zero and iterate up to segments
        // or start at segments and iterate down to zero
        const posDirColumns = (_columns % 2) === 0 ? _columns / 2 : Math.floor(_columns / 2) + (_columns % 2);
        const negDirColumns = _columns - posDirColumns;
        const columnIndex = _columns % 2 !== 0 ? xSegments - (posDirColumns - 1) : negDirColumns;

        let j = 0;
        if (direction > 0) {
          for (j = _start[0]; j < Math.max(segments - negDirColumns, 0); j += direction) {
            _indices = [..._indices, j + (_start[1] - direction) * (xSegments + 1)];
            _indices = [..._indices, (j + direction) + _start[1] * (xSegments + 1)];
          }
          _indices = [..._indices, Math.max(segments - negDirColumns, 0) + (_start[1] - direction) * (xSegments + 1)];
        } else {
          for (j = _start[0]; j > Math.max(segments, posDirColumns); j += direction) {
            _indices = [..._indices, j + (_start[1] - direction) * (xSegments + 1)];
            _indices = [..._indices, (j + direction) + _start[1] * (xSegments + 1)];
          }
          _indices = [..._indices, Math.max(segments, posDirColumns) + (_start[1] - direction) * (xSegments + 1)];
        }
        _rows++;

        if (_columns === xSegments || _rows === ySegments) {
          return _indices;
        }

        const posDirRows = (_rows % 2) === 0 ? _rows / 2 : Math.floor(_rows / 2) + (_rows % 2);
        const negDirRows = _rows - posDirRows;
        const rowIndex = _rows % 2 !== 0 ? ySegments - posDirRows : negDirRows;

        _start = [columnIndex, rowIndex];
      } else {
        const direction = directions[i][1];
        const posDirRows = (_rows % 2) === 0 ? _rows / 2 : Math.floor(_rows / 2) + (_rows % 2);
        let j = 0;
        // vertical
        if (direction > 0) {
          for (j = _start[1]; j < Math.max(segments - posDirRows, 0); j += direction) {
            _indices = [..._indices, (_start[0] + direction) + j * (xSegments + 1)];
            _indices = [..._indices, _start[0] + (j + direction) * (xSegments + 1)];
          }
          _indices = [..._indices, (_start[0] + direction) + (_start[1] + Math.max(segments - Math.max(_rows, 0))) * (xSegments + 1)];
        } else {
          const negDirRows = _rows - posDirRows;
          for (j = _start[1]; j > Math.max(segments, negDirRows); j += direction) {
            _indices = [..._indices, (_start[0] + direction) + j * (xSegments + 1)];
            _indices = [..._indices, _start[0] + (j + direction) * (xSegments + 1)];
          }
          _indices = [..._indices, (_start[0] + direction) + (Math.max(segments, negDirRows)) * (xSegments + 1)];
        }
        _columns++;

        if (_columns === xSegments || _rows === ySegments) {
          return _indices;
        }
        const negDirRows = _rows - posDirRows;
        const rowIndex = _rows % 2 === 0 ? ySegments - posDirRows : negDirRows;

        const posDirColumns = (_columns % 2) === 0 ? _columns / 2 : Math.floor(_columns / 2) + (_columns % 2);
        const negDirColumns = _columns - posDirColumns;
        const columnIndex = _columns % 2 !== 0 ? posDirColumns : xSegments - negDirColumns;

        _start = [columnIndex, rowIndex];
      }
    }

    // only recurse if we haven't reached the last column/row
    if (_rows < ySegments || _columns < xSegments) {
      // TODO: indices wrong in the second recursion
      return recursivelySpiralIndices(_indices, _start, _columns, _rows);
    }

    return _indices;
  };
  indices = recursivelySpiralIndices(indices, [0, 0], 0, 0);

  return { vertData, indices };
};

export const QUAD = PlaneModel(1, 1, [1, 1, 0]);

export const LinePath = (
  startPos,
  startSide,
  endPos,
  endSide
) => {
  const MIN_LINE_DIST = 0.2;
  let vertData = [];

  const xDist = endPos[0] - startPos[0];
  const yDist = endPos[1] - startPos[1];

  const absXDist = Math.abs(xDist);
  const absYDist = Math.abs(yDist);

  let longDist = absXDist > absYDist ? xDist : yDist;
  let shortDist = absXDist < absYDist ? xDist : yDist;

  let longAxis = absXDist > absYDist ? [1, 0, 0, 0] : [0, 1, 0, 0];
  let shortAxis = absXDist < absYDist ? [1, 0, 0, 0] : [0, 1, 0, 0];

  const startArrowDir = getArrowDirection(startSide);
  const endArrowDir = getArrowDirection(endSide);

  let longAxisIndex = absXDist > absYDist ? 0 : 1;
  let shortAxisIndex = absXDist > absYDist ? 1 : 0;

  // if the major axis would be parallel to the arrow direction
  // and the distance and arrow direction in that axis have the same sign
  // then switch axes
  // otherwise the lines will frequently cross directly over the icon
  if (
    Math.abs(longAxis[0]) === Math.abs(startArrowDir[0]) &&
    Math.abs(longAxis[1]) === Math.abs(startArrowDir[1]) &&
    (
      Math.sign(longDist) === Math.sign(startArrowDir[longAxisIndex]) ||
      Math.sign(longDist) === Math.sign(endArrowDir[longAxisIndex])
    )
  ) {
    let tempAxis = longAxis;
    longAxis = shortAxis;
    shortAxis = tempAxis;

    let tempAxisIndex = longAxisIndex;
    longAxisIndex = shortAxisIndex;
    shortAxisIndex = tempAxisIndex;

    let tempDist = longDist;
    longDist = shortDist;
    shortDist = tempDist;
  }

  // generate right-angled path from start to end

  // small segment aligned to arrow, in opposite direction
  vertData = [...startPos, 0.5, 0.5];

  let point = vec4Add(
    startPos,
    vec4Scale(startArrowDir, -MIN_LINE_DIST)
  );
  point[2] = startPos[2];
  vertData = [...vertData, ...point, 0.5, 0.5];

  // second segment in the longer axis to end, half the distance
  point = vec4Add(
    vec4Scale(shortAxis, point[shortAxisIndex]),
    vec4Scale(
      longAxis,
      point[longAxisIndex] +
      longDist * 0.5 +
      vec4Scale(startArrowDir, MIN_LINE_DIST)[longAxisIndex]) // compensate for first-segment offset
  );
  point[2] = startPos[2];
  vertData = [...vertData, ...point, 0.5, 0.5];

  // third segment in the shorter axis, full length to where the last segment will be
  point = vec4Add(
    vec4Scale(longAxis, point[longAxisIndex]),
      vec4Scale(
        shortAxis,
        endPos[shortAxisIndex] + endArrowDir[shortAxisIndex] * -MIN_LINE_DIST
      )
  );
  point[2] = startPos[2];
  vertData = [...vertData, ...point, 0.5, 0.5];

  // fourth segment, similar to second, the second half of the distance
  point = vec4Add(
    vec4Scale(shortAxis, point[shortAxisIndex]),
    vec4Scale(longAxis, point[longAxisIndex] + longDist * 0.5)
  );
  point[2] = startPos[2];
  vertData = [...vertData, ...point, 0.5, 0.5];

  // fifth segment, similar to first, aligned to end arrow in opposite direction
  vertData = [...vertData, ...endPos, 0.5, 0.5];

  const indices = [0, 1, 2, 3, 4, 5];

  return {
    vertData,
    indices
  };
};
