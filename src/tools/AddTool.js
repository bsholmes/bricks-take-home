import { TranslationMatrix } from '../utils/vectorMath';
import DraggableIcon from '../gl/DraggableIcon';

export default class AddTool {
  placingIcon = null;
  mouseDown = false;

  onMouseDown (event) {
    this.mouseDown = true;
    
    this.placingIcon = new DraggableIcon(
      event.iconsCreated,
      0,
      1,
      TranslationMatrix([...event.worldMousePos]),
      [[-0.5, 0.5], [-0.458, 0.458]],
      null,
      event.removeIcon,
      event.removeConnection
    );

    event.addIcon(this.placingIcon);

    this.placingIcon.onMouseDown(event);

    // do collision detection against the existing icons so we don't overlap
    this.placingIcon.onMouseMove(event);
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

  onToolChange() {
    // deselect the placing icon
    if (this.placingIcon) {
      this.placingIcon.clicked = false;
      this.placingIcon = null;
    }
  }
}