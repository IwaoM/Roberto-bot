const { shuffleArray } = require("./misc.helper.js");
const Vibrant = require("node-vibrant");

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

  checkHexCode (hexCode = "", strictMode = false) {
    // strict modes doesn't allow hex codes without "#" or with uppercase letters
    if (!hexCode) { return false; }

    if (hexCode.startsWith("#")) {
      hexCode = hexCode.slice(1);
    } else if (strictMode) {
      return false;
    }

    if (hexCode.length !== 3 && hexCode.length !== 6) { return false; }
    if (hexCode.length === 3) { hexCode = hexCode[0] + hexCode[0] + hexCode[1] + hexCode[1] + hexCode[2] + hexCode[2]; }

    if (!strictMode) {
      hexCode = hexCode.toLowerCase();
    }
    if (!/^([a-f0-9]{6,})$/.test(hexCode)) { return false; }

    return "#" + hexCode;
  },

  async getDominantColor (commandOption, dir) {
    if (!commandOption || !dir) { return false; }

    // getPalette sometimes fails - retry twice before returning an error
    let palette, errorCount = 0;
    for (let i = 0; i < 3; i++) {
      try {
        palette = await Vibrant.from(dir).getPalette();
        break;
      } catch (err) {
        console.log(`Palette fetch failed ${i + 1} time(s)`);
        errorCount++;
      }
    }
    if (errorCount === 3) {
      console.log(`Dominant color processing failed for commandOption = "${commandOption}", dir = "${dir}"`);
      return false;
    }

    const hexCode = palette[commandOption].hex;
    return hexCode;
  }

};