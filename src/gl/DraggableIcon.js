import {
  TranslationMatrix,
  getTranslation,
  vec4Add
} from '../components/common/vectorMath';
import Icon from './Icon';
import { PlaneModel } from '../components/common/proceduralMeshes';

const DELETE_ICON_OFFSET = [0.42, 0.36, 0];

export default class DraggableIcon extends Icon {
  clicked = false;
  dragging = false;
  clickOffset = [0, 0, 0];
  deleteIcon = null;

  onDelete = (index) => {}

  constructor(
    index,
    geometry,
    indices,
    textureIndex,
    secondaryTextureIndex,
    transformMatrix,
    extents,
    onClick = () => {},
    onDelete = (index) => {}
  ) {
    super(
      index,
      geometry,
      indices,
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
      this.moveTo(vec4Add(event.worldMousePos, this.clickOffset));
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

  moveTo(position) {
    // collision detection with other nodes and the edge of the canvas
    // update connections
    this.transformMatrix = TranslationMatrix(position);
  }
}
