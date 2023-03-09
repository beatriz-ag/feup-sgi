import {
  CGFappearance,
  CGFcamera,
  CGFcameraOrtho,
  CGFshader,
  CGFtexture,
  CGFXMLreader,
} from "../lib/CGF.js";
import { MyRectangle } from "./objects/primitives/MyRectangle.js";
import { MyTriangle } from "./objects/primitives/MyTriangle.js";
import { MyCylinder } from "./objects/primitives/MyCylinder.js";
import { MySphere } from "./objects/primitives/MySphere.js";
import { MyTorus } from "./objects/primitives/MyTorus.js";
import { MyPatch } from "./objects/primitives/MyPatch.js";
import { MyNode } from "./objects/MyNode.js";
import { MyKeyframeAnimation } from "./objects/animations/MykeyFrameAnimation.js";
import { CGFOBJModel } from "./objects/obj/CGFOBJModel.js";

var DEGREE_TO_RAD = Math.PI / 180;
var DEFAULT_VERT_PATH = "./shaders/defaultVertShader.vert";
var DEFAULT_FRAG_PATH = "./shaders/defaultFragShader.frag";

// Order of the groups in the XML document.
var SCENE_INDEX = 0;
var VIEWS_INDEX = 1;
var AMBIENT_INDEX = 2;
var LIGHTS_INDEX = 3;
var TEXTURES_INDEX = 4;
var MATERIALS_INDEX = 5;
var TRANSFORMATIONS_INDEX = 6;
var ANIMATIONS_INDEX = 7;
var PRIMITIVES_INDEX = 8;
var COMPONENTS_INDEX = 9;

/**
 * @class MySceneGraph
 * @constructor
 * @param {String} filename - XML filename to be parsed
 * @param {CGFscene} scene - Reference to XMLscene object
 */
export class MySceneGraph {
  constructor(filename, scene) {
    this.loadedOk = null;

    // Establish bidirectional references between scene and graph.
    this.scene = scene;
    scene.graph = this;

    this.idRoot = null; // The id of the root element.

    this.views = {}; // CGFcamera or CGFcameraOrtho dictionary.
    this.lights = {};
    this.textures = {}; // CGFtexture dictionary.
    this.materials = {}; // CGFappearance dictionary.
    this.transformations = {}; // Mat4 transformation dictionary.
    this.animations = {}; // MyAnimation dictionary.
    this.primitives = {}; // CFGObject dictionary.
    this.components = {}; // MyNode dictionary.
    this.shaders = {}; // CFGShader dictionary.
    this.objs = [];

    this.scene.shaderComponents = []; // Component Ids array.

    this.axisCoords = [];
    this.axisCoords["x"] = [1, 0, 0];
    this.axisCoords["y"] = [0, 1, 0];
    this.axisCoords["z"] = [0, 0, 1];

    // File reading
    this.reader = new CGFXMLreader();

    /*
     * Read the contents of the xml file, and refer to this class for loading and error handlers.
     * After the file is read, the reader calls onXMLReady on this object.
     * If any error occurs, the reader calls onXMLError on this object, with an error message
     */
    this.reader.open("scenes/" + filename, this);
  }

  /**
   * @method onXMLReady
   * Callback to be executed after successful reading
   */
  onXMLReady() {
    this.log("XML Loading finished.");
    var rootElement = this.reader.xmlDoc.documentElement;

    // Here should go the calls for different functions to parse the various blocks
    var error = this.parseXMLFile(rootElement);

    if (error != null) {
      this.onXMLError(error);
      return;
    }

    // Remove graph cycles
    this.removeCycles(this.components[this.idRoot]);

    // Remove undefined child components
    this.validateGraphComponents(this.components[this.idRoot]);

    this.loadedOk = true;

    // As the graph loaded ok, signal the scene so that any additional initialization depending on the graph can take place
    if (this.objs.length == 0) this.scene.onGraphLoaded();
  }

  /**
   * @method loadedObj
   * Callback to be executed after OBJ loading
   * @param {Integer} idx - OBJ index
   * @param {Boolean} ok - If the OBJ was loaded successfully
   */
  loadedObj(idx, ok) {
    if (!ok) {
      this.onXMLError("Error loading obj file, with index: " + idx + ".");
      this.loadedOk = false;
    } else {
      this.objs[idx] = true;
    }

    if (this.objs.every((x) => x)) {
      this.scene.onGraphLoaded();
    }
  }

  /**
   * @method parseXMLFile
   * Parses the XML file, processing each block.
   * @param {XML root element} rootElement
   */
  parseXMLFile(rootElement) {
    if (rootElement.nodeName != "sxs") return "root tag <sxs> missing";

    var nodes = rootElement.children;

    // Reads the names of the nodes to an auxiliary buffer.
    var nodeNames = [];

    for (var i = 0; i < nodes.length; i++) {
      nodeNames.push(nodes[i].nodeName);
    }

    var error;

    // Processes each node, verifying errors.

    // <scene>
    var index;
    if ((index = nodeNames.indexOf("scene")) == -1)
      return "tag <scene> missing";
    if (index != SCENE_INDEX)
      this.onXMLMinorError("tag <scene> out of order " + index);

    //Parse scene block
    if ((error = this.parseScene(nodes[index])) != null) return error;

    // <views>
    if ((index = nodeNames.indexOf("views")) == -1)
      return "tag <views> missing";
    if (index != VIEWS_INDEX) this.onXMLMinorError("tag <views> out of order");

    //Parse views block
    if ((error = this.parseViews(nodes[index])) != null) return error;

    // <ambient>
    if ((index = nodeNames.indexOf("ambient")) == -1)
      return "tag <ambient> missing";
    if (index != AMBIENT_INDEX)
      this.onXMLMinorError("tag <ambient> out of order");

    //Parse ambient block
    if ((error = this.parseAmbient(nodes[index])) != null) return error;

    // <lights>
    if ((index = nodeNames.indexOf("lights")) == -1)
      return "tag <lights> missing";
    if (index != LIGHTS_INDEX)
      this.onXMLMinorError("tag <lights> out of order");

    //Parse lights block
    if ((error = this.parseLights(nodes[index])) != null) return error;

    // <textures>
    if ((index = nodeNames.indexOf("textures")) == -1)
      return "tag <textures> missing";

    if (index != TEXTURES_INDEX)
      this.onXMLMinorError("tag <textures> out of order");

    //Parse textures block
    if ((error = this.parseTextures(nodes[index])) != null) return error;

    // <materials>
    if ((index = nodeNames.indexOf("materials")) == -1)
      return "tag <materials> missing";
    if (index != MATERIALS_INDEX)
      this.onXMLMinorError("tag <materials> out of order");

    //Parse materials block
    if ((error = this.parseMaterials(nodes[index])) != null) return error;

    // <transformations>
    if ((index = nodeNames.indexOf("transformations")) == -1)
      return "tag <transformations> missing";
    if (index != TRANSFORMATIONS_INDEX)
      this.onXMLMinorError("tag <transformations> out of order");

    //Parse transformations block
    if ((error = this.parseTransformations(nodes[index])) != null) return error;

    // <animations>
    if ((index = nodeNames.indexOf("animations")) == -1)
      return "tag <animations> missing";
    if (index != ANIMATIONS_INDEX)
      this.onXMLMinorError("tag <animations> out of order");

    //Parse animations block
    if ((error = this.parseAnimations(nodes[index])) != null) return error;

    // <primitives>
    if ((index = nodeNames.indexOf("primitives")) == -1)
      return "tag <primitives> missing";
    if (index != PRIMITIVES_INDEX)
      this.onXMLMinorError("tag <primitives> out of order");

    //Parse primitives block
    if ((error = this.parsePrimitives(nodes[index])) != null) return error;

    // <components>
    if ((index = nodeNames.indexOf("components")) == -1)
      return "tag <components> missing";
    if (index != COMPONENTS_INDEX)
      this.onXMLMinorError("tag <components> out of order");

    //Parse components block
    if ((error = this.parseComponents(nodes[index])) != null) return error;

    this.log("All parsed");
  }

