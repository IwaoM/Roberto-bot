const { createRobertoRoles, getInviterUser, dmUsers } = require("../helpers/discord.helper.js");
const { addGuildConfigEntry } = require("../helpers/files.helper.js");

module.exports = {
  name: "guildCreate",

  async execute (guild, client) {
    console.log(`\nGuild ${guild.name} (ID ${guild.id}) joined`);

    // create roles
    const robertoRoleIds = await createRobertoRoles(guild);
    // const robertoRoleIds = { admin: "" }; // used for tests
    console.log(`* Roberto admin [${robertoRoleIds.robertoAdminRoleId}] role created`);

    // create new entry in guildConfigs.json
    const newEntry = {
      id: guild.id,
      name: guild.name,
      greetNewMembers: false,
      colorNewMembers: true,
      robertoAdminRoleId: robertoRoleIds.robertoAdminRoleId
    };

    const configAdded = await addGuildConfigEntry(newEntry);
    if (configAdded) {
      console.log(`* New entry [${guild.name} - ${guild.id}] added in guildConfigs.json`);
    }

    // DM the server owner & inviter
    const dmText = `Hello there my name is Roberto
- A default Roberto role has been created, it should be put at the top of the role list
- Roberto Admin role has been created, it is required to run some commands
- My behavior can be configured`;

    const owner = (await guild.fetchOwner()).user;
    const inviter = await getInviterUser(guild, client);
    if (inviter) {
      await dmUsers(dmText, [inviter, owner]);
      if (inviter.id === owner.id) {
        console.log(`* DM sent to inviter and owner [${inviter.tag} - ${inviter.id}]`);
      } else {
        console.log(`* DM sent to inviter [${inviter.tag} - ${inviter.id}] and owner [${owner.tag} - ${owner.id}]`);
      }
    } else {
      await dmUsers(dmText, [owner]);
      console.log(`* DM sent to owner [${owner.tag} - ${owner.id}] - inviter not found`);
    }
  }
};