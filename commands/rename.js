const { SlashCommandBuilder } = require("discord.js");
const { checkOwnMissingPermissions } = require("../helpers/discord.helper.js");
const { logError, logAction, logEvent, consoleError } = require("../helpers/logs.helper.js");
const { neededPermissionNames } = require("../publicConfig.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nickname")
    .setDescription("Changes a server member's nickname")
    .addSubcommand(subcommand =>
      subcommand.setName("set")
        .setDescription("Give a new nickname")
        .addUserOption(option =>
          option.setName("user")
            .setDescription("The user you want to rename")
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName("nickname")
            .setDescription("The nickname to apply")
            .setRequired(true)
        ),
    )
    .addSubcommand(subcommand =>
      subcommand.setName("remove")
        .setDescription("Remove nickname")
        .addUserOption(option =>
          option.setName("user")
            .setDescription("The user you want to remove the nickname of")
            .setRequired(true)
        )
    ),

  async execute (interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      let userOption, nicknameOption, commandArgs;
      if (subcommand === "set") {
        userOption = interaction.options.getUser("user");
        nicknameOption = interaction.options.getString("nickname");
        commandArgs = { user: { id: userOption.id, tag: userOption.tag }, nickname: nicknameOption };
      } else if (subcommand === "remove") {
        userOption = interaction.options.getUser("user");
        nicknameOption = null;
        commandArgs = { user: { id: userOption.id, tag: userOption.tag } };
      }

      logEvent({
        name: "nickname",
        description: "The nickname command was called",
        command: { id: interaction.commandId, name: interaction.commandName, arguments: commandArgs },
        guild: interaction.guild,
        member: interaction.member
      });

      // before anything else, check if Roberto has the required permissions
      const neededPermissionsForCommand = ["ManageNicknames"];
      const missingPermissions = checkOwnMissingPermissions(interaction.guild, neededPermissionsForCommand);
      if (missingPermissions.length) {
        throw new Error(`Missing permissions - [${neededPermissionsForCommand.map(key => neededPermissionNames.get(key)).join(", ")}]`);
      }

      await interaction.deferReply();

      const memberToRename = await interaction.guild.members.fetch(userOption.id);
      try {

        await memberToRename.setNickname(nicknameOption);
        logAction({ name: `member nickname update`, guild: interaction.guild, member: memberToRename });
        let sentReply;
        if (nicknameOption) {
          sentReply = await interaction.editReply(`Nickname **${nicknameOption}** was given to <@${userOption.id}> by <@${interaction.user.id}>.`);
        } else {
          sentReply = await interaction.editReply(`Nickname of <@${userOption.id}> was removed by <@${interaction.user.id}>.`);
        }
        logAction({
          name: `nickname command handling`,
          command: { id: interaction.commandId, name: interaction.commandName, arguments: commandArgs },
          guild: interaction.guild,
          message: sentReply
        });

      } catch (err) {

        if (err.code === 50013) { // Missing permissions : Roberto role incorrectly placed in role list or renamed user is the server owner
          if (interaction.member.guild.ownerId === userOption.id) {
            throw new Error(`Target is server owner`);
          } else {
            throw new Error(`Role too low`);
          }
        } else {
          throw err;
        }

      }
    } catch (err) {
      consoleError(err);
      logError({
        name: `nickname command handler error`,
        description: `Failed to handle the nickname command`,
        function: { name: `nickname.execute`, arguments: [...arguments] },
        errorObject: err
      });

      let replyText = "The command could not be executed - unknown error.";
      if (err.message.startsWith("Missing permissions")) {
        replyText = `The command could not be executed - missing bot permission(s) : ${err.message.split(" - ")[1]}`;
      } else if (err.message === "Target is server owner") {
        replyText = `The command could not be executed - the server owner's nickname cannot be updated by Roberto.`;
      } else if (err.message === "Role too low") {
        replyText = `The command could not be executed - the Roberto managed role should be placed above all roles of the user to update the nickname of in the server's role list.`;
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

  usage: `• \`/nickname set @user <name>\`: gives nickname *name* to user *@user*.
• \`/nickname remove @user\`: removes user *@user*'s current nickname.

Note : the server owner's nickname cannot be updated by this command.`
};
