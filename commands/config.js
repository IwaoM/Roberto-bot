const { SlashCommandBuilder } = require("discord.js");
const { checkRoleAssignment, createRobertoRoles, checkOwnMissingPermissions } = require("../helpers/discord.helper.js");
const { getGuildConfigs, updateGuildConfigEntry } = require("../helpers/files.helper.js");
const { adminRoleName } = require("../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configures Roberto's behavior on the server")
    .addSubcommand(subcommand =>
      subcommand
        .setName("auto-color")
        .setDescription("Whether to automatically give a color role to new members")
        .addStringOption(option => option.setName("auto-color").setDescription("True or false").setRequired(true).setChoices({ name: "Enable", value: "enable" }, { name: "Disable", value: "disable" }, { name: "Show", value: "show" }))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("auto-greet")
        .setDescription("Whether to automatically greet new members")
        .addStringOption(option => option.setName("auto-greet").setDescription("True or false").setRequired(true).setChoices({ name: "Enable", value: "enable" }, { name: "Disable", value: "disable" }, { name: "Show", value: "show" }))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("roles-show")
        .setDescription("Shows the admin role used by Roberto and its ID")
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("roles-repair")
        .setDescription("Recreates the admin role in case it was deleted")
    ),

  async execute (interaction, client, guild) {
    await interaction.deferReply({ ephemeral: true });

    const guildConfig = await getGuildConfigs(interaction.guildId);

    // check subcommand
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "auto-color" || subcommand === "auto-greet") {

      // allow command only if caller has the Roberto admin role
      if (checkRoleAssignment(interaction.member, guildConfig.robertoAdminRoleId)) {
        const commandOption = interaction.options.getString(subcommand);

        let configOption;
        if (subcommand === "auto-color") {
          configOption = "colorNewMembers";
        } else if (subcommand === "auto-greet") {
          configOption = "greetNewMembers";
        }

        if (commandOption === "show") {

          // display current value for the option
          await interaction.editReply({ content: `Current setting for ${subcommand} : **${guildConfig[configOption] ? "enabled" : "disabled"}**.`, ephemeral: true });

        } else if (commandOption === "enable") {

          // set the option's value to true
          const argObject = {};
          argObject[configOption] = true;
          try {
            await updateGuildConfigEntry(interaction.guildId, argObject);
            await interaction.editReply(`The ${subcommand} option has been enabled.`);
          } catch (err) {
            if (err.message === "Invalid argument") {
              await interaction.editReply(`The command could not be executed - unknown config option.`);
            } else if (err.message === "Config entry not found") {
              await interaction.editReply(`The command could not be executed - guild config was not found`);
            } else {
              throw err;
            }
          }

        } else if (commandOption === "disable") {

          // set the option's value to false
          const argObject = {};
          argObject[configOption] = false;
          try {
            await updateGuildConfigEntry(interaction.guildId, argObject);
            await interaction.editReply(`The ${subcommand} option has been disabled.`);
          } catch (err) {
            if (err.message === "Invalid argument") {
              await interaction.editReply(`The command could not be executed - unknown config option.`);
            } else if (err.message === "Config entry not found") {
              await interaction.editReply(`The command could not be executed - guild config was not found`);
            } else {
              throw err;
            }
          }

        }
      } else {

        let message = "The command could not be executed - this command can only be used by Roberto administrators.";
        const adminRole = await interaction.guild.roles.fetch(guildConfig.robertoAdminRoleId);
        if (!adminRole) {
          message += "\nCurrently, the role does not exist. This can be fixed with the `/config roles-repair` command.";
        }
        await interaction.editReply(message);

      }

    } else if (subcommand === "roles-show") {

      // allow command only if caller has the Roberto admin role
      if (checkRoleAssignment(interaction.member, guildConfig.robertoAdminRoleId)) {

        // admin role always exists or the command couldn't be called in the first place
        const adminRole = await interaction.guild.roles.fetch(guildConfig.robertoAdminRoleId);
        const messageText = `Roberto Administrator role : "${adminRole.name}" - ID ${guildConfig.robertoAdminRoleId}`;

        await interaction.editReply(messageText);

      } else {

        let message = "The command could not be executed - this command can only be used by Roberto administrators.";
        const adminRole = await interaction.guild.roles.fetch(guildConfig.robertoAdminRoleId);
        if (!adminRole) {
          message += "\nCurrently, the role does not exist. This can be fixed with the `/config roles-repair` command.";
        }
        await interaction.editReply(message);

      }

    } else if (subcommand === "roles-repair") {
      // before anything else, check if Roberto has the required permissions
      const neededPermissions = ["ManageRoles"];
      const missingPermissions = await checkOwnMissingPermissions(client, guild, neededPermissions);
      if (missingPermissions.length) {
        interaction.editReply(`The command could not be executed - missing permissions : [${neededPermissions.join(", ")}]`);
        return;
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
        const newAdminRole = await createRobertoRoles(interaction.guild, "admin");
        try {
          await updateGuildConfigEntry(interaction.guildId, newAdminRole);
          messageText += `\n• Roberto admin role was recreated (ID ${newAdminRole.robertoAdminRoleId}).`;
        } catch (err) {
          messageText += `\n• Failed to recreate the Roberto admin role.`;
        }
        interaction.editReply(messageText);
      }

      // delete unused roles with the same name as the admin role if any
      if (rolesToDelete.size) {
        messageText += `\n• ${rolesToDelete.size} unused role${rolesToDelete.size === 1 ? " was" : "s were"} found`;
        interaction.editReply(messageText);
      }
      let deletedCount = 0, notDeletedCount = 0;

      let tempMessageText;
      for (let i = 0; i < rolesToDelete.size; i++) {
        try {
          await rolesToDelete.at(i).delete();
          deletedCount++;
        } catch (err) {
          notDeletedCount++;
        }
        tempMessageText = messageText;
        tempMessageText += (deletedCount ? `\n    • ${deletedCount} unused role${deletedCount === 1 ? " was" : "s were"} deleted.` : "");
        tempMessageText += notDeletedCount ? `\n    • ${notDeletedCount} could not be deleted - the Roberto managed role should be placed above other roles in the server's role list.` : "";
        interaction.editReply(tempMessageText);
      }
      messageText = tempMessageText;

      if (messageText.split("\n").length === 1) {
        messageText = `No repair was needed.`;
      }

      await interaction.editReply(messageText);
    }
  },

  usage: `• \`/config auto-color <enable|disable|show>\`: enables, disables or shows the current value for the option to automatically give a color role to new server members.
    • The applied color will be the new members's profile picture's dominant color.
• \`/config auto-greet <enable|disable|show>\`: same, but for the option to automatically greet new server members.
    • If enabled, it is recommended to disable the native option from Discord to greet new members to avoid double greetings.
• \`/config roles-show\`: Shows the current Roberto admin role name and ID.
• \`/config roles-repair\`: Regenerates the Roberto adminrole and deletes unused roles with the same name.

Most of those commands are only usable by members with the Roberto admin role, the only exception being \`/config roles-repair\`.`
};
