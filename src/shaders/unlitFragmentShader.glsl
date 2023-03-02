precision highp float;

uniform sampler2D uTex2d; 
uniform vec4 uColorMultiply;

varying vec2 vTexCoords;

void main(void)
{
	gl_FragColor = texture2D(uTex2d, vTexCoords.st) * uColorMultiply;
}