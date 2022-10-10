const { shuffleArray } = require("./misc.helper.js");

module.exports = {

  randomColor (vibrant = false) {
    let colorValue, hexColorValue;

    if (vibrant) {

      colorValue = Math.floor(Math.random() * 256);
      hexColorValue = colorValue.toString(16).padStart(2, "0");
      hexColorValue = "#" + shuffleArray(["00", "ff", hexColorValue]).join("");

    } else {

      colorValue = Math.floor(Math.random() * 256 * 256 * 256);
      hexColorValue = "#" + colorValue.toString(16).padStart(6, "0");

    }

    return hexColorValue;
  },

  checkHexCode (hexCode = "") {
    if (!hexCode) { return false; }

    if (hexCode.startsWith("#")) { hexCode.splice(0, 1); }

    if (hexCode.length !== 3 && hexCode.length !== 6) { return false; }
    if (hexCode.length === 3) { hexCode = hexCode[0] + hexCode[0] + hexCode[1] + hexCode[1] + hexCode[2] + hexCode[2]; }

    hexCode = hexCode.toLowerCase();
    if (!/^([a-f0-9]{6,})$/.test(hexCode)) { return false; }

    return "#" + hexCode;
  }

};