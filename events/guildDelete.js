const { removeGuildConfigEntry } = require("../helpers/misc.helper.js");

module.exports = {
  name: "guildDelete",

  async execute (guild) {
    console.log(`\nGuild ${guild.name} (ID ${guild.id}) left`);

    // delete entry from guildConfigs.json
    const configRemoved = await removeGuildConfigEntry(guild.id);
    if (configRemoved) {
      console.log(`* Entry [${guild.name} - ${guild.id}] removed from guildConfigs.json`);
    }
  }
};