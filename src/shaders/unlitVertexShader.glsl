uniform mat4 uModelMatrix;
uniform mat4 uVPMatrix;

attribute vec4 aVertPos;
attribute vec2 aTexCoords;

varying vec2 vTexCoords;

void main()
{
  mat4 MVP = uVPMatrix * uModelMatrix;
  gl_Position = MVP * vec4(aVertPos.xyz, 1);
  vTexCoords = aTexCoords;
}