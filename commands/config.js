const { SlashCommandBuilder } = require("discord.js");
const { checkRoleAssignment, createRobertoAdminRole, checkOwnMissingPermissions, createSlowmodeRole } = require("../helpers/discord.helper.js");
const { getGuildConfigs, updateGuildConfigEntry } = require("../helpers/files.helper.js");
const { adminRoleName, slowmodeRoleName } = require("../config.json");
const { logError, logAction, logEvent, consoleError } = require("../helpers/logs.helper.js");

const trueFalseOptionChoices = [{ name: "Enable", value: "enable" }, { name: "Disable", value: "disable" }];
const showOptionChoice = { name: "Show", value: "show" };
const addRemoveOptionChoices = [{ name: "Add", value: "add" }, { name: "Remove", value: "remove" }];

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
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("slowmode-show")
        .setDescription("Shows the current configuration for the slowmode role")
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("slowmode-channels")
        .setDescription("Add or remove a channel to be affected by the slowmode role")
        .addStringOption(option => option
          .setName("action")
          .setDescription("Action")
          .setRequired(true)
          .setChoices(...addRemoveOptionChoices))
        .addChannelOption(option => option
          .addChannelTypes(0)
          .setName("channel")
          .setDescription("Text channels only")
          .setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("slowmode-delay")
        .setDescription("Add or remove a channel to be affected by the slowmode role")
        .addIntegerOption(option => option
          .setName("delay")
          .setDescription("Between 1 and 3600 seconds")
          .setMinValue(1)
          .setMaxValue(3600)
          .setRequired(true))
    ),

  async execute (interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      let commandArgs;

      // get the command options
      const commandAction = interaction.options.getString(`action`) || null;
      const commandParamInteger = interaction.options.getInteger(`delay`) || null;
      const fullChannel = interaction.options.getChannel(`channel`) || null;
      const commandParamChannel = fullChannel ? { id: fullChannel.id, name: fullChannel.name } : null;

      if (subcommand === "auto-color") {
        commandArgs = { action: commandAction };
      } else if (subcommand === "auto-greet") {
        commandArgs = { action: commandAction };
      } else if (subcommand === "permission-dm") {
        commandArgs = { action: commandAction };
      } else if (subcommand === "slowmode-channels") {
        commandArgs = { action: commandAction, parameter: commandParamChannel };
      } else if (subcommand === "slowmode-delay") {
        commandArgs = { parameter: commandParamInteger };
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

      const guildConfig = await getGuildConfigs(interaction.guildId);

      // for subcommands with an action option
      if (subcommand === "auto-color"
        || subcommand === "auto-greet"
        || subcommand === "permission-dm"
        || subcommand === "slowmode-channels"
      ) {

        // allow command only if caller has the Roberto admin role
        if (await checkRoleAssignment(interaction.member, guildConfig.robertoAdminRoleId)) {
          let configOption;
          if (subcommand === "auto-color") {
            configOption = "colorNewMembers";
          } else if (subcommand === "auto-greet") {
            configOption = "greetNewMembers";
          } else if (subcommand === "permission-dm") {
            configOption = "dmOnPermissionRemoved";
          } else if (subcommand === "slowmode-channels") {
            configOption = "slowmodeChannels";
          }

          let sentReply;
          if (commandAction === "show") {

            // display current value for the option
            sentReply = await interaction.editReply({ content: `Current setting for ${subcommand} : **${guildConfig[configOption] ? "enabled" : "disabled"}**.`, ephemeral: true });

          } else if (commandAction === "enable") {

            // set the option's value to true
            const argObject = {};
            argObject[configOption] = true;
            await updateGuildConfigEntry(interaction.guildId, argObject);
            sentReply = await interaction.editReply(`The ${subcommand} option has been enabled.`);

          } else if (commandAction === "disable") {

            // set the option's value to false
            const argObject = {};
            argObject[configOption] = false;
            await updateGuildConfigEntry(interaction.guildId, argObject);
            sentReply = await interaction.editReply(`The ${subcommand} option has been disabled.`);

          } else if (commandAction === "add") {

            // currently, only the slowmode-channels command has this action option
            // create the slowmode role on the fly if it does not exist
            if (!guildConfig.slowmodeRoleId) {
              // check if Roberto has the required permission to create the slowmode role
              const neededPermissionsForCommand = ["ManageRoles"];
              const missingPermissions = await checkOwnMissingPermissions(interaction.guild, neededPermissionsForCommand);
              if (missingPermissions.length) {
                throw new Error(`Missing permissions - [${neededPermissionsForCommand.join(", ")}]`);
              }
              const slowmodeRole = await createSlowmodeRole(interaction.guild);
              await updateGuildConfigEntry(interaction.guildId, slowmodeRole);
            }

            // add the channel to the slowmodeChannels list
            // create the list if it doesn't exist
            const slowmodeChannels = guildConfig[configOption] ? [...guildConfig[configOption]] : [];
            if (!slowmodeChannels.includes(commandParamChannel.id)) {
              slowmodeChannels.push(commandParamChannel.id);
              const argObject = {};
              argObject[configOption] = slowmodeChannels;
              await updateGuildConfigEntry(interaction.guildId, argObject);
              sentReply = await interaction.editReply(`Channel <#${commandParamChannel.id}> has been added to the list of channels affected by slowmode.`);
            } else {
              sentReply = await interaction.editReply(`Channel <#${commandParamChannel.id}> is already in the list of channels affected by slowmode.`);
            }

          } else if (commandAction === "remove") {

            // currently, only the slowmode-channels command has this action option
            // remove the channel from the slowmodeChannels list
            // create the list if it doesn't exist
            const slowmodeChannels = guildConfig[configOption] ? [...guildConfig[configOption]] : [];
            if (slowmodeChannels.includes(commandParamChannel.id)) {
              slowmodeChannels.splice(slowmodeChannels.indexOf(commandParamChannel.id), 1);
              const argObject = {};
              argObject[configOption] = slowmodeChannels;
              await updateGuildConfigEntry(interaction.guildId, argObject);
              sentReply = await interaction.editReply(`Channel <#${commandParamChannel.id}> has been removed from the list of channels affected by slowmode.`);
            } else {
              sentReply = await interaction.editReply(`Channel <#${commandParamChannel.id}> is already not in the list of channels affected by slowmode.`);
            }

          }
          logAction({
            name: `config command handling`,
            command: { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand, arguments: commandArgs },
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

      } else if (subcommand === "slowmode-delay") {

        const configOption = "slowmodeDelay";
        const argObject = {};
        argObject[configOption] = commandParamInteger;
        await updateGuildConfigEntry(interaction.guildId, argObject);

        const messageText = `A slowmode delay of **${commandParamInteger} seconds** has been set.`;
        const sentReply = await interaction.editReply(messageText);
        logAction({
          name: `config command handling`,
          command: { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand, arguments: commandArgs },
          message: sentReply
        });

      } else if (subcommand === "slowmode-show") {

        // display current value for the option
        if (guildConfig.slowmodeChannels === undefined) {
          await updateGuildConfigEntry(interaction.guildId, { slowmodeChannels: [] });
        }
        if (!guildConfig.slowmodeDelay) {
          await updateGuildConfigEntry(interaction.guildId, { slowmodeDelay: 5 });
        }
        let sentReply = await interaction.editReply(`Current settings for slowmode : 
Slowmode-enabled channels: ${guildConfig.slowmodeChannels?.length ? `[<#${guildConfig.slowmodeChannels.join(">, <#")}>]` : "none"}
Slowmode delay: ${guildConfig.slowmodeDelay ? guildConfig.slowmodeDelay : 5} seconds`);

        logAction({
          name: `config command handling`,
          command: { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand },
          message: sentReply
        });

      } else if (subcommand === "roles-show") {

        // allow command only if caller has the Roberto admin role
        if (await checkRoleAssignment(interaction.member, guildConfig.robertoAdminRoleId)) {

          // admin role always exists or the command couldn't be called in the first place
          const slowmodeRole = await interaction.guild.roles.fetch(guildConfig.slowmodeRoleId);

          let messageText = `Roberto Administrator role: <@&${guildConfig.robertoAdminRoleId}>`;
          if (slowmodeRole?.id) {
            messageText += `\nSlowmode role: <@&${guildConfig.slowmodeRoleId}>`;
          } else if (guildConfig.slowmodeRoleId) {
            messageText += `\nSlowmode role was not found - this can be fixed with the \`/config roles-repair\` command.`;
          } else {
            messageText += `\nSlowmode role does not exist yet - it will be created if you add a channel with the \`/config slowmode-channels add\` command.`;
          }

          const sentReply = await interaction.editReply(messageText);
          logAction({
            name: `config command handling`,
            command: { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand },
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
        const missingPermissions = await checkOwnMissingPermissions(interaction.guild, neededPermissionsForCommand);
        if (missingPermissions.length) {
          throw new Error(`Missing permissions - [${neededPermissionsForCommand.join(", ")}]`);
        }

        // this command is allowed for everyone (in case the Roberto admin role is deleted)
        const guildRoles = await interaction.guild.roles.fetch();
        const adminRole = guildRoles.get(guildConfig.robertoAdminRoleId);
        const slowmodeRole = guildRoles.get(guildConfig.slowmodeRoleId);
        const rolesToDelete = guildRoles.filter(
          role => !role.members.size && (
            role.name === adminRoleName && role.id !== guildConfig.robertoAdminRoleId
            || role.name === slowmodeRoleName && role.id !== guildConfig.slowmodeRoleId
          )
        );
        let messageText = "Repairing roles...";
        interaction.editReply(messageText);

        // regenerate admin role if not found
        if (!adminRole) {
          const newAdminRole = await createRobertoAdminRole(interaction.guild);
          await updateGuildConfigEntry(interaction.guildId, newAdminRole);
          messageText += `\n• Roberto admin role was recreated (ID ${newAdminRole.robertoAdminRoleId}).`;
          interaction.editReply(messageText);
        }

        // regenerate slowmode role if not found
        if (!slowmodeRole) {
          const newSlowmodeRole = await createSlowmodeRole(interaction.guild);
          await updateGuildConfigEntry(interaction.guildId, newSlowmodeRole);
          messageText += `\n• Slowmode role was recreated (ID ${newSlowmodeRole.slowmodeRoleId}).`;
          interaction.editReply(messageText);
        }

        // delete unused roles with the same name as the admin or slowmode roles if any
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
        replyText = `The command could not be executed - missing permissions : ${err.message.split(" - ")[1]}`;
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
