import Connection from '../gl/Connection';
import Icon from '../gl/Icon';
import { getArrowTransformMatrix } from '../utils/utils';
import {
  vec4Magnitude,
  vec4Sub
} from '../utils/vectorMath';

const DISTANCE_LIMIT = 0.5;
const ARROW_SCALE = [0.1, 0.1, 0.1, 0];

export default class ConnectTool {
  workingConnection = null;
  indicatorArrow = null;

  getClosestIconAndSide(icons, worldMousePos) {
    // get icon whose side is closest to our worldMousePos
    // get icons that are close enough, compare distance of sides between them
    let closeIcons = [];
    let closestIcon = null;
    let closestSideDistance = Infinity;
    let closestSideIndex = -1;

    for (let i = 0; i < icons.length; ++i) {
      if (icons[i].sideConnections && icons[i].isMouseWithinBounds(worldMousePos, 1.5)) {
        closeIcons.push(icons[i]);
      }
    }

    for (let i = 0; i < closeIcons.length; ++i) {
      const sidePositions = closeIcons[i].getSideMidpoints();
      for (let j = 0; j < sidePositions.length; ++j) {
        // get distance to mouse
        const distance = vec4Magnitude(vec4Sub(worldMousePos, sidePositions[j]));
        if (
          closeIcons[i].sideConnections[j] === null &&
          distance < closestSideDistance &&
          distance <= DISTANCE_LIMIT
        ) {
          closestIcon = closeIcons[i];
          closestSideDistance = distance;
          closestSideIndex = j;
        }
      }
    }

    return {
      closestIcon,
      closestSideIndex,
      closestSideDistance
    };
  }

  onMouseDown (event) {
    if (!this.workingConnection) {
      // add connection if we're close enough to an icon with an available side
      const {
        closestIcon,
        closestSideIndex
      } = this.getClosestIconAndSide(event.icons, event.worldMousePos);

      if (!closestIcon) {
        return;
      }

      this.workingConnection = new Connection(
        event.connectionsCreated,
        closestIcon,
        closestSideIndex,
        null,
        -1,
        2,
        event.removeConnection
      );

      closestIcon.sideConnections[closestSideIndex] = this.workingConnection;

      event.addConnection(this.workingConnection);
    } else {
      // get closest side
      // set end icon/side to working connection
      const {
        closestIcon,
        closestSideIndex
      } = this.getClosestIconAndSide(event.icons, event.worldMousePos);

      if (closestIcon && this.workingConnection.startIcon !== closestIcon) {
        this.workingConnection.endIcon = closestIcon;
        this.workingConnection.endSide = closestSideIndex;

        closestIcon.sideConnections[closestSideIndex] = this.workingConnection;

        this.workingConnection = null;
      } else {
        event.removeConnection(this.workingConnection.index);
        this.workingConnection = null;
      }
    }
  }

  onMouseUp (event) {
  }

  onMouseMove (event) {
    // show connector triangle on nearest icon, nearest side if we're close to it
    const {
      closestIcon,
      closestSideIndex
    } = this.getClosestIconAndSide(event.icons, event.worldMousePos);

    if (closestIcon && (!this.workingConnection || this.workingConnection.startIcon !== closestIcon)) {
      if (!this.indicatorArrow) {
        let transform = getArrowTransformMatrix(
          closestSideIndex,
          closestIcon.getSideMidpoints()[closestSideIndex],
          ARROW_SCALE
        ); 
        this.indicatorArrow = new Icon(
          event.iconsCreated,
          2,
          null,
          transform,
          [[-0.15, 0.15],[-0.15, 0.15]],
          [1, 1, 1, 0.6]
        );

        event.addIcon(this.indicatorArrow);
      } else {
        this.indicatorArrow.transformMatrix = getArrowTransformMatrix(
          closestSideIndex,
          closestIcon.getSideMidpoints()[closestSideIndex],
          ARROW_SCALE
        ); 
      }
    } else {
      if (this.indicatorArrow) {
        event.removeIcon(this.indicatorArrow.index);
        this.indicatorArrow = null;
      }
    }
  }

  onToolChange() {
    if (this.workingConnection) {
      this.workingConnection.onRemove(this.workingConnection.index);
      this.workingConnection = null;
    }
  }
}
