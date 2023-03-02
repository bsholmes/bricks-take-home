import { PlaneModel } from '../utils/proceduralMeshes';
import { TranslationMatrix } from '../utils/vectorMath';
import DraggableIcon from '../gl/DraggableIcon';

export default class AddTool {
  placingIcon = null;
  mouseDown = false;
  iconsPlaced = 0;

  onMouseDown (event) {
    this.mouseDown = true;
    
    this.placingIcon = new DraggableIcon(
      this.iconsPlaced,
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