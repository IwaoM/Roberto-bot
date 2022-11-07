const { processGuildDelete } = require("../helpers/processes.helper.js");
const { logError, logAction, logEvent } = require("../helpers/logs.helper.js");

module.exports = {
  name: "guildDelete",

  async execute (guild) {
    try {
      logEvent({ name: this.name, description: "Roberto has left a guild", guild: guild });
      await processGuildDelete(guild);
      logAction({ name: `${this.name} event handling`, guild: guild });
    } catch (err) {
      logError({
        name: `${this.name} event handler error`,
        description: `Failed to handle the ${this.name} event`,
        function: { name: `${this.name}.execute`, arguments: [...arguments] },
        errorObject: err
      });
    }
  }
};