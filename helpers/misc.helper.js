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

  htmlToPlainText (htmlText) {
    return htmlText.replace(/<[^>]+>/g, "").replace(/\n/g, "");
  },

  trimAll (text, lang = "en") {
    // trim all unneeded spaces
    text = text.trim().replace(/\s+/g, " ");

    // remove spaces before punctuation depending on the language's conventions
    if (lang === "en") {
      text = text
        .replace(/\s+\./g, ".")
        .replace(/\s+,/g, ",")
        .replace(/\s+:/g, ":")
        .replace(/\s+;/g, ";")
        .replace(/\s+\?/g, "?")
        .replace(/\s+!/g, "!")
        .replace(/\s+…/g, "…")
        .replace(/\s+'/g, "'");
    } else if (lang === "fr") {
      text = text
        .replace(/\s+\./g, ".")
        .replace(/\s+,/g, ",")
        .replace(/\s+'/g, "'");
    }

    return text;
  },

  randomDice (sides, rolls) {
    const result = [];
    for (let i = 0; i < rolls; i++) {
      result.push(Math.ceil(Math.random() * sides));
    }
    return result;
  },

  randomDraw (total, draws) {
    const result = [];
    const pool = [];
    for (let i = 0; i < total; i++) {
      pool.push(i + 1);
    }
    for (let i = 0; i < draws; i++) {
      const drawIndex = Math.floor(Math.random() * pool.length);
      result.push(pool[drawIndex]);
      pool.splice(drawIndex, 1);
    }
    return result;
  }
};