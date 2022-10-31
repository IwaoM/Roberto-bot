const { processGuildDelete } = require("../helpers/processes.helper.js");

module.exports = {
  name: "guildDelete",

  async execute (guild) {
    await processGuildDelete(guild);
  }
};