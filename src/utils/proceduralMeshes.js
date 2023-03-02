import { DEG_TO_RAD } from './vectorMath';

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

export const QUAD = new PlaneModel(1, 1, [1, 1, 0]);
