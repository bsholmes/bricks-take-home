import { TOOL_INDICES } from '../utils/constants';
export default class SelectTool {
  id = TOOL_INDICES.SelectTool;
  selectedIcon = null;
  onMouseDown (event) {
    if (event.icons && event.icons.length) {
      for (let i = 0; i < event.icons.length; ++i) {
        // set and unset selected icon so we can deselect when the tool changes
        if(event.icons[i].onMouseDown(event))
        {
          this.selectedIcon = event.icons[i];
        } else if (this.selectedIcon && this.selectedIcon.index === event.icons[i].index) {
          this.selectedIcon = null;
        }
      }
    }
  }

  onMouseUp (event) {
    if (event.icons && event.icons.length) {
      for (let i = 0; i < event.icons.length; ++i) {
        event.icons[i].onMouseUp(event);
      }
    }
  }

  onMouseMove (event) {
    if (event.icons && event.icons.length) {
      for (let i = 0; i < event.icons.length; ++i) {
        event.icons[i].onMouseMove(event);
      }
    }
  }

  onToolChange() {
    // deselect the placing icon
    if (this.selectedIcon) {
      this.selectedIcon.clicked = false;
      this.selectedIcon.dragging = false;
      this.selectedIcon = null;
    }
  }
}
