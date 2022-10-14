const { removeGuildConfigEntry } = require("../helpers/misc.helper.js");

module.exports = {
  name: "guildDelete",

  async execute (guild) {
    // delete entry from guildConfigs.json
    const configRemoved = await removeGuildConfigEntry(guild.id);
    if (configRemoved) {
      console.log("Entry removed from guildConfigs.json");
    }
  }
};