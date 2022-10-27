const { checkOwnMissingPermissions, getPermissionRemoverUser, dmUsers } = require("../helpers/discord.helper.js");
const { robertoNeededPermissions } = require("../config.json");
const { getGuildConfigs, updateGuildConfigEntry } = require("../helpers/files.helper.js");

module.exports = {
  name: "roleUpdate",

  async execute (oldRole, newRole, client) { // this function is also used by the roleDelete event handler
    // get guild config
    let guildConfig;
    try {
      guildConfig = await getGuildConfigs(newRole.guild.id);
    } catch (err) {
      if (err.message === "Config entry not found") {
        console.log(`Failed to handle role ${oldRole === null ? "delete" : "update"} - guild config was not found ${oldRole === null ? "" : "(this message is normal if Roberto just joined a server)"}.`);
        return;
      } else {
        throw err;
      }
    }

    const newBotMissingPermissions = (await checkOwnMissingPermissions(newRole.guild, robertoNeededPermissions)).sort();
    const oldBotMissingPermissions = guildConfig.missingPermissions.sort();
    const newlyBotMissingPermissions = newBotMissingPermissions.filter(perm => oldBotMissingPermissions.indexOf(perm) === -1);

    // if previously granted needed permissions were removed from Roberto && DM option is enabled
    if (newlyBotMissingPermissions.length && guildConfig.dmOnPermissionRemoved) {
      let dmText, dmRecipient;

      // check if Roberto has the required permissions
      const neededPermissionsForEvent = ["ViewAuditLog"];
      const missingPermissions = await checkOwnMissingPermissions(newRole.guild, neededPermissionsForEvent);
      if (missingPermissions.length) {

        // if the executor can't be fetched, get the server owner instead
        dmRecipient = (await newRole.guild.fetchOwner()).user;

      } else {

        // check audit logs to get the executor of that revocation
        dmRecipient = await getPermissionRemoverUser(newRole);

      }

      // construct DM text
      dmText = `Hello!
${missingPermissions.length ? "Someone" : "You"} recently ${oldRole === null ? "delete" : "update"}d the role **${newRole.name}** in the server **${newRole.guild.name}**, which removed the following permission${newlyBotMissingPermissions.length === 1 ? "" : "s"} for me: [${newlyBotMissingPermissions.join(", ")}].
I need th${newlyBotMissingPermissions.length === 1 ? "is permission" : "ese permissions"} to function properly (more details on why exactly here: https://github.com/IwaoM/Roberto-bot#readme). Please consider restoring ${newlyBotMissingPermissions.length === 1 ? "it" : "them"} :)
Thanks!

Note: this automatic DM can be disabled with the \`/config permission-dm\` command.`;

      // if DM text & recipient are not empty, send the text to the recipient
      if (dmText && dmRecipient) {
        try {
          await dmUsers(dmText, [dmRecipient]);
        } catch (err) {
          if (err.message === "Cannot message this user") {
            console.log(`Failed to send a DM to user ${dmRecipient.username} - recipient doesn't allow DMs from server members or Roberto was removed from the server`);
          } else {
            console.log(`Failed to send a DM to user ${dmRecipient.username} - unknown error`);
          }
        }
      }

    }

    // in any case, if permissions were changed for Roberto, replace the missing permission value in the guild config
    if (client.guilds.cache.find(guild => guild.id === newRole.guild.id) && newBotMissingPermissions.toString() !== oldBotMissingPermissions.toString()) {
      try {
        await updateGuildConfigEntry(newRole.guild.id, { missingPermissions: newBotMissingPermissions });
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