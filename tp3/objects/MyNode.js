/**
 * @class MyNode
 * @constructor
 * @param {CGFscene} scene - Reference to XMLscene object
 * @param {String} id - Object identifier
 */
export class MyNode {
  constructor(scene, id) {
    this.scene = scene;
    this.id = id;

    // children ids
    this.primitives = [];
    this.components = [];

    // node attributes
    this.materials = []; // [id]
    this.texture = null; // { id, length_s, length_t, isDefined }
    this.transformation = null; // { matrix, isExplicit }
    // (If 'isExplicit' the matrix is a mat4 object, otherwise it is an id)
    this.animation = null; // id
    this.shader = null; // { shader, enabled }

    this.materialIndex = 0;
    this.visited = false;
  }

  /**
   * @method addComponent
   * Appends a new child component to the components array
   * @param {String} component - Component identifier
   */
  addComponent(component) {
    this.components.push(component);
  }

  /**
   * @method addPrimitive
   * Appends a new child primitive to the primitives array
   * @param {String} primitive - Primitive identifier
   */
  addPrimitive(primitive) {
    this.primitives.push(primitive);
  }

  /**
   * @method setMaterials
   * Updates the materials array
   * @param {Array} materials - Array of material ids
   */
  setMaterials(materials) {
    this.materials = materials;
  }

  /**
   * @method setTransformation
   * Updates the transformation attribute
   * @param {Object} transformation - Transformation matrix and explicit flag object
   */
  setTransformation(transformation) {
    this.transformation = transformation;
  }

  /**
   * @method setAnimation
   * Updates the animation attribute
   * @param {String} animation - Animation ID
   */
  setAnimation(animation) {
    this.animation = animation;
  }

  /**
   * @method setShader
   * Update the shader attribute
   * @param {CGFshader} object
   */
  setShader(object) {
    this.shader = { object, enabled: false };
  }

  /**
   * @method setTexture
   * Updates the texture attribute
   * @param {Object} texture - Object with texture id, length_s, lenght_t and isDefined values
   */
  setTexture(texture) {
    this.texture = texture;
  }

  /**
   * @method getMaterial
   * @return Current material id
   */
  getMaterial() {
    return this.materials[this.materialIndex];
  }

  /**
   * @method nextMaterialIndex
   * Updates the materialIndex attribute
   */
  nextMaterialIndex() {
    this.materialIndex = (this.materialIndex + 1) % this.materials.length;
  }
}
