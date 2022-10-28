const { processPermissionUpdates } = require("../helpers/processes.helper");

module.exports = {
  name: "guildMemberUpdate",

  async execute (oldMember, newMember, client) {

    // check if updated member is Roberto & if their role list was updated
    if (newMember.user.id === client.user.id && [...newMember.roles.cache.keys()].toString() !== [...oldMember.roles.cache.keys()].toString()) {
      await processPermissionUpdates(oldMember, newMember, client, "guildMemberUpdate");
    }
  }
};