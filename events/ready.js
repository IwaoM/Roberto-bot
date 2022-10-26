const { getGuildConfigs } = require("../helpers/files.helper.js");
const guildCreate = require("./guildCreate.js");
const guildDelete = require("./guildDelete.js");

module.exports = {
  name: "ready",
  once: true,

  async execute (client) {
    console.log(`Initializing ${client.user.username}\n`);
    await this.checkJoinedGuilds(client);
    console.log(`\n${client.user.username} ready!\n`);
  },

  async checkJoinedGuilds (client) {
    console.log(`Joined guild(s) : ${client.guilds.cache.size}`);

    // Get the current list of guilds and display it
    let guildList = [...client.guilds.cache.entries()]
      .map(entry => entry[1])
      .sort((a, b) => a.name.localeCompare(b.name));

    for (let guild of guildList) {
      await guild.members.fetch();
      console.log(`* ${guild.name} (ID ${guild.id}) - ${guild.members.cache.size} members`);
    }

    let guildConfigs;
    try {
      guildConfigs = await getGuildConfigs();
    } catch (err) {
      console.log("Failed to retrieve the guild config list");
      return;
    }

    // Check for guilds joined while Roberto was offline & perform join actions for them
    let guildUpdateCount = 0;
    console.log("\nChecking for guilds joined while offline");
    for (let guild of guildList) {
      if (guildConfigs.findIndex(config => config.id === guild.id) === -1) {
        guildUpdateCount++;
        await guildCreate.execute(guild, client);
      }
    }
    if (guildUpdateCount) { console.log(""); }
    console.log(`${guildUpdateCount} guild(s) joined`);

    // Check for guilds left while Roberto was offline & perform leave actions for them
    guildUpdateCount = 0;
    console.log("\nChecking for guilds left while offline");
    for (let config of guildConfigs) {
      if (guildList.findIndex(guild => guild.id === config.id) === -1) {
        guildUpdateCount++;
        await guildDelete.execute(config);
      }
    }
    if (guildUpdateCount) { console.log(""); }
    console.log(`${guildUpdateCount} guild(s) left`);
  },
};