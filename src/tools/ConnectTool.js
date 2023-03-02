import Connection from '../gl/Connection';
import { vec4Magnitude, vec4Sub } from '../utils/vectorMath';

const DISTANCE_LIMIT = 0.5;

export default class ConnectTool {
  connectionsPlaced = 0;
  workingConnection = null;

  onMouseDown (event) {
    // add connection if we're close enough to an icon with an available side

    // get icon whose side is closest to our worldMousePos
    // get icons that are close enough, compare distance of sides between them
    const icons = event.icons;
    let closeIcons = [];
    let closestIcon = null;
    let closestSideDistance = Infinity;
    let closestSideIndex = -1;

    for (let i = 0; i < icons.length; ++i) {
      if (icons[i].isMouseWithinBounds(event.worldMousePos)) {
        closeIcons.push(icons[i]);
      }
    }

    for (let i = 0; i < closeIcons.length; ++i) {
      const sidePositions = closeIcons[i].getSideMidpoints();
      for (let j = 0; j < sidePositions.length; ++j) {
        // get distance to mouse
        const distance = vec4Magnitude(vec4Sub(event.worldMousePos, sidePositions[j]));
        if (
          closeIcons[i].sideConnections[j] === null &&
          distance < closestSideDistance &&
          distance <=DISTANCE_LIMIT
        ) {
          closestIcon = closeIcons[i];
          closestSideDistance = distance;
          closestSideIndex = j;
        }
      }
    }

    if (!closestIcon) {
      return;
    }

    this.workingConnection = new Connection(
      this.connectionsPlaced,
      closestIcon,
      closestSideIndex,
      null,
      -1,
      2
    );

    closestIcon.sideConnections[closestSideIndex] = this.workingConnection;

    event.addConnection(this.workingConnection);

    this.connectionsPlaced++;
  }

  onMouseUp (event) {
    // set end of connection if we're close enough to an icon with an available side

    // otherwise remove the connection we're drawing?
    // or should we end the connection on next mouse down?
  }

  onMouseMove (event) {
    // show connector triangle on nearest icon, nearest side if we're close to it
    // extents * 1.5?
  }
}
