const { addGuildConfigEntry, dmUsers } = require("../helpers/misc.helper.js");

module.exports = {
  name: "guildCreate",

  async execute (guild, client) {
    console.log(`Guild ${guild.name} (ID ${guild.id}) joined`);

    // create roles
    // const robertoRoleIds = await this.createRobertoRoles(guild);
    const robertoRoleIds = { admin: "", operator: "" }; // used for tests
    console.log("Roberto admin and operator roles created");

    // create new entry in guildConfigs.json
    const inviter = await this.getInviterUser(guild, client);
    const newEntry = {
      id: guild.id,
      name: guild.name,
      greetNewMembers: false,
      colorNewMembers: true,
      robertoAdminRoleId: robertoRoleIds.admin,
      robertoOperatorRoleId: robertoRoleIds.operator,
      inviterId: inviter.id
    };

    const configAdded = await addGuildConfigEntry(newEntry);
    if (configAdded) {
      console.log("New entry added in guildConfigs.json");
    }

    // DM the server owner & inviter
    const dmText = `Hello there my name is Roberto
- A default Roberto role has been created, it should be put at the top of the role list
- Roberto Admin and Operator roles have been created, they are required to run some commands
- My behavior can be configured`;

    const owner = await guild.fetchOwner();
    await dmUsers(dmText, [inviter, owner]);
    console.log("DM sent to inviter and owner");
  },

  async createRobertoRoles (guild) {
    const robertoAdminRole = await guild.roles.create({ name: "Roberto Admin" });
    await robertoAdminRole.setPermissions([]);
    await robertoAdminRole.setMentionable(true);

    const robertoOperatorRole = await guild.roles.create({ name: "Roberto Operator" });
    await robertoOperatorRole.setPermissions([]);
    await robertoOperatorRole.setMentionable(true);

    return {
      admin: robertoAdminRole.id,
      operator: robertoOperatorRole.id
    };
  },

  async getInviterUser (guild, client) {
    let logs = await guild.fetchAuditLogs();
    logs = logs.entries.filter(entry => entry.action === 28);
    const user = logs.find(entry => entry.target?.id === client.user.id)?.executor;
    return user;
  },
};