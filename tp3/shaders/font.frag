#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 displayColor;
uniform bool keepColor;

void main() {
	vec4 color = texture2D(uSampler, vTextureCoord);

	if (color.a < 0.5)
		discard;
	
	if (keepColor) gl_FragColor = color;
	else gl_FragColor = displayColor;

}


