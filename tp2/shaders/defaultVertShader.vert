attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

uniform float timeFactor;
uniform float scale;

varying vec2 vTextureCoord;
varying vec3 offset;

void main() {
    offset = aVertexNormal * scale * (sin(timeFactor) + 1.0) / 2.0;

    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition + offset, 1.0);

    vTextureCoord = aTextureCoord;
}