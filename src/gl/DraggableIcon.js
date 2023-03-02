import {
  DEG_TO_RAD,
  TranslationMatrix,
  getTranslation,
  vec4Add
} from '../utils/vectorMath';
import { PlaneModel } from '../utils/proceduralMeshes';

import Icon from './Icon';


const DELETE_ICON_OFFSET = [0.42, 0.36, 0];

export default class DraggableIcon extends Icon {
  clicked = false;
  dragging = false;
  clickOffset = [0, 0, 0];
  deleteIcon = null;

  onDelete = (index) => {};

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
    onClick = () => {},
    onDelete = (index) => {}
  ) {
    super(
      index,
      textureIndex,
      secondaryTextureIndex,
      transformMatrix,
      extents,
      onClick
    );

    this.onDelete = onDelete;
  }

  draw (gl, program) {
    super.draw(gl, program);
    
    if (this.clicked && this.deleteIcon) {
      // draw delete icon
      const position = getTranslation(this.transformMatrix);
      this.deleteIcon.transformMatrix = TranslationMatrix(vec4Add(position, DELETE_ICON_OFFSET));
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

        const { vertData, indices: deleteIndices } = PlaneModel(1, 1, [0.15, 0.15, 0]);

        this.deleteIcon = new Icon(
          -1,
          vertData,
          deleteIndices,
          this.secondaryTextureIndex,
          null,
          TranslationMatrix(vec4Add(position, DELETE_ICON_OFFSET)),
          [[-0.075, 0.075], [-0.075, 0.075]],
          () => {
            this.onDelete(this.index);
            this.deleteIcon = null;
          }
        );
      }
    }
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
    const collision = this.collisionDetection(position, nodes, camera);
    if (collision.hit) {
      adjustedPosition[0] += collision.overlap[0];
      adjustedPosition[1] += collision.overlap[1];
    }

    this.transformMatrix = TranslationMatrix(adjustedPosition);
  }

  collisionDetection(position, nodes, camera) {
    // compare bounds to other bounds
    let overlap = [0, 0];
    let maxOverlap = [0, 0, 0];

    for (let i = 0; i < nodes.length; ++i) {
      const bounds = this.getBoundsForPos(vec4Add(position, overlap));
      const otherBounds = nodes[i].getBounds();

      const overlapLeft = (bounds[0] < otherBounds[1] && bounds[1] > otherBounds[1]);
      const overlapRight = (bounds[1] > otherBounds[0] && bounds[0] < otherBounds[0]);

      const boundsOverlapX = overlapLeft || overlapRight;

      const overlapBottom = (bounds[2] < otherBounds[3] && bounds[3] > otherBounds[3]);
      const overlapTop = (bounds[3] > otherBounds[2] && bounds[2] < otherBounds[2]);

      const boundsOverlapY = overlapBottom || overlapTop;

      if (boundsOverlapX && boundsOverlapY) {
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

        if (Math.abs(overlapX) > Math.abs(maxOverlap[0])) {
          maxOverlap[0] = overlapX;
        }

        if (Math.abs(overlapY) > Math.abs(maxOverlap[1])) {
          maxOverlap[1] = overlapY;
        }
      }

      if (Math.abs(maxOverlap[0]) > Math.abs(maxOverlap[1])) {
        overlap[1] = maxOverlap[1];
      } else {
        overlap[0] = maxOverlap[0];
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
