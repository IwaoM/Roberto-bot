const fs = require("node:fs");
const path = require("node:path");
const https = require("https");

module.exports = {

  shuffleArray (arr) {
    arr = [...arr];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },


  async saveUserAvatar (member) {
    const imgFolder = path.join(path.dirname(__dirname), "avatars");

    let imgUrl = member.user.displayAvatarURL().replace(".webp", ".jpg");

    const imgDir = path.join(imgFolder, member.user.id + ".jpg");
    const file = fs.createWriteStream(imgDir);

    await new Promise((resolve) => {
      https.get(imgUrl, response => {
        response.pipe(file);
        resolve();
      });
    });

    return imgDir;
  },

};