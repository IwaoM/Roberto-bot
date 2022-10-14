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

  // Return the entire config list or a single entry if a guild id is provided
  async getGuildConfigs (guildId = "") {
    const guildConfigsDir = path.join(path.dirname(__dirname), "guildConfigs.json");
    let data = await fs.promises.readFile(guildConfigsDir);
    const guildConfigs = JSON.parse(data);

    if (guildId) { // return the config for a single guild

      const guildConfig = guildConfigs.find(config => config.id === guildId);
      if (guildConfig) {
        return guildConfig;
      } else {
        return false;
      }

    } else { // return all configs

      return guildConfigs;

    }
  },

  // add the input object to the guild configs array if it does not already exist
  // returns the added entry or false if invalid argument
  async addGuildConfigEntry (config) {
    if (!config.id) {
      return false;
    }

    const guildConfigsDir = path.join(path.dirname(__dirname), "guildConfigs.json");
    let data = await fs.promises.readFile(guildConfigsDir);
    const guildConfigs = JSON.parse(data);

    let configIndex = guildConfigs.findIndex(conf => conf.id = config.id);
    if (configIndex >= 0) {

      return false;

    } else {

      guildConfigs.push(config);
      data = JSON.stringify(guildConfigs, null, 2);
      await fs.promises.writeFile(guildConfigsDir, data);
      return config;

    }
  },

  // remove an entry in the guild configs array by guild id
  // returns the updated array or false if invalid argument
  async removeGuildConfigEntry (id) {
    if (!id) {
      return false;
    }

    const guildConfigsDir = path.join(path.dirname(__dirname), "guildConfigs.json");
    let data = await fs.promises.readFile(guildConfigsDir);
    const guildConfigs = JSON.parse(data);

    let configIndex = guildConfigs.findIndex(config => config.id = id);
    if (configIndex >= 0) {

      guildConfigs.splice(configIndex, 1);
      data = JSON.stringify(guildConfigs, null, 2);
      await fs.promises.writeFile(guildConfigsDir, data);
      return guildConfigs;

    } else {

      return false;

    }
  },

  // update an entry by guild id, by setting the configItem key/value pair
  // the pair can set a new attribute for the entry or update an existing one
  // returns the updated entry or false if invalid argument
  async updateGuildConfigEntry (id, configItem) {
    if (!id || !configItem) {
      return false;
    }

    const guildConfigsDir = path.join(path.dirname(__dirname), "guildConfigs.json");
    let data = await fs.promises.readFile(guildConfigsDir);
    const guildConfigs = JSON.parse(data);

    let configIndex = guildConfigs.findIndex(config => config.id = id);
    if (configIndex >= 0) {

      let config = guildConfigs.find(config => config.id = id);
      config = { ...config, ...configItem };
      guildConfigs.splice(configIndex, 1, config);
      data = JSON.stringify(guildConfigs, null, 2);
      await fs.promises.writeFile(guildConfigsDir, data);
      return config;

    } else {

      return false;

    }
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

  async createRobertoRoles (guild) {
    const robertoAdminRole = await guild.roles.create({ name: "Roberto Admin" });
    await robertoAdminRole.setPermissions([]);
    await robertoAdminRole.setMentionable(true);

    const robertoOperatorRole = await guild.roles.create({ name: "Roberto Operator" });
    await robertoOperatorRole.setPermissions([]);
    await robertoOperatorRole.setMentionable(true);

    return {
      admin: robertoAdminRole.id,
      operator: robertoOperatorRole.id
    };
  },

  async getInviterUser (guild, client) {

    // get latest logs and look for Roberto's invite log entry
    let logs = await guild.fetchAuditLogs();
    let botInvites = logs.entries.filter(entry => entry.action === 28);
    let robertoInvite = botInvites.find(entry => entry.target?.id === client.user.id);

    // search through older logs until the wanted log is found or end of logs is reached
    let oldestLog;
    while (!robertoInvite && logs.entries.size === 50) {
      oldestLog = logs.entries.at(49);
      logs = await guild.fetchAuditLogs({ before: oldestLog });
      botInvites = logs.entries.filter(entry => entry.action === 28);
      robertoInvite = botInvites.find(entry => entry.target?.id === client.user.id);
    }

    // return the executor of Roberto's invite (ie the inviter) or false if not found
    if (robertoInvite) {
      return robertoInvite.executor;
    } else {
      return false;
    }

  },

  async dmUsers (text, users) {
    const recipientList = [];

    for (let user of users) {
      if (recipientList.findIndex(elem => elem.id === user.id) === -1) {
        recipientList.push(user);
      }
    }

    for (let recipient of recipientList) {
      const recipientDm = await recipient.createDM();
      recipientDm.send(text);
    }
  }
};