const { removeGuildConfigEntry } = require("../helpers/files.helper.js");

module.exports = {
  name: "guildDelete",

  async execute (guild) {
    console.log(`\nGuild ${guild.name} (ID ${guild.id}) left`);

    // delete entry from guildConfigs.json
    try {
      await removeGuildConfigEntry(guild.id);
      console.log(`* Entry [${guild.name} - ${guild.id}] removed from guildConfigs.json`);
    } catch (err) {
      if (err.message === "Config entry not found") {
        console.log(`* Failed to remove entry [${guild.name} - ${guild.id}] from guildConfigs.json - entry not found`);
      } else {
        console.log(`* Failed to remove entry [${guild.name} - ${guild.id}] from guildConfigs.json - unknown error`);
      }
    }
  }
};