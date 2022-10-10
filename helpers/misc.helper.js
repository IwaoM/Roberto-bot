const fs = require("node:fs");
const path = require("node:path");
const https = require("https");

async function saveImageToDisk (url, localPath) {
  const file = fs.createWriteStream(localPath);
  return new Promise((resolve) => {
    https.get(url, response => {
      response.pipe(file);
      resolve();
    });
  });
}

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
    console.log(imgUrl);

    const imgDir = path.join(imgFolder, member.user.id + ".jpg");
    await saveImageToDisk(imgUrl, imgDir);

    return imgDir;
  },

};