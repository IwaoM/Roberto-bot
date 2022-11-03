const { processGuildCreate } = require("../helpers/processes.helper.js");
const { logError, logAction, logEvent } = require("../helpers/logs.helper.js");

module.exports = {
  name: "guildCreate",

  async execute (guild, client) {
    try {
      await logEvent({ name: this.name, description: "Roberto has joined a guild", guild: guild });
      await processGuildCreate(guild, client);
      await logAction({ name: `${this.name} event handling`, guild: guild });
    } catch (err) {
      await logError({
        name: `${this.name} event handler error`,
        description: `Failed to handle the ${this.name} event`,
        function: { name: `${this.name}.execute`, arguments: [...arguments] },
        errorObject: err
      });
    }
  }
};