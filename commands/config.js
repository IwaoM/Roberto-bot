const { SlashCommandBuilder } = require("discord.js");
const { createRobertoAdminRole, checkOwnMissingPermissions } = require("../helpers/discord.helper.js");
const { getGuildConfigs, updateGuildConfigEntry } = require("../helpers/files.helper.js");
const { adminRoleName, neededPermissionNames } = require("../publicConfig.js");
const { logError, logAction, logEvent, consoleError } = require("../helpers/logs.helper.js");

const trueFalseOptionChoices = [{ name: "Enable", value: "enable" }, { name: "Disable", value: "disable" }];
const showOptionChoice = { name: "Show", value: "show" };

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configures Roberto's behavior on the server")
    .addSubcommand(subcommand =>
      subcommand
        .setName("auto-color")
        .setDescription("Whether to automatically give a color role to new members")
        .addStringOption(option => option
          .setName("action")
          .setDescription("Action")
          .setRequired(true)
          .setChoices(...trueFalseOptionChoices, showOptionChoice))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("auto-greet")
        .setDescription("Whether to automatically greet new members")
        .addStringOption(option => option
          .setName("action")
          .setDescription("Action")
          .setRequired(true)
          .setChoices(...trueFalseOptionChoices, showOptionChoice))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("permission-dm")
        .setDescription("Whether to automatically send a DM when needed permissions are removed for Roberto")
        .addStringOption(option => option
          .setName("action")
          .setDescription("Action")
          .setRequired(true)
          .setChoices(...trueFalseOptionChoices, showOptionChoice))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("roles-show")
        .setDescription("Shows the admin role used by Roberto and its ID")
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("roles-repair")
        .setDescription("Recreates the admin role if it was deleted")
    ),

  async execute (interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      let commandArgs;

      // get the command options
      const commandAction = interaction.options.getString(`action`) || null;

      if (subcommand === "auto-color") {
        commandArgs = { action: commandAction };
      } else if (subcommand === "auto-greet") {
        commandArgs = { action: commandAction };
      } else if (subcommand === "permission-dm") {
        commandArgs = { action: commandAction };
      }

      logEvent({
        name: "config",
        description: "The config command was called",
        command: commandArgs ?
          { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand, arguments: commandArgs } :
          { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand },
        guild: interaction.guild,
        member: interaction.member
      });

      await interaction.deferReply({ ephemeral: true });

      const guildConfig = getGuildConfigs(interaction.guildId);

      // for subcommands with an action option
      if (subcommand === "auto-color"
        || subcommand === "auto-greet"
        || subcommand === "permission-dm"
      ) {

        // allow command only if caller has the Roberto admin role
        if (interaction.member.roles.cache.get(guildConfig.robertoAdminRoleId)) {
          let configOption;
          if (subcommand === "auto-color") {
            configOption = "colorNewMembers";
          } else if (subcommand === "auto-greet") {
            configOption = "greetNewMembers";
          } else if (subcommand === "permission-dm") {
            configOption = "dmOnPermissionRemoved";
          }

          let sentReply;
          if (commandAction === "show") {

            // display current value for the option
            sentReply = await interaction.editReply({ content: `Current setting for ${subcommand} : **${guildConfig[configOption] ? "enabled" : "disabled"}**.`, ephemeral: true });

          } else if (commandAction === "enable") {

            // set the option's value to true
            const argObject = {};
            argObject[configOption] = true;
            updateGuildConfigEntry(interaction.guildId, argObject);
            sentReply = await interaction.editReply(`The ${subcommand} option has been enabled.`);

          } else if (commandAction === "disable") {

            // set the option's value to false
            const argObject = {};
            argObject[configOption] = false;
            updateGuildConfigEntry(interaction.guildId, argObject);
            sentReply = await interaction.editReply(`The ${subcommand} option has been disabled.`);

          }

          logAction({
            name: `config command handling`,
            command: { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand, arguments: commandArgs },
            guild: interaction.guild,
            message: sentReply
          });

        } else {
          const adminRole = await interaction.guild.roles.fetch(guildConfig.robertoAdminRoleId);
          if (adminRole) {
            throw new Error(`Missing admin role - role exists`);
          } else {
            throw new Error(`Missing admin role - role does not exist`);
          }

        }

      } else if (subcommand === "roles-show") {

        // allow command only if caller has the Roberto admin role
        if (interaction.member.roles.cache.get(guildConfig.robertoAdminRoleId)) {

          // admin role always exists or the command couldn't be called in the first place
          const adminRole = await interaction.guild.roles.fetch(guildConfig.robertoAdminRoleId);
          const messageText = `Roberto Administrator role : "${adminRole.name}" - ID ${guildConfig.robertoAdminRoleId}`;

          const sentReply = await interaction.editReply(messageText);
          logAction({
            name: `config command handling`,
            command: { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand },
            guild: interaction.guild,
            message: sentReply
          });

        } else {

          const adminRole = await interaction.guild.roles.fetch(guildConfig.robertoAdminRoleId);
          if (adminRole?.id) {
            throw new Error(`Missing admin role - role exists`);
          } else {
            throw new Error(`Missing admin role - role does not exist`);
          }

        }

      } else if (subcommand === "roles-repair") {
        // before anything else, check if Roberto has the required permissions
        const neededPermissionsForCommand = ["ManageRoles"];
        const missingPermissions = checkOwnMissingPermissions(interaction.guild, neededPermissionsForCommand);
        if (missingPermissions.length) {
          throw new Error(`Missing permissions - [${neededPermissionsForCommand.map(key => neededPermissionNames.get(key)).join(", ")}]`);
        }

        // this command is allowed for everyone (in case the Roberto admin role is deleted)
        const guildRoles = await interaction.guild.roles.fetch();
        const adminRole = guildRoles.get(guildConfig.robertoAdminRoleId);
        const rolesToDelete = guildRoles.filter(
          role => !role.members.size && (role.name === adminRoleName && role.id !== guildConfig.robertoAdminRoleId)
        );
        let messageText = "Repairing roles...";
        interaction.editReply(messageText);

        // regenerate admin role if not found
        if (!adminRole) {
          const newAdminRole = await createRobertoAdminRole(interaction.guild);
          updateGuildConfigEntry(interaction.guildId, newAdminRole);
          messageText += `\n• Roberto admin role was recreated (ID ${newAdminRole.robertoAdminRoleId}).`;
          interaction.editReply(messageText);
        }

        // delete unused roles with the same name as the admin role if any
        if (rolesToDelete.size) {
          messageText += `\n• ${rolesToDelete.size} unused role${rolesToDelete.size === 1 ? " was" : "s were"} found.`;
          interaction.editReply(messageText);
        }
        let deletedCount = 0, notDeletedCount = 0;

        let tempMessageText;
        for (let i = 0; i < rolesToDelete.size; i++) {
          try {
            await rolesToDelete.at(i).delete();
            logAction({ name: "role deletion", guild: interaction.guild, role: rolesToDelete.at(i) });
            deletedCount++;
          } catch (err) {
            notDeletedCount++;
          }
          tempMessageText = messageText;
          tempMessageText += (deletedCount ? `\n    • ${deletedCount} unused role${deletedCount === 1 ? " was" : "s were"} deleted.` : "");
          tempMessageText += notDeletedCount ? `\n    • ${notDeletedCount} could not be deleted - the Roberto managed role should be placed above other roles in the server's role list.` : "";
          interaction.editReply(tempMessageText);
        }
        if (tempMessageText) {
          messageText = tempMessageText;
        }

        if (messageText.split("\n").length === 1) {
          messageText = `No repair was needed.`;
        } else {
          messageText += `\nDone!`;
        }

        const sentReply = await interaction.editReply(messageText);
        logAction({
          name: `config command handling`,
          command: commandArgs ?
            { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand, arguments: commandArgs } :
            { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand },
          guild: interaction.guild,
          message: sentReply
        });
      }
    } catch (err) {
      consoleError(err);
      logError({
        name: `config command handler error`,
        description: `Failed to handle the config command`,
        function: { name: `config.execute`, arguments: [...arguments] },
        errorObject: err
      });

      let replyText = "The command could not be executed - unknown error.";
      const missingRoleMessage = "The command could not be executed - this command can only be used by Roberto administrators.";
      if (err.message === "Missing admin role - role exists") {
        replyText = missingRoleMessage;
      } else if (err.message === "Missing admin role - role does not exist") {
        replyText = missingRoleMessage + "\nCurrently, the role does not exist. This can be fixed with the `/config roles-repair` command.";
      } else if (err.message.startsWith("Missing permissions")) {
        replyText = `The command could not be executed - missing bot permission(s) : ${err.message.split(" - ")[1]}`;
      }

      try {
        await interaction.editReply(replyText);
      } catch (e) {
        if (e.code === "InteractionNotReplied") {
          await interaction.reply(replyText);
        }
      }

      throw err;
    }
  },

  usage: `• \`/config auto-color <enable|disable|show>\`: enables, disables or shows the current value for the option to automatically give a color role to new server members.
    • The applied color will be the new members's profile picture's dominant color.
• \`/config auto-greet <enable|disable|show>\`: enables, disables or shows the current value for the option to automatically greet new server members.
    • If enabled, it is recommended to disable the native option from Discord to greet new members to avoid double greetings.
• \`/config permission-dm <enable|disable|show>\`: enables, disables or shows the current value for the option to automatically send a DM to the person who modified a server role if this modification removed required permissions from Roberto.
    • If Roberto doesn't have the ViewAuditLog permission (which allows them to fetch the person who edited the role), the DM will automatically be sent to the server owner instead.
    • If Roberto's permissions changes occurred while they were offline, the DM will automatically be sent to the server owner on Roberto's startup, regardless of whether Roberto has the ViewAuditLog permission.
• \`/config roles-show\`: Shows the current Roberto admin role name and ID.
• \`/config roles-repair\`: Regenerates the Roberto admin role and deletes unused roles with the same name.

Most of those commands are only usable by members with the Roberto admin role, the only exception being \`/config roles-repair\`.`
};
