export default class SelectTool {
  onMouseDown (event) {
    if (event.icons && event.icons.length) {
      for (let i = 0; i < event.icons.length; ++i) {
        event.icons[i].onMouseDown(event);
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
}