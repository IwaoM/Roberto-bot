const { checkHexCode } = require("./color.helper.js");
const { getGuildConfigs, updateGuildConfigEntry, removeGuildConfigEntry, addGuildConfigEntry } = require("../helpers/files.helper.js");
const { checkOwnMissingPermissions, getPermissionUpdaterUser, dmUsers, createRobertoAdminRole, getInviterUser } = require("../helpers/discord.helper.js");
const { robertoNeededPermissions } = require("../config.json");
const { logAction, logError } = require("../helpers/logs.helper.js");

module.exports = {

  async updateColorRole (hexCode, userMember) {
    try {
      if (!hexCode || !userMember) {
        return false;
      }

      // #000000 disables name color, we don't want that
      if (hexCode === "#000000") {
        hexCode = "#000001";
      }

      // find any color roles already assigned to user
      const userMemberRoleList = userMember.roles.cache;
      const userMemberColorRoleList = userMemberRoleList.filter(role => checkHexCode(role.name, true));

      // for each found color role
      for (let role of userMemberColorRoleList.entries()) {
        // remove the color role from the user
        if (role[1].members.size === 1) {
          // delete role altogether if no one else has it
          await role[1].delete();
          logAction({ name: "member role removal", guild: userMember.guild, member: userMember, role: role[1] });
          logAction({ name: "role deletion", guild: userMember.guild, role: role[1] });
        } else {
          await userMember.roles.remove(role[1]);
          logAction({ name: "member role removal", guild: userMember.guild, member: userMember, role: role[1] });
        }
      }

      if (hexCode !== "none") {
        // check if a color role for hexCode exists
        const guildRoles = await userMember.guild.roles.fetch();
        let wantedColorRole = guildRoles.find(role => role.name === hexCode);

        if (!wantedColorRole) {
          // if not : create it
          wantedColorRole = await userMember.guild.roles.create({ name: hexCode, color: hexCode });
          logAction({ name: "role creation", guild: userMember.guild, role: wantedColorRole });
          wantedColorRole = await wantedColorRole.setPermissions([]);
          wantedColorRole = await wantedColorRole.setMentionable(true);
        }

        // assign the found or created color role to user
        userMember.roles.add(wantedColorRole);
        logAction({ name: "member role addition", guild: userMember.guild, member: userMember, role: wantedColorRole });
        return wantedColorRole;
      }

      return hexCode;
    } catch (err) {
      logError({
        name: `role update error`,
        description: `Failed to update the user's color role`,
        function: { name: "updateColorRole", arguments: [...arguments] },
        errorObject: err
      });
      if (err.code === 50013) { // Missing permissions : Roberto role incorrectly placed in role list
        throw new Error("Role too low");
      } else {
        throw err;
      }
    }
  },

  async processPermissionUpdates (oldElem, newElem, client, eventType) {

    try {
      // oldElem & newElem can be either roles (for event roleUpdate) or members (for event guildMemberUpdate)

      // get guild config
      const guildConfig = await getGuildConfigs(newElem.guild.id);

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
            // continue even if the DM couldn't be sent
          }
        }
      }

      // in any case, if permissions were changed for Roberto, replace the missing permission value in the guild config
      if (client.guilds.cache.find(guild => guild.id === newElem.guild.id) && newBotMissingPermissions.toString() !== oldBotMissingPermissions.toString()) {
        await updateGuildConfigEntry(newElem.guild.id, { missingPermissions: newBotMissingPermissions });
      }
    } catch (err) {
      logError({
        name: `permissions update processing error`,
        description: `Failed to process Roberto's permissions update`,
        function: { name: "processPermissionUpdates", arguments: [...arguments] },
        errorObject: err
      });
      throw err;
    }
  },

  async processGuildCreate (guild, client) {
    try {
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
        logError({
          name: `missing permissions for Roberto roles creation`,
          description: `Roberto admin role could not be created - missing permission ManageRoles`,
          function: { name: "processGuildCreate", arguments: [...arguments] },
          errorObject: new Error("Missing permissions")
        });
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

      await addGuildConfigEntry(newEntry);
      console.log(`* New entry [${guild.name} - ${guild.id}] added in guildConfigs.json`);

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
      await dmUsers(dmText, [inviter, owner]);
    } catch (err) {
      logError({
        name: `guild join processing error`,
        description: `Failed to process a guild join`,
        function: { name: "processGuildCreate", arguments: [...arguments] },
        errorObject: err
      });
      throw err;
    }
  },

  async processGuildDelete (guild) {
    try {
      console.log(`\nGuild ${guild.name} (ID ${guild.id}) left`);

      // delete entry from guildConfigs.json
      await removeGuildConfigEntry(guild.id);
    } catch (err) {
      logError({
        name: `guild leave processing error`,
        description: `Failed to process a guild leave`,
        function: { name: "processGuildDelete", arguments: [...arguments] },
        errorObject: err
      });
      throw err;
    }
  }
};

