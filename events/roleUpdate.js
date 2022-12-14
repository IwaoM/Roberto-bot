const { processPermissionUpdates } = require("../helpers/processes.helper");
const { logError, logAction, logEvent } = require("../helpers/logs.helper.js");

module.exports = {
  name: "roleUpdate",

  async execute (oldRole, newRole, client) {
    try {
      logEvent({ name: this.name, description: "A guild role was updated", guild: newRole.guild, role: newRole });
      await processPermissionUpdates(oldRole, newRole, client, "roleUpdate");
      logAction({ name: `${this.name} event handling`, guild: newRole.guild, role: newRole });
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