  /**
   * @method parseScene
   * Parses the <scene> block
   * @param {scene block element} sceneNode
   * @return null on success (no major errors), otherwise an error message
   */
  parseScene(sceneNode) {
    // Get root of the scene.
    var root = this.reader.getString(sceneNode, "root");
    if (root == null) return "no root defined for scene";

    this.idRoot = root;

    // Get axis length
    var axis_length = this.reader.getFloat(sceneNode, "axis_length");
    if (axis_length == null)
      this.onXMLMinorError(
        "no axis_length defined for scene; assuming 'length = 1'"
      );

    this.referenceLength = axis_length || 1;

    this.log("Parsed scene");
    return null;
  }

  /**
   * @method parseViews
   * Parses the <views> block
   * @param {views block element} viewsNode
   * @return null on success (no major errors), otherwise an error message
   */
  parseViews(viewsNode) {
    var defaultCamera = this.reader.getString(viewsNode, "default");
    if (defaultCamera == null) {
      this.onXMLMinorError("no default camera id defined for views");
      return null;
    }

    var children = viewsNode.children;
    var grandChildren;
    var child = null;
    var nodeNames;

    for (var i = 0; i < children.length; i++) {
      var id, near, far, angle, left, right, top, bottom;
      var from, to, up;

      child = children[i];
      grandChildren = child.children;

      nodeNames = [];
      for (var j = 0; j < child.children.length; j++) {
        nodeNames.push(grandChildren[j].nodeName);
      }

      id = this.reader.getString(child, "id");
      if (id == null) {
        this.onXMLMinorError("no ID defined for view");
        continue;
      }

      if (nodeNames.length == 0 || nodeNames.length > 3) {
        this.onXMLMinorError(
          "view must have 2 or 3 child nodes (conflict: ID = " + id + ")"
        );
        continue;
      }

      from = nodeNames.indexOf("from");
      to = nodeNames.indexOf("to");
      up = nodeNames.indexOf("up");

      if (from == -1) {
        this.onXMLMinorError(
          "node <from> must be defined in view (conflict: ID = " + id + ")"
        );
        continue;
      }
      if (to == -1) {
        this.onXMLMinorError(
          "node <to> must be defined in view (conflict: ID = " + id + ")"
        );
        continue;
      }

      from = this.parseCoordinates3D(
        grandChildren[from],
        "attribute 'from' in view (conflict: ID = " + id + ")"
      );
      if (!Array.isArray(from)) {
        this.onXMLMinorError(from);
        continue;
      }

      to = this.parseCoordinates3D(
        grandChildren[to],
        "attribute 'to' in view (conflict: ID = " + id + ")"
      );
      if (!Array.isArray(to)) {
        this.onXMLMinorError(to);
        continue;
      }

      near = this.reader.getFloat(child, "near");
      if (near == null) {
        this.onXMLMinorError(
          "no near attribute defined for view (conflict: ID = " + id + ")"
        );
        continue;
      }

      far = this.reader.getFloat(child, "far");
      if (far == null) {
        this.onXMLMinorError(
          "no far attribute defined for view (conflict: ID = " + id + ")"
        );
        continue;
      }

      if (child.nodeName == "perspective") {
        angle = this.reader.getFloat(child, "angle");
        if (angle == null) {
          this.onXMLMinorError(
            "no angle attribute defined for view (conflict: ID = " + id + ")"
          );
          continue;
        }

        if (up != -1) {
          this.onXMLMinorError(
            "up attribute wrongly defined for perspective view (conflict: ID = " +
              id +
              ")"
          );
          continue;
        }
        this.views[id] = new CGFcamera(
          angle * DEGREE_TO_RAD,
          near,
          far,
          from,
          to
        );
      } else if (child.nodeName == "ortho") {
        left = this.reader.getFloat(child, "left");
        if (left == null) {
          this.onXMLMinorError(
            "no left attribute for view (conflict: ID = " + id + ")"
          );
          continue;
        }

        right = this.reader.getFloat(child, "right");
        if (right == null) {
          this.onXMLMinorError(
            "no right attribute defined for view (conflict: ID = " + id + ")"
          );
          continue;
        }

        top = this.reader.getFloat(child, "top");
        if (top == null) {
          this.onXMLMinorError(
            "no top attribute defined for view (conflict: ID = " + id + ")"
          );
          continue;
        }

        bottom = this.reader.getFloat(child, "bottom");
        if (bottom == null) {
          this.onXMLMinorError(
            "no bottom attribute defined for view (conflict: ID = " + id + ")"
          );
          continue;
        }

        up =
          up == -1
            ? [0, 1, 0]
            : this.parseCoordinates3D(
                grandChildren[up],
                "attribute 'up' in view (conflict: ID = " + id + ")"
              );

        this.views[id] = new CGFcameraOrtho(
          left,
          right,
          bottom,
          top,
          near,
          far,
          from,
          to,
          up
        );
      } else {
        this.onXMLMinorError(
          "unknown camera type '" +
            child.nodeName +
            "' (conflict: ID = " +
            id +
            ")"
        );
        continue;
      }
    }

    if (Object.keys(this.views).length == 0)
      this.onXMLMinorError(
        "there must exist at least one view (ortho or perspective)"
      );
    else if (this.views[defaultCamera] == null)
      this.onXMLMinorError(
        "missing default camera in <views> (ID = " + defaultCamera + ")"
      );
    else {
      this.camera = defaultCamera;
    }

    this.log("Parsed views");
    return null;
  }

  /**
   * @method parseAmbient
   * Parses the <ambient> node
   * @param {ambient block element} ambientsNode
   * @return null on success (no major errors), otherwise an error message
   */
  parseAmbient(ambientsNode) {
    var children = ambientsNode.children;

    this.ambient = [];
    this.background = [];

    var nodeNames = [];

    for (var i = 0; i < children.length; i++)
      nodeNames.push(children[i].nodeName);

    var ambientIndex = nodeNames.indexOf("ambient");
    var backgroundIndex = nodeNames.indexOf("background");

    var color = this.parseColor(children[ambientIndex], "ambient");
    if (!Array.isArray(color)) return color;
    this.ambient = color;

    color = this.parseColor(children[backgroundIndex], "background");
    if (!Array.isArray(color)) return color;
    this.background = color;

    this.log("Parsed ambient");
    return null;
  }

