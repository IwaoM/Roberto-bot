const { checkHexCode } = require("./color.helper.js");
const { getGuildConfigs, updateGuildConfigEntry } = require("../helpers/files.helper.js");
const { checkOwnMissingPermissions, getPermissionUpdaterUser, dmUsers } = require("../helpers/discord.helper.js");
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
    // oldElem & newElem can be either roles (for events roleUpdate & roleDelete) or members (for event guildMemberUpdate)

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
        dmRecipient = await getPermissionUpdaterUser(newElem, eventType);

      }

      // construct DM text
      dmText = `Hello!
${missingPermissions.length ? "Someone" : "You"} recently `;

      if (eventType === "roleUpdate") {
        dmText += `updated the role **${newElem.name}** in the server **${newElem.guild.name}**, which `;
      } else if (eventType === "roleDelete") {
        dmText += `deleted the role **${newElem.name}** in the server **${newElem.guild.name}**, which `;
      } else if (eventType === "guildMemberUpdate") {
        dmText += `updated me as a member of the server **${newElem.guild.name}**, and `;
      }

      dmText += `removed the following permission${newlyBotMissingPermissions.length === 1 ? "" : "s"} from me: [${newlyBotMissingPermissions.join(", ")}].
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
  }
};