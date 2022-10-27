const roleUpdate = require("./roleUpdate.js");

module.exports = {
  name: "roleDelete",

  async execute (role, client) {
    // same actions as role update
    await roleUpdate.execute(null, role, client);
  }
};