  /**
   * @method parseLights
   * Parses the <light> node
   * @param {lights block element} lightsNode
   * @return null on success (no major errors), otherwise an error message
   */
  parseLights(lightsNode) {
    var children = lightsNode.children;

    var numLights = 0;

    var grandChildren = [];
    var nodeNames = [];

    // Any number of lights.
    for (var i = 0; i < children.length; i++) {
      // Storing light information
      var global = [];
      var attributeNames = [];
      var attributeTypes = [];

      //Check type of light
      if (children[i].nodeName != "omni" && children[i].nodeName != "spot") {
        this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
        continue;
      } else {
        attributeNames.push(
          ...["location", "ambient", "diffuse", "specular", "attenuation"]
        );
        attributeTypes.push(
          ...["position", "color", "color", "color", "attenuation"]
        );
      }

      // Get id of the current light.
      var lightId = this.reader.getString(children[i], "id");
      if (lightId == null) {
        this.onXMLError("no ID defined for light");
        continue;
      }

      // Checks for repeated IDs.
      if (this.lights[lightId] != null) {
        this.onXMLMinorError(
          "ID must be unique for each light (conflict: ID = " + lightId + ")"
        );
        continue;
      }

      // Light enable/disable
      var aux = this.reader.getBoolean(children[i], "enabled");
      if (!(aux != null && !isNaN(aux) && (aux == true || aux == false)))
        this.onXMLMinorError(
          "unable to parse value component of the 'enable light' field for ID = " +
            lightId +
            "; assuming 'value = 1'"
        );

      //Add enabled boolean and type name to light info
      global.push(aux);
      global.push(children[i].nodeName);

      grandChildren = children[i].children;
      // Specifications for the current light.

      nodeNames = [];
      for (var j = 0; j < grandChildren.length; j++) {
        nodeNames.push(grandChildren[j].nodeName);
      }

      for (var j = 0; j < attributeNames.length; j++) {
        var attributeIndex = nodeNames.indexOf(attributeNames[j]);
        var attributeType;

        if (attributeIndex != -1) {
          if ((attributeType = attributeTypes[j]) == "position")
            var aux = this.parseCoordinates4D(
              grandChildren[attributeIndex],
              "light position for ID" + lightId
            );
          else if (attributeType == "attenuation")
            var aux = this.parseAttenuation(
              grandChildren[attributeIndex],
              "light attenuation for ID" + lightId
            );
          else
            var aux = this.parseColor(
              grandChildren[attributeIndex],
              attributeNames[j] + " illumination for ID" + lightId
            );

          if (!Array.isArray(aux)) return aux;
          global.push(aux);
        } else
          return (
            "light " + attributeNames[j] + " undefined for ID = " + lightId
          );
      }

      // Gets the additional attributes of the spot light
      if (children[i].nodeName == "spot") {
        var angle = this.reader.getFloat(children[i], "angle");
        if (!(angle != null && !isNaN(angle)))
          return "unable to parse angle of the light for ID = " + lightId;

        var exponent = this.reader.getFloat(children[i], "exponent");
        if (!(exponent != null && !isNaN(exponent)))
          return "unable to parse exponent of the light for ID = " + lightId;

        var targetIndex = nodeNames.indexOf("target");

        // Retrieves the light target.
        var targetLight = [];
        if (targetIndex != -1) {
          var aux = this.parseCoordinates3D(
            grandChildren[targetIndex],
            "target light for ID " + lightId
          );
          if (!Array.isArray(aux)) return aux;

          targetLight = aux;
        } else return "light target undefined for ID = " + lightId;

        global.push(...[angle, exponent, targetLight]);
      }

      this.lights[lightId] = global;
      numLights++;
    }

    if (numLights == 0) return "at least one light must be defined";
    else if (numLights > 8)
      this.onXMLMinorError(
        "too many lights defined; WebGL imposes a limit of 8 lights"
      );

    this.log("Parsed lights");
    return null;
  }

  /**
   * @method parseTextures
   * Parses the <textures> block
   * @param {textures block element} texturesNode
   * @return null on success (no major errors), otherwise an error message
   */
  parseTextures(texturesNode) {
    var children = texturesNode.children;

    for (var i = 0; i < children.length; i++) {
      if (children[i].nodeName != "texture") {
        this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
        continue;
      }

      var textureID = this.reader.getString(children[i], "id");
      if (textureID == null) {
        this.onXMLError("no ID defined for texture");
        continue;
      }

      if (this.textures[textureID] != null) {
        this.onXMLMinorError(
          "ID must be unique for each texture (conflict: ID = " +
            textureID +
            ")"
        );
        continue;
      }

      // Parse texture
      var file = this.reader.getString(children[i], "file");

      if (
        !file.endsWith(".jpg") &&
        !file.endsWith(".png") &&
        !file.endsWith(".bmp")
      ) {
        this.onXMLMinorError(
          "File must be of type .jpg, .png or .bmp (conflict: ID = " +
            textureID +
            ")"
        );
        continue;
      }

      if (!this.fileExists(file)) {
        this.onXMLMinorError(
          "File " + file + " does no exist (conflict: ID = " + textureID + ")"
        );
        continue;
      }

      this.textures[textureID] = new CGFtexture(this.scene, file);
    }

    this.log("Parsed textures");
    return null;
  }

  /**
   * @method parseComponentTexture
   * Parses the <textures> block of a component
   * @param {textures block element} texturesNode
   * @param {String} componentID
   * @return null on error, otherwise texture object with id and respective (length_s, length_t) attributes
   */
  parseComponentTexture(node, componentID) {
    var textureID = this.reader.getString(node, "id");
    var length_s = this.reader.getFloat(node, "length_s", false);
    var length_t = this.reader.getFloat(node, "length_t", false);
    var isDefined = true;

    if (length_s == null || length_t == null) {
      length_s = length_t = 1.0;
      isDefined = false;
    }

    if (
      textureID != "inherit" &&
      textureID != "none" &&
      this.textures[textureID] == null
    ) {
      this.onXMLMinorError(
        "invalid texture tag definition (conflict: ID = " + componentID + ")"
      );
      return null;
    }

    return { id: textureID, length_s, length_t, isDefined };
  }

  /**
   * @method parseMaterials
   * Parses the <materials> node
   * @param {materials block element} materialsNode
   * @return null on success (no major errors), otherwise an error message
   */
  parseMaterials(materialsNode) {
    var children = materialsNode.children;
    var material;
    var appearence;

    // Any number of materials.
    for (var i = 0; i < children.length; i++) {
      if (children[i].nodeName != "material") {
        this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
        continue;
      }

      // Get id of the current material.
      var materialID = this.reader.getString(children[i], "id");
      if (materialID == null) {
        this.onXMLError("no ID defined for material");
        continue;
      }

      // Checks for repeated IDs.
      if (this.materials[materialID] != null) {
        this.onXMLMinorError(
          "ID must be unique for each material (conflict: ID = " +
            materialID +
            ")"
        );
        continue;
      }

      var materialShininess = this.reader.getFloat(children[i], "shininess");
      if (materialShininess == null) {
        this.onXMLMinorError(
          "no shininess attribute defined for material (conflict: ID = " +
            materialID +
            ")"
        );
        continue;
      }

      // Checks for material attributes' errors.
      if (
        (material = this.parseMaterial(children[i].children, materialID)) ==
        null
      )
        continue;

      appearence = new CGFappearance(this.scene);
      appearence.setAmbient(...material.ambient);
      appearence.setDiffuse(...material.diffuse);
      appearence.setSpecular(...material.specular);
      appearence.setEmission(...material.emission);
      appearence.setShininess(materialShininess);

      this.materials[materialID] = appearence;
    }

    this.log("Parsed materials");
    return null;
  }

  /**
   * @method parseMaterial
   * Parse a <material> block
   * @param {material block child elements} nodes
   * @param {String} materialID
   * @return null on error, otherwise material object with respective attribute values
   */
  parseMaterial(nodes, materialID) {
    var nodeNames = [];
    var material = {};
    var error = null;
    const attributeNames = ["ambient", "diffuse", "specular", "emission"];

    for (var i = 0; i < nodes.length; i++) {
      nodeNames.push(nodes[i].nodeName);
    }

    for (var i = 0; i < attributeNames.length; i++) {
      var attributeIndex = nodeNames.indexOf(attributeNames[i]);

      if (attributeIndex == -1) {
        error =
          "material " +
          attributeNames[i] +
          " component undefined for ID = " +
          materialID;
        break;
      }

      var color = this.parseColor(nodes[attributeIndex]);
      if (!Array.isArray(color)) {
        error = color;
        break;
      }

      material[attributeNames[i]] = color;
    }

    if (error != null) {
      this.onXMLMinorError(error);
      return null;
    }

    return material;
  }

