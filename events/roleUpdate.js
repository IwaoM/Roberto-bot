const { checkOwnMissingPermissions, getPermissionRemoverUser, dmUsers } = require("../helpers/discord.helper.js");
const { robertoNeededPermissions } = require("../config.json");
const { getGuildConfigs, updateGuildConfigEntry } = require("../helpers/files.helper.js");

module.exports = {
  name: "roleUpdate",

  async execute (oldRole, newRole) {
    // get guild config
    let guildConfig;
    try {
      guildConfig = await getGuildConfigs(newRole.guild.id);
    } catch (err) {
      if (err.message === "Config entry not found") {
        console.log(`Failed to handle role update - guild config was not found (this message is normal if Roberto just joined a server).`);
        return;
      } else {
        throw err;
      }
    }

    // check old & new permissions for the bot to see if any required permission was removed
    const botGuildMember = newRole.guild.members.me;

    // if Roberto has the updated role
    if (newRole.members.has(botGuildMember.id)) {
      const newBotMissingPermissions = await checkOwnMissingPermissions(newRole.guild, robertoNeededPermissions);
      const oldBotMissingPermissions = guildConfig.missingPermissions;
      const newlyBotMissingPermissions = newBotMissingPermissions.filter(perm => oldBotMissingPermissions.indexOf(perm) === -1);

      // if previously granted needed permissions were removed from Roberto
      if (newlyBotMissingPermissions.length && guildConfig.dmOnPermissionRemoved) {
        let dmText, dmRecipient;

        // If a DM should be sent, check if Roberto has the required permissions
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
${missingPermissions.length ? "Someone" : "You"} recently updated the role **${newRole.name}** in the server **${newRole.guild.name}**, which removed the following permission${newlyBotMissingPermissions.length === 1 ? "" : "s"} for me: [${newlyBotMissingPermissions.join(", ")}].
I need th${newlyBotMissingPermissions.length === 1 ? "is permission" : "ese permissions"} to function properly (more details on why exactly here: https://github.com/IwaoM/Roberto-bot#readme). Please consider restoring ${newlyBotMissingPermissions.length === 1 ? "it" : "them"} :)
Thanks!

Note: this automatic DM can be disabled with the \`/config permission-dm\` command.`;

        // if DM text & recipient are not empty, send the text to the recipient
        if (dmText && dmRecipient) {
          await dmUsers(dmText, [dmRecipient]);
        }

      }

      // in any case, replace the missing permission value in the guild config
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