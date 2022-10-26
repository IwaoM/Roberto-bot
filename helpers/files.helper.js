const fs = require("node:fs");
const path = require("node:path");
const https = require("https");

module.exports = {
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
    if (!configItem) {
      throw new Error("Invalid argument");
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

      throw new Error("Config entry not found");

    }
  },
};