  /**
   * @method parseComponentMaterials
   * Parses the <material> block of a component
   * @param {materials block element} nodes
   * @param {String} componentID
   * @return string on error, otherwise material ids array
   */
  parseComponentMaterials(nodes, componentID) {
    if (nodes.length === 0)
      return (
        "There must be one or more material tag (conflict: ID = " +
        componentID +
        ")"
      );

    var materials = [];
    var materialID;

    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].nodeName != "material") {
        this.onXMLMinorError(
          "unknown tag <" +
            nodes[i].nodeName +
            "> in component materials block (conflict: ID = " +
            componentID +
            ")"
        );
        continue;
      }

      materialID = this.reader.getString(nodes[i], "id");
      if (materialID == "inherit" || this.materials[materialID] != null)
        materials.push(materialID);
    }

    return materials.length == 0
      ? "Material blocks badly defined in component (conflict: ID = " +
          componentID +
          ")"
      : materials;
  }

  /**
   * @method parseTransformations
   * Parses the <transformations> block
   * @param {transformations block element} transformationsNode
   * @return null on success (no major errors), otherwise an error message
   */
  parseTransformations(transformationsNode) {
    var children = transformationsNode.children;

    var transfMatrix;
    var grandChildren = [];

    // Any number of transformations.
    for (var i = 0; i < children.length; i++) {
      if (children[i].nodeName != "transformation") {
        this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
        continue;
      }

      // Get id of the current transformation.
      var transformationID = this.reader.getString(children[i], "id");
      if (transformationID == null) {
        this.onXMLMinorError("no ID defined for transformation");
        continue;
      }

      // Checks for repeated IDs.
      if (this.transformations[transformationID] != null) {
        this.onXMLMinorError(
          "ID must be unique for each transformation (conflict: ID = " +
            transformationID +
            ")"
        );
        continue;
      }

      // Specifications for the current transformation.
      grandChildren = children[i].children;

      if (
        (transfMatrix = this.parseTransformation(
          grandChildren,
          transformationID
        )) == null
      )
        continue;

      this.transformations[transformationID] = transfMatrix;
    }

    this.log("Parsed transformations");
    return null;
  }

  /**
   * @method parseTransformation
   * Parses the <transformation> element
   * @param {transformation element} nodes
   * @param {String} transformationID
   * @return null on error, otherwise transformation matrix (mat4)
   */
  parseTransformation(nodes, transformationID) {
    var transfMatrix = mat4.create();
    var error = null;
    var values;

    for (var j = 0; j < nodes.length; j++) {
      if (nodes[j].nodeName == "translate") {
        values = this.parseCoordinates3D(
          nodes[j],
          "translate transformation for ID " + transformationID
        );
        if (!Array.isArray(values)) {
          error = values;
          break;
        }

        transfMatrix = mat4.translate(transfMatrix, transfMatrix, values);
      } else if (nodes[j].nodeName == "scale") {
        var values = this.parseCoordinates3D(
          nodes[j],
          "scale transformation for ID " + transformationID
        );
        if (!Array.isArray(values)) {
          error = values;
          break;
        }

        transfMatrix = mat4.scale(transfMatrix, transfMatrix, values);
      } else if (nodes[j].nodeName == "rotate") {
        var axis, angle;
        var values = this.parseRotationParameters(
          nodes[j],
          "rotate transformation for ID " + transformationID
        );
        if (!Array.isArray(values)) {
          error = values;
          break;
        }

        [axis, angle] = values;
        transfMatrix = mat4.rotate(transfMatrix, transfMatrix, angle, axis);
      } else
        error = "invalid tag name in transformation for ID " + transformationID;
    }

    if (error == null) return transfMatrix;

    this.onXMLMinorError(error);
    return null;
  }

  /**
   * @method parseComponentTransformations
   * Parses the <transformation> block of a component
   * @param {transformation block element} nodes
   * @param {String} transformationID
   * @return null on error, otherwise transformation object with matrix and explicit flag
   */
  parseComponentTransformations(nodes, componentID) {
    if (nodes.length == 1) {
      const nodeName = nodes[0].nodeName;
      if (nodeName == "transformationref") {
        const id = this.reader.getString(nodes[0], "id");
        return this.transformations[id] != null
          ? { isExplicit: false, matrix: id }
          : null;
      }
    }

    var matrix = this.parseTransformation(nodes, "of component " + componentID);

    return matrix != null ? { isExplicit: true, matrix } : null;
  }

  /**
   * @method parseAnimations
   * Parses the <animations> block
   * @param {animations block element} animationsNode
   * @return null on success (no major errors), otherwise an error message
   */
  parseAnimations(animationsNode) {
    var children = animationsNode.children;
    var grandChildren = [];
    var keyframeAnim;

    // Any number of animations.
    for (var i = 0; i < children.length; i++) {
      if (children[i].nodeName != "keyframeanim") {
        this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
        continue;
      }

      // Get id of the current animation.
      var animationID = this.reader.getString(children[i], "id");
      if (animationID == null) {
        this.onXMLMinorError("no ID defined for animation");
        continue;
      }

      // Checks for repeated IDs.
      if (this.animations[animationID] != null) {
        this.onXMLMinorError(
          "ID must be unique for each animation (conflict: ID = " +
            animationID +
            ")"
        );
        continue;
      }

      // Specifications for the current transformation.
      grandChildren = children[i].children;

      if (
        (keyframeAnim = this.parseKeyframeAnim(grandChildren, animationID)) ==
        null
      )
        continue;

      this.animations[animationID] = keyframeAnim;
    }

    this.log("Parsed animations");
    return null;
  }

  /**
   * @method parseKeyframeAnim
   * Parses the <keyframeanim> block element
   * @param {keyframeanim block element} nodes
   * @param {String} animationID
   * @return null on error, otherwise MyKeyframeAnimation object
   */
  parseKeyframeAnim(nodes, animationID) {
    var keyframeAnimation = new MyKeyframeAnimation(this.scene);
    var currentInstant = 0;
    var children = [];
    var keyframeInfo;

    for (var i = 0; i < nodes.length; i++) {
      const keyframe = nodes[i];

      if (keyframe.nodeName != "keyframe") {
        this.onXMLMinorError(
          "invalid tag name '" +
            keyframe.nodeName +
            "' in keyframeanim with ID " +
            animationID
        );
        continue;
      }

      var instant = this.reader.getFloat(keyframe, "instant");
      if (!(instant != null && !isNaN(instant) && instant > currentInstant)) {
        this.onXMLMinorError(
          "invalid instant attribute inside <keyframe> for ID = " + animationID
        );
        continue;
      }

      children = keyframe.children;

      if (children.length != 5) {
        this.onXMLMinorError(
          "wrong number of children in keyframe inside keyframeanim with ID " +
            animationID
        );
        continue;
      }

      if ((keyframeInfo = this.parseKeyframe(children, animationID)) == null)
        continue;

      keyframeAnimation.addKeyframe({
        instant: instant * 1000,
        transformation: keyframeInfo,
      });

      currentInstant = instant;
    }

    if (keyframeAnimation.keyframes.length == 0) {
      this.onXMLMinorError(
        "There must be at least one valid <keyframe> block inside keyframeanim (conflict: ID = " +
          animationID +
          ")"
      );
      return null;
    }

    keyframeAnimation.updateTimes();
    return keyframeAnimation;
  }

  /**
   * @method parseKeyframe
   * Parses the <keyframe> block element
   * @param {keyframe block element} nodes
   * @param {String} animationID
   * @return null on error, otherwise transformation object
   */
  parseKeyframe(nodes, animationID) {
    var attributeNames = [
      "translation",
      "rotation",
      "rotation",
      "rotation",
      "scale",
    ];

    var transfInfo = {
      translate: [],
      scale: [],
      rotate: vec3.create(),
    };
    var values;
    var axis, angle;
    var error = null;

    for (var i = 0; i < nodes.length; i++) {
      const transformation = nodes[i];
      var attributeIndex = attributeNames.indexOf(transformation.nodeName);

      if (attributeIndex == -1) {
        error =
          "unknown tag inside <keyframe> block (conflict: ID = " +
          animationID +
          ")";
        break;
      } else if (transformation.nodeName != attributeNames[i]) {
        error =
          "transformation out of order inside <keyframe> block (conflict: ID = " +
          animationID +
          ")";
        break;
      }

      if (transformation.nodeName == "translation") {
        values = this.parseCoordinates3D(
          transformation,
          "keyframe translation attribute for ID " + animationID
        );
        if (!Array.isArray(values)) {
          error = values;
          break;
        }

        transfInfo.translate = values;
      } else if (attributeNames[i] == "rotation") {
        values = this.parseRotationParameters(
          transformation,
          "keyframe rotation attribute for ID " + animationID
        );
        if (!Array.isArray(values)) {
          error = values;
          break;
        }
        [axis, angle] = values;

        if (axis[0]) {
          if (i != 3) {
            error =
              "X rotation axis misplaced inside <keyframe> block (conflict: ID = " +
              animationID +
              ")";
            break;
          }

          transfInfo.rotate[0] = angle;
        } else if (axis[1]) {
          if (i != 2) {
            error =
              "Y rotation axis misplaced inside <keyframe> block (conflict: ID = " +
              animationID +
              ")";
            break;
          }

          transfInfo.rotate[1] = angle;
        } else {
          if (i != 1) {
            error =
              "Z rotation axis misplaced inside <keyframe> block (conflict: ID = " +
              animationID +
              ")";
            break;
          }

          transfInfo.rotate[2] = angle;
        }
      } else {
        var values = this.parseScaleCoordinates(
          transformation,
          "keyframe scale transformation for ID " + animationID
        );
        if (!Array.isArray(values)) {
          error = values;
          break;
        }

        transfInfo.scale = values;
      }
    }

    if (error != null) {
      this.onXMLMinorError(error);
      return null;
    }

    return transfInfo;
  }

  /**
   * @method parsePrimitives
   * Parses the <primitives> block
   * @param {primitives block element} primitivesNode
   * @return null on success (no major errors), otherwise an error message
   */
  parsePrimitives(primitivesNode) {
    var children = primitivesNode.children;
    var grandChildren = [];

    // Any number of primitives.
    for (var i = 0; i < children.length; i++) {
      if (children[i].nodeName != "primitive") {
        this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
        continue;
      }

      // Get id of the current primitive.
      var primitiveId = this.reader.getString(children[i], "id");
      if (primitiveId == null) {
        this.onXMLMinorError("no ID defined for primitive");
        continue;
      }

      // Checks for repeated IDs.
      if (this.primitives[primitiveId] != null) {
        this.onXMLMinorError(
          "ID must be unique for each primitive (conflict: ID = " +
            primitiveId +
            ")"
        );
        continue;
      }

      grandChildren = children[i].children;

      // Validate the primitive type
      if (
        grandChildren.length != 1 ||
        (grandChildren[0].nodeName != "rectangle" &&
          grandChildren[0].nodeName != "triangle" &&
          grandChildren[0].nodeName != "cylinder" &&
          grandChildren[0].nodeName != "sphere" &&
          grandChildren[0].nodeName != "torus" &&
          grandChildren[0].nodeName != "patch" &&
          grandChildren[0].nodeName != "obj")
      ) {
        this.onXMLMinorError(
          "There must be exactly 1 primitive type (rectangle, triangle, cylinder, sphere, torus or obj)"
        );
        continue;
      }

      // Specifications for the current primitive.
      var primitiveType = grandChildren[0].nodeName;
      var error = null;

      // Retrieves the primitive coordinates.
      if (primitiveType == "rectangle") {
        error = this.parseRectangle(grandChildren[0], primitiveId);
      } else if (primitiveType == "triangle") {
        error = this.parseTriangle(grandChildren[0], primitiveId);
      } else if (primitiveType == "cylinder") {
        error = this.parseCylinder(grandChildren[0], primitiveId);
      } else if (primitiveType == "sphere") {
        error = this.parseSphere(grandChildren[0], primitiveId);
      } else if (primitiveType == "torus") {
        error = this.parseTorus(grandChildren[0], primitiveId);
      } else if (primitiveType == "patch") {
        error = this.parsePatch(grandChildren[0], primitiveId);
      } else if (primitiveType == "obj") {
        error = this.parseObj(grandChildren[0], primitiveId);
      } else {
        error = "non existing primitive '" + primitiveType + "'";
      }

      if (error != null) {
        this.onXMLMinorError(error);
        continue;
      }
    }

    this.log("Parsed primitives");
    return null;
  }

  /**
   * @method parseRectangle
   * Parses a <rectangle> element
   * @param {rectangle element} rectangle
   * @param {String} primitiveId
   * @return null on success, otherwise an error message
   */
  parseRectangle(rectangle, primitiveId) {
    // x1
    var x1 = this.reader.getFloat(rectangle, "x1");
    if (!(x1 != null && !isNaN(x1)))
      return (
        "unable to parse x1 of the primitive coordinates for ID = " +
        primitiveId
      );

    // y1
    var y1 = this.reader.getFloat(rectangle, "y1");
    if (!(y1 != null && !isNaN(y1)))
      return (
        "unable to parse y1 of the primitive coordinates for ID = " +
        primitiveId
      );

    // x2
    var x2 = this.reader.getFloat(rectangle, "x2");
    if (!(x2 != null && !isNaN(x2) && x2 > x1))
      return (
        "unable to parse x2 of the primitive coordinates for ID = " +
        primitiveId
      );

    // y2
    var y2 = this.reader.getFloat(rectangle, "y2");
    if (!(y2 != null && !isNaN(y2) && y2 > y1))
      return (
        "unable to parse y2 of the primitive coordinates for ID = " +
        primitiveId
      );

    this.primitives[primitiveId] = new MyRectangle(
      this.scene,
      primitiveId,
      [x1, x2],
      [y1, y2]
    );
    return null;
  }

  /**
   * @method parseTriangle
   * Parses a <triangle> element
   * @param {triangle element} triangle
   * @param {String} primitiveId
   * @return null on success, otherwise an error message
   */
  parseTriangle(triangle, primitiveId) {
    // x1, y1, z1
    var x1 = this.reader.getFloat(triangle, "x1");
    if (!(x1 != null && !isNaN(x1)))
      return (
        "unable to parse x1 of the primitive coordinates for ID = " +
        primitiveId
      );

    var y1 = this.reader.getFloat(triangle, "y1");
    if (!(y1 != null && !isNaN(y1)))
      return (
        "unable to parse y1 of the primitive coordinates for ID = " +
        primitiveId
      );

    var z1 = this.reader.getFloat(triangle, "z1");
    if (!(z1 != null && !isNaN(z1)))
      return (
        "unable to parse z1 of the primitive coordinates for ID = " +
        primitiveId
      );

    // x2, y2, z2
    var x2 = this.reader.getFloat(triangle, "x2");
    if (!(x2 != null && !isNaN(x2)))
      return (
        "unable to parse x2 of the primitive coordinates for ID = " +
        primitiveId
      );

    var y2 = this.reader.getFloat(triangle, "y2");
    if (!(y2 != null && !isNaN(y2)))
      return (
        "unable to parse y2 of the primitive coordinates for ID = " +
        primitiveId
      );

    var z2 = this.reader.getFloat(triangle, "z2");
    if (!(z2 != null && !isNaN(z2)))
      return (
        "unable to parse z2 of the primitive coordinates for ID = " +
        primitiveId
      );

    // x3, y3, z3
    var x3 = this.reader.getFloat(triangle, "x3");
    if (!(x3 != null && !isNaN(x3)))
      return (
        "unable to parse x3 of the primitive coordinates for ID = " +
        primitiveId
      );

    var y3 = this.reader.getFloat(triangle, "y3");
    if (!(y3 != null && !isNaN(y3)))
      return (
        "unable to parse y3 of the primitive coordinates for ID = " +
        primitiveId
      );

    var z3 = this.reader.getFloat(triangle, "z3");
    if (!(z3 != null && !isNaN(z3)))
      return (
        "unable to parse z3 of the primitive coordinates for ID = " +
        primitiveId
      );

    this.primitives[primitiveId] = new MyTriangle(
      this.scene,
      primitiveId,
      [x1, x2, x3],
      [y1, y2, y3],
      [z1, z2, z3]
    );
    return null;
  }

  /**
   * @method parseCylinder
   * Parses a <cylinder> element.
   * @param {cylinder element} cylinder
   * @param {String} primitiveId
   * @return null on success, otherwise an error message
   */
  parseCylinder(cylinder, primitiveId) {
    // base
    var base = this.reader.getFloat(cylinder, "base");
    if (!(base != null && !isNaN(base)))
      return (
        "unable to parse base of the primitive coordinates for ID = " +
        primitiveId
      );

    // top
    var top = this.reader.getFloat(cylinder, "top");
    if (!(top != null && !isNaN(top)))
      return (
        "unable to parse top of the primitive coordinates for ID = " +
        primitiveId
      );

    // height
    var height = this.reader.getFloat(cylinder, "height");
    if (!(height != null && !isNaN(height)))
      return (
        "unable to parse height of the primitive coordinates for ID = " +
        primitiveId
      );

    // slices
    var slices = this.reader.getInteger(cylinder, "slices");
    if (!(slices != null && !isNaN(slices)))
      return (
        "unable to parse slices of the primitive coordinates for ID = " +
        primitiveId
      );

    // stacks
    var stacks = this.reader.getInteger(cylinder, "stacks");
    if (!(stacks != null && !isNaN(stacks)))
      return (
        "unable to parse stacks of the primitive coordinates for ID = " +
        primitiveId
      );

    this.primitives[primitiveId] = new MyCylinder(
      this.scene,
      primitiveId,
      base,
      top,
      height,
      slices,
      stacks
    );
    return null;
  }

  /**
   * @method parseSphere
   * Parses a <sphere> element.
   * @param {sphere element} sphere
   * @param {String} primitiveId
   * @return null on success, otherwise an error message
   */
  parseSphere(sphere, primitiveId) {
    // radius
    var radius = this.reader.getFloat(sphere, "radius");
    if (!(radius != null && !isNaN(radius)))
      return (
        "unable to parse radius of the primitive coordinates for ID = " +
        primitiveId
      );

    // slices
    var slices = this.reader.getInteger(sphere, "slices");
    if (!(slices != null && !isNaN(slices)))
      return (
        "unable to parse slices of the primitive coordinates for ID = " +
        primitiveId
      );

    // stacks
    var stacks = this.reader.getInteger(sphere, "stacks");
    if (!(stacks != null && !isNaN(stacks)))
      return (
        "unable to parse stacks of the primitive coordinates for ID = " +
        primitiveId
      );

    this.primitives[primitiveId] = new MySphere(
      this.scene,
      primitiveId,
      radius,
      slices,
      stacks
    );
    return null;
  }

  /**
   * @method parseTorus
   * Parses a <torus> element.
   * @param {torus element} torus
   * @param {String} primitiveId
   * @return null on success, otherwise an error message
   */
  parseTorus(torus, primitiveId) {
    // inner
    var inner = this.reader.getFloat(torus, "inner");
    if (!(inner != null && !isNaN(inner)))
      return (
        "unable to parse inner of the primitive coordinates for ID = " +
        primitiveId
      );

    // outer
    var outer = this.reader.getFloat(torus, "outer");
    if (!(outer != null && !isNaN(outer)))
      return (
        "unable to parse outer of the primitive coordinates for ID = " +
        primitiveId
      );

    // slices
    var slices = this.reader.getInteger(torus, "slices");
    if (!(slices != null && !isNaN(slices)))
      return (
        "unable to parse slices of the primitive coordinates for ID = " +
        primitiveId
      );

    // loops
    var loops = this.reader.getInteger(torus, "loops");
    if (!(loops != null && !isNaN(loops)))
      return (
        "unable to parse loops of the primitive coordinates for ID = " +
        primitiveId
      );

    this.primitives[primitiveId] = new MyTorus(
      this.scene,
      primitiveId,
      inner,
      outer,
      slices,
      loops
    );
    return null;
  }

  /**
   * @method parsePatch
   * Parses a <patch> block element
   * @param {patch block element} patch
   * @param {String} primitiveId
   * @return null on success, otherwise an error message
   */
  parsePatch(patch, primitiveId) {
    // degreeU
    var degreeU = this.reader.getInteger(patch, "degree_u");
    if (!(degreeU != null && !isNaN(degreeU) && degreeU >= 1 && degreeU <= 3))
      return (
        "unable to parse degree_u of the primitive with ID = " + primitiveId
      );

    // degreeV
    var degreeV = this.reader.getInteger(patch, "degree_v");
    if (!(degreeV != null && !isNaN(degreeV) && degreeV >= 1 && degreeV <= 3))
      return (
        "unable to parse degree_v of the primitive with ID = " + primitiveId
      );

    // partsU
    var partsU = this.reader.getInteger(patch, "parts_u");
    if (!(partsU != null && !isNaN(partsU)))
      return (
        "unable to parse parts_u of the primitive with ID = " + primitiveId
      );

    // partsV
    var partsV = this.reader.getInteger(patch, "parts_v");
    if (!(partsV != null && !isNaN(partsV)))
      return (
        "unable to parse parts_v of the primitive with ID = " + primitiveId
      );

    // controlPoints
    var controlPointsAux = this.parseControlPoints(patch.children, primitiveId);

    if (!Array.isArray(controlPointsAux)) return controlPointsAux;

    if (controlPointsAux.length != (degreeU + 1) * (degreeV + 1))
      return (
        "invalid number of control points for 'patch' primitive with ID = " +
        primitiveId
      );

    var controlPoints = [];
    var orderU = degreeU + 1;
    var orderV = degreeV + 1;

    for (var u = 0; u < orderU * orderV; u += orderV) {
      var aux = [];
      for (var v = 0; v < orderV; v++) {
        aux.push(controlPointsAux[v + u]);
      }
      controlPoints.push(aux);
    }

    this.primitives[primitiveId] = new MyPatch(
      this.scene,
      primitiveId,
      degreeU,
      degreeV,
      partsU,
      partsV,
      controlPoints
    );
    return null;
  }

  /**
   * @method parseControlPoints
   * Parses the <controlpoint> block
   * @param {controlpoint block element} nodes
   * @param {String} primitiveId
   * @return array of control points
   */
  parseControlPoints(nodes, primitiveId) {
    var controlPoints = [];

    for (var i = 0; i < nodes.length; i++) {
      var aux = this.parseCoordinates3D(
        nodes[i],
        "control point for ID " + primitiveId
      );
      if (!Array.isArray(aux)) continue;

      aux.push(1);
      controlPoints.push(aux);
    }
    return controlPoints;
  }

  /**
   * @method parseObj
   * Parses a <obj> element.
   * @param {obj element} obj
   * @param {String} primitiveId
   * @return null on success, otherwise an error message
   */
  parseObj(obj, primitiveId) {
    // file
    var file = this.reader.getString(obj, "file");

    if (file == null)
      return "Unable to parse file of the primitive for ID = " + primitiveId;

    if (!file.endsWith(".obj"))
      return "File must be of type .obj (conflict: ID = " + primitiveId + ")";

    if (!this.fileExists(file))
      return (
        "File " + file + " does no exist (conflict: ID = " + primitiveId + ")"
      );

    this.objs.push(false);
    this.primitives[primitiveId] = new CGFOBJModel(
      this.scene,
      file,
      this.objs.length - 1
    );
    return null;
  }

  /**
   * @method parseComponents
   * Parses the <components> block
   * @param {components block element} componentsNode
   * @return null on success (no major errors), otherwise an error message
   */
  parseComponents(componentsNode) {
    var children = componentsNode.children;

    var grandChildren = [];
    var grandgrandChildren = [];
    var nodeNames = [];

    // Any number of components.
    for (var i = 0; i < children.length; i++) {
      if (children[i].nodeName != "component") {
        this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
        continue;
      }

      // Get id of the current component.
      var componentID = this.reader.getString(children[i], "id");
      if (componentID == null) {
        this.onXMLMinorError("no ID defined for componentID");
        continue;
      }

      // Checks for repeated IDs.
      if (this.components[componentID] != null) {
        this.onXMLMinorError(
          "ID must be unique for each component (conflict: ID = " +
            componentID +
            ")"
        );
        continue;
      }

      grandChildren = children[i].children;

      nodeNames = [];
      for (var j = 0; j < grandChildren.length; j++) {
        nodeNames.push(grandChildren[j].nodeName);
      }

      var transformationIndex = nodeNames.indexOf("transformation");
      var materialsIndex = nodeNames.indexOf("materials");
      var textureIndex = nodeNames.indexOf("texture");
      var animationIndex = nodeNames.indexOf("animation");
      var shaderIndex = nodeNames.indexOf("highlighted");
      var childrenIndex = nodeNames.indexOf("children");

      if (
        [transformationIndex, materialsIndex, textureIndex, childrenIndex].some(
          (i) => i == -1
        )
      ) {
        this.onXMLMinorError(
          "missing mandatory block in component (conflict: ID = " +
            componentID +
            ")"
        );
        continue;
      }

      const component = new MyNode(this.scene, componentID);

      // Transformations
      var transformation;
      grandgrandChildren = grandChildren[transformationIndex].children;

      if (grandgrandChildren.length !== 0) {
        if (
          (transformation = this.parseComponentTransformations(
            grandgrandChildren,
            componentID
          )) == null
        )
          continue;

        component.setTransformation(transformation);
      }

      // Animation
      if (animationIndex !== -1) {
        var animation = this.reader.getString(
          grandChildren[animationIndex],
          "id"
        );

        if (this.animations[animation] == null) {
          this.onXMLMinorError(
            "animation ID does not exist (conflict: ID = " + componentID + ")"
          );
          continue;
        }
        component.setAnimation(animation);
      }

      // Shaders
      if (shaderIndex !== -1) {
        var shaderObject;
        if (
          (shaderObject = this.parseShader(
            grandChildren[shaderIndex],
            "shader block in component (conflict: ID = " + componentID + ")"
          )) == null
        )
          continue;

        component.setShader(shaderObject);
      }

      // Materials
      var materials = this.parseComponentMaterials(
        grandChildren[materialsIndex].children,
        componentID
      );
      if (!Array.isArray(materials)) {
        this.onXMLMinorError(materials);
        continue;
      }
      component.setMaterials(materials);

      // Texture
      var texture;
      if (
        (texture = this.parseComponentTexture(
          grandChildren[textureIndex],
          componentID
        )) == null
      )
        continue;
      component.setTexture(texture);

      // Children
      grandgrandChildren = grandChildren[childrenIndex].children;

      if (grandgrandChildren.length == 0) {
        this.onXMLMinorError(
          "There must be one or more component tag (componentref or primitiveref) (conflict: ID = " +
            componentID +
            ")"
        );
        continue;
      }

      var child;
      for (var j = 0; j < grandgrandChildren.length; j++) {
        child = this.parseChild(grandgrandChildren[j], componentID);

        if (child.node == null) continue;

        child.isPrimitive
          ? component.addPrimitive(child.node)
          : component.addComponent(child.node);
      }

      if (this.components[this.idRoot] == null && componentID == this.idRoot) {
        if (component.texture.id == "inherit")
          return (
            "root component must not 'inherit' texture (conflict: ID = " +
            componentID +
            ")"
          );

        if (component.materials.some((x) => x == "inherit"))
          return (
            "root component must not 'inherit' material (conflict: ID = " +
            componentID +
            ")"
          );
      }

      this.components[componentID] = component;
    }

    this.log("Parsed components");
    return null;
  }

  /**
   * @method parseChild
   * Parses the <children> element
   * @param {children block child element} node
   * @param {String} componentID
   * @return child object with node id and type of node flag (primitive or component)
   */
  parseChild(node, componentID) {
    const nodeName = node.nodeName;
    const id = this.reader.getString(node, "id");

    var child = {
      node: null,
      isPrimitive: true,
    };

    if (nodeName == "componentref") {
      child.node = id;
      child.isPrimitive = false;
    } else if (nodeName == "primitiveref") {
      if (this.primitives[id] != null) child.node = id;
      else
        this.onXMLMinorError(
          "unknown primitive with id '" +
            id +
            "' (conflict: ID = " +
            componentID +
            ")"
        );
    } else {
      this.onXMLMinorError(
        "unknown tag <" + nodeName + "> (conflict: ID = " + componentID + ")"
      );
    }

    return child;
  }

  /**
   * @method parseShader
   * Parse the shader info from a node with ID = id
   * @param {block element} node
   * @param {message to be displayed in case of error} messageError
   * @returns CFGshader on success, otherwise null
   */
  parseShader(node, messageError) {
    var error = null;

    // R
    var r = this.reader.getFloat(node, "r");
    if (!(r != null && !isNaN(r) && r >= 0 && r <= 1))
      error = "unable to parse R component of the " + messageError;

    // G
    var g = this.reader.getFloat(node, "g");
    if (!(g != null && !isNaN(g) && g >= 0 && g <= 1))
      error = "unable to parse G component of the " + messageError;

    // B
    var b = this.reader.getFloat(node, "b");
    if (!(b != null && !isNaN(b) && b >= 0 && b <= 1))
      error = "unable to parse B component of the " + messageError;

    // Scale
    var scale_h = this.reader.getFloat(node, "scale_h");
    if (!(scale_h != null && !isNaN(scale_h)))
      error = "unable to parse scale_h component of the " + messageError;

    if (error != null) {
      this.onXMLMinorError(error);
      return null;
    }

    var shader = new CGFshader(
      this.scene.gl,
      DEFAULT_VERT_PATH,
      DEFAULT_FRAG_PATH
    );
    shader.setUniformsValues({
      scale: scale_h,
      timeFactor: 0,
      pulseColor: [r, g, b, 1.0],
      hasTexture: true,
    });

    return shader;
  }

  /**
   * @method parseCoordinates3D
   * Parse the coordinates from a node with ID = id
   * @param {block element} node
   * @param {message to be displayed in case of error} messageError
   * @return array on success, otherwise an error message
   */
  parseCoordinates3D(node, messageError) {
    var position = [];

    // x
    var x = this.reader.getFloat(node, "x");
    if (!(x != null && !isNaN(x)))
      return "unable to parse x-coordinate of the " + messageError;

    // y
    var y = this.reader.getFloat(node, "y");
    if (!(y != null && !isNaN(y)))
      return "unable to parse y-coordinate of the " + messageError;

    // z
    var z = this.reader.getFloat(node, "z");
    if (!(z != null && !isNaN(z)))
      return "unable to parse z-coordinate of the " + messageError;

    position.push(...[x, y, z]);

    return position;
  }

  /**
   * @method parseScaleCoordinates
   * Parse the scale coordinates from a node with ID = id
   * @param {block element} node
   * @param {message to be displayed in case of error} messageError
   * @return array on success, otherwise an error message
   */
  parseScaleCoordinates(node, messageError) {
    var position = [];

    // x
    var x = this.reader.getFloat(node, "sx");
    if (!(x != null && !isNaN(x)))
      return "unable to parse x-coordinate of the " + messageError;

    // y
    var y = this.reader.getFloat(node, "sy");
    if (!(y != null && !isNaN(y)))
      return "unable to parse y-coordinate of the " + messageError;

    // z
    var z = this.reader.getFloat(node, "sz");
    if (!(z != null && !isNaN(z)))
      return "unable to parse z-coordinate of the " + messageError;

    position.push(...[x, y, z]);

    return position;
  }

  /**
   * @method parseCoordinates4D
   * Parse the coordinates from a node with ID = id
   * @param {block element} node
   * @param {message to be displayed in case of error} messageError
   * @return array on success (no major errors), otherwise an error message
   */
  parseCoordinates4D(node, messageError) {
    var position = [];

    //Get x, y, z
    position = this.parseCoordinates3D(node, messageError);

    if (!Array.isArray(position)) return position;

    // w
    var w = this.reader.getFloat(node, "w");
    if (!(w != null && !isNaN(w)))
      return "unable to parse w-coordinate of the " + messageError;

    position.push(w);
    return position;
  }

  /**
   * @method parseRotationParameters
   * Parse the coordinates from a node with ID = id
   * @param {block element} node
   * @param {message to be displayed in case of error} messageError
   * @return array on success (no major errors), otherwise an error message
   */
  parseRotationParameters(node, messageError) {
    var parameters = [];

    // axis
    var axis = this.reader.getString(node, "axis");
    axis = this.axisCoords[axis];
    if (!(axis != null)) return "unable to parse axis of the " + messageError;

    // angle
    var angle = this.reader.getFloat(node, "angle");
    if (!(angle != null && !isNaN(angle)))
      return "unable to parse the angle of the " + messageError;

    parameters.push(...[axis, angle * DEGREE_TO_RAD]);
    return parameters;
  }

  /**
   * @method parseColor
   * Parse the color components from a node
   * @param {block element} node
   * @param {message to be displayed in case of error} messageError
   * @return array on success (no major errors), otherwise an error message
   */
  parseColor(node, messageError) {
    var color = [];

    // R
    var r = this.reader.getFloat(node, "r");
    if (!(r != null && !isNaN(r) && r >= 0 && r <= 1))
      return "unable to parse R component of the " + messageError;

    // G
    var g = this.reader.getFloat(node, "g");
    if (!(g != null && !isNaN(g) && g >= 0 && g <= 1))
      return "unable to parse G component of the " + messageError;

    // B
    var b = this.reader.getFloat(node, "b");
    if (!(b != null && !isNaN(b) && b >= 0 && b <= 1))
      return "unable to parse B component of the " + messageError;

    // A
    var a = this.reader.getFloat(node, "a");
    if (!(a != null && !isNaN(a) && a >= 0 && a <= 1))
      return "unable to parse A component of the " + messageError;

    color.push(...[r, g, b, a]);

    return color;
  }

  /**
   * @method parseAttenuation
   * Parse the attenuation components from a node
   * @param {block element} node
   * @param {message to be displayed in case of error} messageError
   * @return array on success (no major errors), otherwise an error message
   */
  parseAttenuation(node, messageError) {
    // constant
    var constant = this.reader.getFloat(node, "constant");
    if (
      !(constant != "null" && !isNaN(constant)) &&
      constant != 0 &&
      constant != 1.0
    )
      return "unable to parse constant component of the " + messageError;

    // linear
    var linear = this.reader.getFloat(node, "linear");
    if (!(linear != null && !isNaN(linear)))
      return "unable to parse linear component of the " + messageError;

    // quadratic
    var quadratic = this.reader.getFloat(node, "quadratic");
    if (!(quadratic != null && !isNaN(quadratic)))
      return "unable to parse quadratic component of the " + messageError;

    return [constant, linear, quadratic];
  }

  /**
   * @method validateGraphComponents
   * Verify if node components exists in graph and remove from respective node children arrays
   * @param {graph node} node
   */
  validateGraphComponents(node) {
    var index = node.components.length;
    var component;

    if (node.shader !== null && !node.visited) {
      node.visited = true;
      this.scene.shaderComponents.push(node.id);
    }

    while (index--) {
      if ((component = this.components[node.components[index]]) == null) {
        this.onXMLMinorError(
          "child component '" +
            node.components[index] +
            "' is not defined. (conflict: ID = " +
            node.id +
            ")"
        );
        node.components.splice(index, 1);
      } else this.validateGraphComponents(component);
    }
  }

  /**
   * @method removeCycles
   * Verify if graph is acyclic and remove respective 'back edges'
   * @param {graph node} node
   */
  removeCycles(node) {
    var component;
    var index = node.components.length;
    node.visited = true;

    while (index--) {
      if ((component = this.components[node.components[index]]) == null)
        continue;

      if (component.visited) {
        this.onXMLMinorError(
          "child component '" +
            component.id +
            "' creates a graph cycle (conflict: ID = " +
            node.id +
            ")"
        );
        node.components.splice(index, 1);
        continue;
      }

      this.removeCycles(component);
    }

    node.visited = false;
  }

  /**
   * @method fileExists
   * Verify if file exists
   * @param {String} file
   * @return boolean on file existence
   */
  fileExists(file) {
    var http = new XMLHttpRequest();
    http.open("HEAD", file, false);
    http.send();
    return http.status != 404;
  }

  /**
   * @method onXMLError
   * Callback to be executed on any read error, showing an error on the console
   * @param {String} message
   */
  onXMLError(message) {
    console.error("XML Loading Error: " + message);
    this.loadedOk = false;
  }

  /**
   * @method onXMLMinorError
   * Callback to be executed on any minor error, showing a warning on the console
   * @param {String} message
   */
  onXMLMinorError(message) {
    console.warn("Warning: " + message);
  }

  /**
   * @method log
   * Callback to be executed on any message
   * @param {String} message
   */
  log(message) {
    console.log("   " + message);
  }

  /**
   * @method displayScene
   * Displays the scene, processing each node, starting in the root node
   */
  displayScene() {
    //To test the parsing/creation of the primitives, call the display function directly
    var rootNode = this.components[this.idRoot];
    if (rootNode) this.processNode(rootNode, null, null);
  }

  /**
   * @method processNode
   * Applies transformations, textural/material changes, and displays primitives while processing child components of the given node
   * @param {graph node} node
   * @param {String} prevMaterial
   * @param {Array} prevTexture
   */
  processNode(node, prevMaterial, prevTexture) {
    this.scene.pushMatrix();

    // Apply transformations
    if (node.transformation !== null) {
      var matrix = node.transformation.isExplicit
        ? node.transformation.matrix
        : this.transformations[node.transformation.matrix];
      this.scene.multMatrix(matrix);
    }

    // Apply material and texture
    [prevMaterial, prevTexture] = this.applyMaterial(
      node,
      prevMaterial,
      prevTexture
    );

    var active = true;
    if (node.animation !== null) {
      const animation = this.animations[node.animation];
      animation.apply();
      active = animation.isActive();
    }

    if (active) {
      var activateShader = false;
      if (node.shader != null && node.shader.enabled) {
        if (prevTexture == null || prevTexture.id == "none") {
          node.shader.object.setUniformsValues({
            hasTexture: false,
            originalColor: this.materials[prevMaterial].diffuse,
          });
        }

        this.scene.setActiveShader(node.shader.object);
        activateShader = true;
      }

      for (var i = 0; i < node.primitives.length; i++) {
        var primitive = this.primitives[node.primitives[i]];
        primitive.updateTexCoords(prevTexture.length_s, prevTexture.length_t);
        primitive.display();
      }

      if (activateShader) this.scene.setActiveShader(this.scene.defaultShader);

      for (var i = 0; i < node.components.length; i++) {
        this.processNode(
          this.components[node.components[i]],
          prevMaterial,
          prevTexture
        );
      }
    }

    this.scene.popMatrix();
  }

  /**
   * @method applyMaterial
   * Applies textures and materials
   * @param {graph node} node
   * @param {String} prevMaterial
   * @param {Array} prevTexture
   * @return applied material and texture values
   */
  applyMaterial(node, prevMaterial, prevTexture) {
    if (node.texture === null) return;

    let materialId;
    let textureInfo = node.texture;

    if ((materialId = node.getMaterial()) == "inherit") {
      materialId = prevMaterial;
    }

    var material = this.materials[materialId];

    if (node.texture.id != "none") {
      if (node.texture.id == "inherit") {
        if (!node.texture.isDefined) {
          textureInfo.length_s = prevTexture.length_s;
          textureInfo.length_t = prevTexture.length_t;
        }
        textureInfo.id = prevTexture.id;
      }

      material.setTexture(this.textures[textureInfo.id]);
    }

    material.apply();

    // Reset material texture
    material.setTexture(null);
    return [materialId, textureInfo];
  }

  /**
   * @method updateMaterials
   * Changes material index of the given node and following children upon key handler
   * @param {graph node} node
   */
  updateMaterials(node) {
    node.nextMaterialIndex();
    node.components.forEach((child) =>
      this.updateMaterials(this.components[child])
    );
  }

  /**
   * @method updateCamera
   * Updates the current camera
   * @param {String} id
   * @return camera object with the respective id
   */
  updateCamera(id) {
    this.camera = id;
    return this.views[id];
  }

  /**
   * @method updateAnimations
   * Updates all scene animations
   * @param {integer} t - Time since last updateAnimations call
   */
  updateAnimations(t) {
    for (var animation in this.animations) {
      this.animations[animation].update(t);
    }
  }

  /**
   * @method updateShaderTimeFactor
   * Update time uniform value from enabled scene shaders
   * @param {integer} t - time value
   */
  updateShaderTimeFactor(t) {
    for (var component of this.scene.shaderComponents) {
      var shader = this.components[component].shader;
      if (shader.enabled) {
        shader.object.setUniformsValues({ timeFactor: (t / 100) % 100 });
      }
    }
  }
}
