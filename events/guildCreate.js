const { processGuildCreate } = require("../helpers/processes.helper.js");

module.exports = {
  name: "guildCreate",

  async execute (guild, client) {
    await processGuildCreate(guild, client);
  }
};