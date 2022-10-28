const { processPermissionUpdates } = require("../helpers/processes.helper");

module.exports = {
  name: "roleUpdate",

  async execute (oldRole, newRole, client) {
    await processPermissionUpdates(oldRole, newRole, client, "roleUpdate");
  }
};