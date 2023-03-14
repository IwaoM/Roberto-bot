const fs = require("node:fs");
const path = require("node:path");
const https = require("https");
const { logError, logAction } = require("../helpers/logs.helper.js");

module.exports = {
  async saveUserAvatar (member) {
    try {
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
    } catch (err) {
      logError({
        name: `avatar save error`,
        description: `Failed to save the user's avatar`,
        function: { name: "saveUserAvatar", arguments: [...arguments] },
        errorObject: err
      });
      throw err;
    }
  },

  unlinkFile (fileDir) {
    try {
      fs.unlinkSync(fileDir);
    } catch (err) {
      logError({
        name: `file unlink error`,
        description: `Failed to unlink the file`,
        function: { name: "unlinkFile", arguments: [...arguments] },
        errorObject: err
      });
      throw err;
    }
  },

  // Return the entire config list or a single entry if a guild id is provided
  getGuildConfigs (guildId = "") {
    try {
      const guildConfigsDir = path.join(path.dirname(__dirname), "guildConfigs.json");
      let data = fs.readFileSync(guildConfigsDir);
      const guildConfigs = JSON.parse(data);

      if (guildId) { // return the config for a single guild

        const guildConfig = guildConfigs.find(config => config.id === guildId);
        if (guildConfig) {
          return guildConfig;
        } else {
          throw new Error("Config entry not found");
        }

      } else { // return all configs

        return guildConfigs;

      }
    } catch (err) {
      logError({
        name: `guild config${guildId ? "" : "s"} read error`,
        description: `Failed to read the guild config${guildId ? "" : " list"}`,
        function: { name: "getGuildConfigs", arguments: [...arguments] },
        errorObject: err
      });
      throw err;
    }
  },

  // add the input object to the guild configs array if it does not already exist
  // returns the added entry or false if invalid argument
  addGuildConfigEntry (entry) {
    try {
      const guildConfigsDir = path.join(path.dirname(__dirname), "guildConfigs.json");
      let data = fs.readFileSync(guildConfigsDir);
      const guildConfigs = JSON.parse(data);

      let configIndex = guildConfigs.findIndex(conf => conf.id === entry.id);
      if (configIndex >= 0) {

        throw new Error("Config entry already exists");

      } else {

        guildConfigs.push(entry);
        data = JSON.stringify(guildConfigs, null, 2);
        fs.writeFileSync(guildConfigsDir, data);
        logAction({ name: "guild config creation", config: entry });
        return entry;

      }
    } catch (err) {
      logError({
        name: `guild config create error`,
        description: `Failed to create an entry in the guild configs list`,
        function: { name: "addGuildConfigEntry", arguments: [...arguments] },
        errorObject: err
      });
      throw err;
    }
  },

  // remove an entry in the guild configs array by guild id
  // returns the updated array or false if invalid argument
  removeGuildConfigEntry (id) {
    try {
      const guildConfigsDir = path.join(path.dirname(__dirname), "guildConfigs.json");
      let data = fs.readFileSync(guildConfigsDir);
      const guildConfigs = JSON.parse(data);

      let configIndex = guildConfigs.findIndex(config => config.id === id);
      if (configIndex >= 0) {

        const deletedConfig = guildConfigs.splice(configIndex, 1);
        data = JSON.stringify(guildConfigs, null, 2);
        fs.writeFileSync(guildConfigsDir, data);
        logAction({ name: "guild config deletion", config: deletedConfig[0] });
        return deletedConfig[0];

      } else {

        throw new Error("Config entry not found");

      }
    } catch (err) {
      logError({
        name: `guild config delete error`,
        description: `Failed to delete an entry from the guild configs list`,
        function: { name: "removeGuildConfigEntry", arguments: [...arguments] },
        errorObject: err
      });
      throw err;
    }
  },

  // update an entry by guild id, by setting the configItem key/value pair
  // the pair can set a new attribute for the entry or update an existing one
  // returns the updated entry or false if invalid argument
  updateGuildConfigEntry (id, configItem) {
    try {
      if (!configItem) {
        throw new Error("Invalid argument");
      }

      const guildConfigsDir = path.join(path.dirname(__dirname), "guildConfigs.json");
      let data = fs.readFileSync(guildConfigsDir);
      const guildConfigs = JSON.parse(data);

      let configIndex = guildConfigs.findIndex(config => config.id === id);
      if (configIndex >= 0) {

        let config = guildConfigs.find(config => config.id === id);
        config = { ...config, ...configItem };
        guildConfigs.splice(configIndex, 1, config);
        data = JSON.stringify(guildConfigs, null, 2);
        fs.writeFileSync(guildConfigsDir, data);
        logAction({ name: "guild config update", config: config });
        return config;

      } else {

        throw new Error("Config entry not found");

      }
    } catch (err) {
      logError({
        name: `guild config update error`,
        description: `Failed to update an entry in the guild configs list`,
        function: { name: "updateGuildConfigEntry", arguments: [...arguments] },
        errorObject: err
      });
      throw err;
    }
  }
};