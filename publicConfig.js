const { Collection } = require("discord.js");

module.exports = {

  adminRoleName: "Roberto Admin",

  // collection of permission names
  // keys are internal names, values are displayed names
  neededPermissionNames: new Collection([
    ["ViewAuditLog", "View Audit Log"],
    ["ViewChannel", "View Channels"],
    ["ManageRoles", "Manage Roles"],
    ["ManageNicknames", "Manage Nicknames"],
    ["SendMessages", "Send Messages"]
  ]),

};