const { processPermissionUpdates } = require("../helpers/processes.helper");
const { logError, logAction, logEvent } = require("../helpers/logs.helper.js");

module.exports = {
  name: "guildMemberUpdate",

  async execute (oldMember, newMember, client) {
    try {
      await logEvent({ name: this.name, description: "A guild member was updated", guild: newMember.guild, member: newMember });

      // check if updated member is Roberto & if their role list was updated
      if (newMember.user.id === client.user.id && [...newMember.roles.cache.keys()].toString() !== [...oldMember.roles.cache.keys()].toString()) {
        await processPermissionUpdates(oldMember, newMember, client, "guildMemberUpdate");
      }

      await logAction({ name: `${this.name} event handling`, guild: newMember.guild, member: newMember });
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