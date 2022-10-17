module.exports = {

  shuffleArray (arr) {
    arr = [...arr];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  generatePhoenix () {
    // the idea here is to scramble center letters more than outer letters
    // 'p' and 'x' will be placed correctly most of the time, whereas 'o', 'e', 'n' will often be misplaced

    // inner letters
    let letters = ["o", "e", "n"];
    let indexToRemove;
    let scrambleAmount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < scrambleAmount; i++) {
      const indexToSwap = Math.floor(Math.random() * (letters.length - 1));
      [letters[indexToSwap], letters[indexToSwap + 1]] = [letters[indexToSwap + 1], letters[indexToSwap]];
    }

    if (!Math.floor(Math.random() * 3)) {
      indexToRemove = Math.floor(Math.random() * letters.length);
      letters.splice(indexToRemove, 1);
    }

    // center letters
    letters = ["h", ...letters, "i"];
    scrambleAmount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < scrambleAmount; i++) {
      const indexToSwap = Math.floor(Math.random() * (letters.length - 1));
      [letters[indexToSwap], letters[indexToSwap + 1]] = [letters[indexToSwap + 1], letters[indexToSwap]];
    }

    if (!Math.floor(Math.random() * 3)) {
      indexToRemove = Math.floor(Math.random() * letters.length);
      letters.splice(indexToRemove, 1);
    }

    // outer letters
    letters = ["p", ...letters, "x"];
    scrambleAmount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < scrambleAmount; i++) {
      const indexToSwap = Math.floor(Math.random() * (letters.length - 1));
      [letters[indexToSwap], letters[indexToSwap + 1]] = [letters[indexToSwap + 1], letters[indexToSwap]];
    }

    if (!Math.floor(Math.random() * 3)) {
      indexToRemove = Math.floor(Math.random() * (letters.length - 1)) + 1;
      letters.splice(indexToRemove, 1);
    }
    return letters.join("");
  },

  capitalizeFirstLetter (str) {
    return str[0].toUpperCase() + str.slice(1);
  },
};