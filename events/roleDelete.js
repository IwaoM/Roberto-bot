const { processPermissionUpdates } = require("../helpers/processes.helper");

module.exports = {
  name: "roleDelete",

  async execute (role, client) {
    await processPermissionUpdates(null, role, client, "roleDelete");
  }
};