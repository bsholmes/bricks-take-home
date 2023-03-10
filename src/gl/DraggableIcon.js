import {
  DEG_TO_RAD,
  getTranslation,
  mat4Mult,
  ScaleMatrix,
  TranslationMatrix,
  vec4Add
} from '../utils/vectorMath';

import Icon from './Icon';

const DELETE_ICON_OFFSET = [0.42, 0.36, 0];

export default class DraggableIcon extends Icon {
  dragging = false;
  clickOffset = [0, 0, 0];
  deleteIcon = null;
  onRemoveConnection = (index) => {};

  sideConnections = [
    null, // left
    null, // right
    null, // bottom
    null  // top
  ];

  constructor(
    index,
    textureIndex,
    secondaryTextureIndex,
    transformMatrix,
    extents,
    colorMultiply,
    onClick = () => {},
    onRemove = (index) => {},
    onRemoveConnection = (index) => {}
  ) {
    super(
      index,
      textureIndex,
      secondaryTextureIndex,
      transformMatrix,
      extents,
      colorMultiply,
      onClick,
      onRemove
    );

    this.onRemoveConnection = onRemoveConnection;
  }

  draw (gl, program) {
    super.draw(gl, program);
    
    if (this.clicked && this.deleteIcon) {
      // draw delete icon
      const position = getTranslation(this.transformMatrix);
      this.deleteIcon.transformMatrix = mat4Mult(
        ScaleMatrix([0.15, 0.15, 1, 0]),
        TranslationMatrix(vec4Add(position, DELETE_ICON_OFFSET))
      );
      this.deleteIcon.draw(gl, program);
    }
  }

  onMouseMove (event) {
    super.onMouseMove(event);
    if (this.dragging) {
      this.moveTo(
        vec4Add(event.worldMousePos, this.clickOffset),
        event.icons,
        event.camera
      );
    }
  }

  onMouseDown (event) {
    super.onMouseDown(event);
    
    if (this.deleteIcon) {
      this.deleteIcon.onMouseDown(event);
    }
    
    if (this.isMouseWithinBounds(event.worldMousePos)) {
      this.dragging = true;

      let worldPos = getTranslation(this.transformMatrix);
      this.clickOffset = [
        worldPos[0] - event.worldMousePos[0],
        worldPos[1] - event.worldMousePos[1],
        0
      ];

      if (!this.deleteIcon) {
        const position = getTranslation(this.transformMatrix);

        this.deleteIcon = new Icon(
          -1,
          this.secondaryTextureIndex,
          null,
          mat4Mult(
            ScaleMatrix([0.15, 0.15, 1, 0]),
            TranslationMatrix(vec4Add(position, DELETE_ICON_OFFSET))
          ),
          [[-0.075, 0.075], [-0.075, 0.075]],
          null,
          () => {
            this.onRemove(this.index);

            // remove connections
            for (let i = 0; i < this.sideConnections.length; ++i) {
              if (this.sideConnections[i]) {
                this.onRemoveConnection(this.sideConnections[i].index);
              }
            }

            this.deleteIcon = null;
          }
        );
      }
    }

    return this.clicked;
  }

  onMouseUp (event) {
    super.onMouseUp(event);

    if (!this.clicked) {
      this.deleteIcon = null;
    }

    if (this.deleteIcon) {
      this.deleteIcon.onMouseUp(event);
    }

    this.dragging = false;
  }

  moveTo(position, nodes, camera) {
    let adjustedPosition = [...position];
    // collision detection with other nodes and the edge of the canvas
    const { hit, overlap } = this.collisionDetection(position, nodes, camera);

    if (hit) {
      adjustedPosition[0] += overlap[0];
      adjustedPosition[1] += overlap[1];
    }

    this.transformMatrix = TranslationMatrix(adjustedPosition);
  }

  collisionDetection(position, nodes, camera) {
    // compare bounds to other bounds
    let overlap = [0, 0];
    let adjustDirection = null;
    let ignoreIndices = [];

    for (let i = 0; i < nodes.length; ++i) {
      if (nodes[i].index === this.index || ignoreIndices.some(idx => idx === i)) {
        continue;
      }

      const bounds = this.getBoundsForPos(vec4Add(position, overlap));
      const otherBounds = nodes[i].getBounds();

      const overlapLeft = (bounds[0] <= otherBounds[1] && bounds[1] >= otherBounds[1]);
      const overlapRight = (bounds[1] >= otherBounds[0] && bounds[0] <= otherBounds[0]);

      const boundsOverlapX = overlapLeft || overlapRight;

      const overlapBottom = (bounds[2] <= otherBounds[3] && bounds[3] >= otherBounds[3]);
      const overlapTop = (bounds[3] >= otherBounds[2] && bounds[2] <= otherBounds[2]);

      const boundsOverlapY = overlapBottom || overlapTop;

      if (boundsOverlapX && boundsOverlapY) {

        // figure out what direction to adjust

        // calculate the adjustment that will put our icon at the edge of this one

        // determine overlap
        let overlapX = 0;
        let overlapY = 0;

        if (overlapLeft) {
          overlapX = otherBounds[1] - bounds[0];
        } else if (overlapRight) {
          overlapX = otherBounds[0] - bounds[1];
        }

        if (overlapBottom) {
          overlapY = otherBounds[3] - bounds[2];
        } else if (overlapTop) {
          overlapY = otherBounds[2] - bounds[3];
        }

        if (adjustDirection === null) {
          if (Math.abs(overlapX) < Math.abs(overlapY)) {
            if (overlapX < 0) {
              adjustDirection = 0;
            } else {
              adjustDirection = 1;
            }
          } else {
            if (overlapY < 0) {
              adjustDirection = 2;
            } else {
              adjustDirection = 3;
            }
          }
        }

        let adjust = [];

        if (adjustDirection < 2) {
          adjust[0] = otherBounds[adjustDirection] + this.extents[0][adjustDirection];
        } else {
          adjust[0] = position[0];
        }

        if (adjustDirection >= 2) {
          adjust[1] = otherBounds[adjustDirection] + this.extents[1][adjustDirection - 2];
        } else {
          adjust[1] = position[1];
        }

        overlap[0] = adjust[0] - position[0];
        overlap[1] = adjust[1] - position[1];

        // restart the loop, we may have new collisions with the new overlap offset
        // but don't check the same node again
        ignoreIndices.push(i);
        i = -1; 
      }
    }

    // collide with edge of canvas
    const bounds = this.getBoundsForPos(vec4Add(position, overlap));

    // get world-space view frustum width and height at our z position
    const zPos = getTranslation(this.transformMatrix)[2];
    const distance = zPos - camera.position[2];
    const halfHeight = Math.tan((camera.fov * DEG_TO_RAD) / 2) * distance;
    const halfWidth = halfHeight * camera.aspect;

    if (bounds[0] < -halfWidth) {
      overlap[0] = -halfWidth - bounds[0];
    }
    if (bounds[1] > halfWidth) {
      overlap[0] = halfWidth - bounds[1];
    }
    if (bounds[2] < -halfHeight) {
      overlap[1] = -halfHeight - bounds[2];
    }
    if (bounds[3] > halfHeight) {
      overlap[1] = halfHeight - bounds[3];
    }

    return {
      hit: overlap[0] !== 0 || overlap[1] !== 0,
      overlap
    };
  }
}
