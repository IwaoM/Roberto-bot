const { checkHexCode } = require("./color.helper.js");
const { getGuildConfigs, updateGuildConfigEntry, removeGuildConfigEntry, addGuildConfigEntry } = require("../helpers/files.helper.js");
const { checkOwnMissingPermissions, getPermissionUpdaterUser, dmUsers, createRobertoAdminRole, getInviterUser } = require("../helpers/discord.helper.js");
const { robertoNeededPermissions } = require("../config.json");

module.exports = {

  async updateColorRole (hexCode, userMember) {
    if (!hexCode || !userMember) { return false; }

    // #000000 disables name color, we don't want that
    if (hexCode === "#000000") {
      hexCode = "#000001";
    }

    // find any color roles already assigned to user
    const userMemberRoleList = userMember.roles.cache;
    const userMemberColorRoleList = userMemberRoleList.filter(role => checkHexCode(role.name, true));

    // for each found color role
    for (let role of userMemberColorRoleList.entries()) {
      if (role[1].members.size > 1) {
        // remove the color role from the user
        await userMember.roles.remove(role[1]);
      } else {
        // delete role if no one else used it
        try {
          await role[1].delete();
        } catch (err) {
          if (err.code === 50013) { // Missing permissions : Roberto role incorrectly placed in role list
            throw new Error("Missing permissions");
          } else {
            throw new Error("Unknown error");
          }
        }
      }
    }

    if (hexCode !== "none") {
      // check if a color role for hexCode exists
      const guildRoles = await userMember.guild.roles.fetch();
      let wantedColorRole = guildRoles.find(role => role.name === hexCode);

      if (!wantedColorRole) {
        // if not : create it
        wantedColorRole = await userMember.guild.roles.create({ name: hexCode, color: hexCode });
        await wantedColorRole.setPermissions([]);
        await wantedColorRole.setMentionable(true);
      }

      // assign the found or created color role to user
      userMember.roles.add(wantedColorRole);
      return wantedColorRole.id;
    }

    return hexCode;
  },

  async processPermissionUpdates (oldElem, newElem, client, eventType) {
    // oldElem & newElem can be either roles (for event roleUpdate) or members (for event guildMemberUpdate)

    // get guild config
    let guildConfig;
    try {
      guildConfig = await getGuildConfigs(newElem.guild.id);
    } catch (err) {
      if (err.message === "Config entry not found") {
        return;
      } else {
        throw err;
      }
    }

    const newBotMissingPermissions = (await checkOwnMissingPermissions(newElem.guild, robertoNeededPermissions)).sort();
    const oldBotMissingPermissions = guildConfig.missingPermissions.sort();
    const newlyBotMissingPermissions = newBotMissingPermissions.filter(perm => oldBotMissingPermissions.indexOf(perm) === -1);

    // if previously granted needed permissions were removed from Roberto && DM option is enabled
    if (newlyBotMissingPermissions.length && guildConfig.dmOnPermissionRemoved) {
      let dmText, dmRecipient;

      // check if Roberto has the required permissions
      const neededPermissionsForEvent = ["ViewAuditLog"];
      const missingPermissions = await checkOwnMissingPermissions(newElem.guild, neededPermissionsForEvent);
      if (missingPermissions.length) {

        // if the executor can't be fetched, get the server owner instead
        dmRecipient = (await newElem.guild.fetchOwner()).user;

      } else {

        // check audit logs to get the executor of that revocation
        dmRecipient = await getPermissionUpdaterUser(oldElem, newElem, eventType);

      }

      // construct DM text
      dmText = `Hello!
${missingPermissions.length ? "Someone" : "You"} recently `;

      if (eventType === "roleUpdate") {
        dmText += `updated the role **${newElem.name}** in the server **${newElem.guild.name}**, `;
      } else if (eventType === "guildMemberUpdate") {
        dmText += `updated my role list in the server **${newElem.guild.name}**, `;
      }

      dmText += `which removed the following permission${newlyBotMissingPermissions.length === 1 ? "" : "s"} from me: [${newlyBotMissingPermissions.join(", ")}].
I need th${newlyBotMissingPermissions.length === 1 ? "is permission" : "ese permissions"} to function properly (more details on why exactly here: https://github.com/IwaoM/Roberto-bot#readme). Please consider restoring ${newlyBotMissingPermissions.length === 1 ? "it" : "them"} :)
Thanks!

Note: this automatic DM can be disabled with the \`/config permission-dm\` command.`;

      // if DM text & recipient are not empty, send the text to the recipient
      if (dmText && dmRecipient) {
        try {
          await dmUsers(dmText, [dmRecipient]);
        } catch (err) {
          if (err.message !== "Cannot message this user") {
            console.log(`Failed to send a DM to user ${dmRecipient.username} - unknown error`);
          }
        }
      }

    }

    // in any case, if permissions were changed for Roberto, replace the missing permission value in the guild config
    if (client.guilds.cache.find(guild => guild.id === newElem.guild.id) && newBotMissingPermissions.toString() !== oldBotMissingPermissions.toString()) {
      try {
        await updateGuildConfigEntry(newElem.guild.id, { missingPermissions: newBotMissingPermissions });
      } catch (err) {
        if (err.message === "Invalid argument") {
          console.log(`Failed to update the guild's config - unknown config option.`);
        } else if (err.message === "Config entry not found") {
          console.log(`Failed to update the guild's config - guild config was not found.`);
        } else {
          throw err;
        }
      }
    }
  },

  async processGuildCreate (guild, client) {
    console.log(`\nGuild ${guild.name} (ID ${guild.id}) joined`);

    // check own permissions
    const missingPermissions = await checkOwnMissingPermissions(guild, robertoNeededPermissions);

    console.log(`* Missing permissions : [${missingPermissions.join(", ")}] (${missingPermissions.length})`);

    // check if managed role was created
    const ownManagedRole = (await guild.roles.fetch()).find(role => role.name === client.user.username && role.managed && role.tags?.botId === client.user.id);

    let robertoRoleIds;
    if (missingPermissions.indexOf("ManageRoles") === -1) {
      // create admin role
      robertoRoleIds = await createRobertoAdminRole(guild);
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
      dmOnPermissionRemoved: true,
      robertoAdminRoleId: robertoRoleIds?.robertoAdminRoleId || "none",
      missingPermissions: missingPermissions
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

    dmText += `\n• Elements of my behavior can be configured using \`/config\` - at the moment, available options are *auto-color*, *auto-greet* and *permission-dm*.
• Use \`/help\` in a server channel to see all available commands and their usage.
    
For more info about commands, bot permissions, recommended first steps and various other things, please visit my GitHub page: https://github.com/IwaoM/Roberto-bot#readme`;

    // DM the server owner & inviter
    const owner = (await guild.fetchOwner()).user;
    let inviter;
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
  },

  async processGuildDelete (guild) {
    console.log(`\nGuild ${guild.name} (ID ${guild.id}) left`);

    // delete entry from guildConfigs.json
    try {
      await removeGuildConfigEntry(guild.id);
      console.log(`* Entry [${guild.name} - ${guild.id}] removed from guildConfigs.json`);
    } catch (err) {
      if (err.message === "Config entry not found") {
        console.log(`* Failed to remove entry [${guild.name} - ${guild.id}] from guildConfigs.json - entry not found`);
      } else {
        console.log(`* Failed to remove entry [${guild.name} - ${guild.id}] from guildConfigs.json - unknown error`);
      }
    }
  }
};

