import {
  vec4Sub,
  vec4Normalize
} from '../utils/vectorMath';

export default class Camera {
  position;
  target;
  upDir;
  nearDist;
  farDist;
  fov;
  aspect;

  constructor(
    position,
    target,
    upDir,
    nearDist,
    farDist,
    fov,
    aspect
  ) {
    this.position = position;
    this.target = target;
    this.upDir = upDir;
    this.nearDist = nearDist;
    this.farDist = farDist;
    this.fov = fov;
    this.aspect = aspect;
  }

  getForwardDir = () => {
    return vec4Normalize(vec4Sub(this.target, this.position));
  }
}