import { PlaneModel } from '../utils/proceduralMeshes';
import { TranslationMatrix } from '../utils/vectorMath';
import DraggableIcon from '../gl/DraggableIcon';

export default class AddTool {
  placingIcon = null;
  mouseDown = false;
  vertData;
  indices;
  iconsPlaced = 0;

  constructor() {
    // it's a little weird to keep the mesh data here since it should probably be handled by the icon itself
    // but then each icon would have an instance of the same mesh data
    // this way they all use the same instance of mesh data
    const { vertData, indices } = PlaneModel(1, 1, [1, 1, 0]);
    this.vertData = vertData;
    this.indices = indices;
  }

  onMouseDown (event) {
    this.mouseDown = true;
    
    this.placingIcon = new DraggableIcon(
      this.iconsPlaced,
      this.vertData,
      this.indices,
      0,
      1,
      TranslationMatrix([...event.worldMousePos]),
      [[-0.5, 0.5], [-0.458, 0.458]],
      null,
      event.removeIcon
    );

    this.iconsPlaced++;

    event.addIcon(this.placingIcon);

    this.placingIcon.onMouseDown(event);
  }
  
  onMouseUp (event) {
    this.mouseDown = false;

    this.placingIcon && this.placingIcon.onMouseUp(event);
    this.placingIcon.clicked = false;

    this.placingIcon = null;
  }

  onMouseMove (event) {
    if (this.mouseDown && this.placingIcon) {
      this.placingIcon.onMouseMove(event);
    }
  }
}