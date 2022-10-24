const { SlashCommandBuilder } = require("discord.js");
const { checkRoleAssignment, createRobertoRoles } = require("../helpers/discord.helper.js");
const { getGuildConfigs, updateGuildConfigEntry } = require("../helpers/files.helper.js");
const { adminRoleName, operatorRoleName } = require("../config.json");

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
        .setDescription("Shows the admin & operator roles used by Roberto and their IDs")
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("roles-repair")
        .setDescription("Recreates the admin & operator roles in case they were deleted")
    ),

  async execute (interaction) {
    await interaction.deferReply();

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
          if (await updateGuildConfigEntry(interaction.guildId, argObject)) {
            await interaction.editReply({ content: `The ${subcommand} option has been enabled.`, ephemeral: true });
          } else {
            await interaction.editReply({ content: `An error occurred when enabling ${subcommand} - please retry later.`, ephemeral: true });
          }

        } else if (commandOption === "disable") {

          // set the option's value to false
          const argObject = {};
          argObject[configOption] = false;
          if (await updateGuildConfigEntry(interaction.guildId, argObject)) {
            await interaction.editReply({ content: `The ${subcommand} option has been disabled.`, ephemeral: true });
          } else {
            await interaction.editReply({ content: `An error occurred when disabling ${subcommand} - please retry later.`, ephemeral: true });
          }

        }
      } else {
        await interaction.editReply({ content: "This command can only be used by Roberto administrators.", ephemeral: true });
      }

    } else if (subcommand === "roles-show") {

      // allow command only if caller has the Roberto admin role
      if (checkRoleAssignment(interaction.member, guildConfig.robertoAdminRoleId)) {

        // admin role always exists or the command couldn't be called in the first place
        const adminRole = await interaction.guild.roles.fetch(guildConfig.robertoAdminRoleId);
        let messageText = `Roberto Administrator role : "${adminRole.name}" - ID ${guildConfig.robertoAdminRoleId}\n`;

        // the same can't be said for the operator role, so check its existence
        const operatorRole = await interaction.guild.roles.fetch(guildConfig.robertoOperatorRoleId);
        if (operatorRole) {
          messageText += `Roberto Operator role : "${operatorRole.name}" - ID ${guildConfig.robertoOperatorRoleId}`;
        } else {
          messageText += `Roberto Operator role : not found`;
        }

        await interaction.editReply({ content: messageText, ephemeral: true });

      } else {
        await interaction.editReply({ content: "This command can only be used by Roberto administrators.", ephemeral: true });
      }

    } else if (subcommand === "roles-repair") {

      // this command is allowed for everyone (in case the Roberto admin role is deleted)
      const guildRoles = await interaction.guild.roles.fetch();
      const adminRole = guildRoles.get(guildConfig.robertoAdminRoleId);
      const operatorRole = guildRoles.get(guildConfig.robertoOperatorRoleId);
      const rolesToDelete = guildRoles.filter(
        role => !role.members.size && ((role.name === adminRoleName && role.id !== guildConfig.robertoAdminRoleId) || (role.name === operatorRoleName && role.id !== guildConfig.robertoOperatorRoleId))
      );
      let messageText = "Roles repaired:";

      // regenerate admin role if not found
      if (!adminRole) {
        const newAdminRole = await createRobertoRoles(interaction.guild, "admin");
        await updateGuildConfigEntry(interaction.guildId, newAdminRole);
        messageText += `\n• Roberto admin role was recreated (ID ${newAdminRole.robertoAdminRoleId}).`;
      }

      // regenerate operator role if not found
      if (!operatorRole) {
        const newOperatorRole = await createRobertoRoles(interaction.guild, "operator");
        await updateGuildConfigEntry(interaction.guildId, newOperatorRole);
        messageText += `\n• Roberto operator role was recreated (ID ${newOperatorRole.robertoOperatorRoleId}).`;
      }

      // delete unused roles with the same name as the admin or operator role if any
      let roleDeleteSuccess = true, deletedCount = 0;
      for (let i = 0; i < rolesToDelete.size; i++) {
        try {
          await rolesToDelete.at(i).delete();
          deletedCount++;
        } catch (err) {
          roleDeleteSuccess = false;
        }
      }
      if (rolesToDelete.size) {
        messageText += `\n• ${deletedCount} unused roles were deleted`;
        if (!roleDeleteSuccess) {
          messageText += ` (${rolesToDelete.size - deletedCount} could not be deleted - Roberto's role should be placed above other roles in the server's role list)`;
        }
        messageText += ".";
      }

      if (messageText === "Roles repaired") {
        messageText = `No repair was needed.`;
      }

      await interaction.editReply({ content: messageText, ephemeral: true });
    }
  },

  usage: `• \`/config auto-color <enable|disable|show>\`: enables, disables or shows the current value for the option to automatically give a color role to new server members.
    • The applied color will be the new members's profile picture's dominant color.
• \`/config auto-greet <enable|disable|show>\`: same, but for the option to automatically greet new server members.
    • If enabled, it is recommended to disable the native option from Discord to greet new members to avoid double greetings.
• \`/config roles-show\`: Shows the current role names and IDs for Roberto admins and operators (if found).
• \`/config roles-repair\`: Regenerates the Roberto admin and operator roles and deletes unused roles with the same name.

Most of those commands are only usable by members with the Roberto admin role, the only exception being \`/config roles-repair\`.`
};
