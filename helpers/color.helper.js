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
};