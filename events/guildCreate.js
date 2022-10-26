const { createRobertoRoles, getInviterUser, dmUsers, checkOwnMissingPermissions } = require("../helpers/discord.helper.js");
const { addGuildConfigEntry } = require("../helpers/files.helper.js");

module.exports = {
  name: "guildCreate",

  async execute (guild, client) {
    console.log(`\nGuild ${guild.name} (ID ${guild.id}) joined`);

    // check own permissions
    const neededPermissions = ["ViewAuditLog", "ViewChannel", "ManageRoles", "SendMessages", "ManageNicknames"];
    const missingPermissions = await checkOwnMissingPermissions(client, guild, neededPermissions);

    console.log(`* Missing permissions : [${missingPermissions.join(", ")}] (${missingPermissions.length})`);

    // check if managed role was created
    const ownManagedRole = (await guild.roles.fetch()).find(role => role.name === client.user.username && role.managed && role.tags?.botId === client.user.id);

    let robertoRoleIds;
    if (missingPermissions.indexOf("ManageRoles") === -1) {
      // create admin role
      robertoRoleIds = await createRobertoRoles(guild);
      console.log(`* Roberto admin [${robertoRoleIds.robertoAdminRoleId}] role created`);
    } else {
      console.log(`* Roberto admin role could not be created - missing permission ManageRoles`);
    }

    // create new entry in guildConfigs.json
    const newEntry = {
      id: guild.id,
      name: guild.name,
      greetNewMembers: false,
      colorNewMembers: true,
      robertoAdminRoleId: robertoRoleIds?.robertoAdminRoleId || "none"
    };

    try {
      await addGuildConfigEntry(newEntry);
      console.log(`* New entry [${guild.name} - ${guild.id}] added in guildConfigs.json`);
    } catch (err) {
      if (err.message === "Config entry already exists") {
        console.log(`* Failed to add entry [${guild.name} - ${guild.id}] in guildConfigs.json - entry with the same ID already exists`);
      } else {
        console.log(`* Failed to add entry [${guild.name} - ${guild.id}] in guildConfigs.json - unknown error`);
      }
    }

    // construct DM text
    let dmText = `Hello! Thanks for adding me to your server **${guild.name}**.\n`;

    if (ownManagedRole) {
      dmText += `\n• A default *Roberto* role (marked as "managed by an integration") should have been created in your server and applied to me. It is recommended to put it at the top of your server's role list (this is needed to run some commands).`;
    } else {
      dmText += `\n• A default *Roberto* role should have been created, but was not - likely because no new role was needed to grant me the permissions I was given when added to the server.`;
    }

    if (missingPermissions.length) {
      dmText += `\n    • **Please note that the following permission${missingPermissions.length === 1 ? " is" : "s are"} missing :** [${missingPermissions.join(", ")}]. I need ${missingPermissions.length === 1 ? "this permission" : "those permissions"} to function correctly! Please refer to the GitHub link for more details about why each requested permission is required.`;
    }

    if (missingPermissions.indexOf("ManageRoles") === -1) {
      dmText += `\n• A *Roberto Admin* role has been created${ownManagedRole ? " as well" : ""}. This role's position in the role list and permissions are irrelevant to its usage. Only members with this role will be able to run my \`/config\` commands.`;
    } else {
      dmText += `\n• A *Roberto Admin* role should have been created but couldn't, as I did not have the ManageRoles permission required to create roles. Please refer to the GitHub link for more details about why this role is needed and how to create it afterwards.`;
    }

    dmText += `\n• Elements of my behavior can be configured using \`/config\` - at the moment, available options are *auto-color* and *auto-greet*.
• Use \`/help\` in a server channel to see all available commands and their usage.
    
For more info about commands, bot permissions and other things, please visit my GitHub page: https://github.com/IwaoM/Roberto-bot#readme`;

    // DM the server owner & inviter
    const owner = (await guild.fetchOwner()).user;
    let inviter = null;
    if (missingPermissions.indexOf("ViewAuditLog") === -1) {
      inviter = await getInviterUser(guild, client);
    }
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