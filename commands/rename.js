const { SlashCommandBuilder } = require("discord.js");
const { checkOwnMissingPermissions } = require("../helpers/discord.helper.js");
const { logError, logAction, logEvent, consoleError } = require("../helpers/logs.helper.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rename")
    .setDescription("Changes a server member's nickname")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("The user you want to rename")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("nickname")
        .setDescription("The nickname to apply (leave empty to remove the current nickname)")
    ),

  async execute (interaction) {
    try {
      const userOption = interaction.options.getUser("user");
      const nicknameOption = interaction.options.getString("nickname");
      const commandArgs = { user: { id: userOption.id, tag: userOption.tag }, nickname: nicknameOption };

      logEvent({
        name: "rename",
        description: "The rename command was called",
        command: { id: interaction.commandId, name: interaction.commandName, arguments: commandArgs },
        guild: interaction.guild,
        member: interaction.member
      });

      // before anything else, check if Roberto has the required permissions
      const neededPermissionsForCommand = ["ManageNicknames"];
      const missingPermissions = checkOwnMissingPermissions(interaction.guild, neededPermissionsForCommand);
      if (missingPermissions.length) {
        throw new Error(`Missing permissions - [${neededPermissionsForCommand.join(", ")}]`);
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
          sentReply = await interaction.editReply(`Nickname of <@${userOption.id}> was reset by <@${interaction.user.id}>.`);
        }
        logAction({
          name: `handle random command`,
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
        name: `rename command handler error`,
        description: `Failed to handle the rename command`,
        function: { name: `rename.execute`, arguments: [...arguments] },
        errorObject: err
      });

      let replyText = "The command could not be executed - unknown error.";
      if (err.message.startsWith("Missing permissions")) {
        replyText = `The command could not be executed - missing permissions : ${err.message.split(" - ")[1]}`;
      } else if (err.message === "Target is server owner") {
        replyText = `The command could not be executed - the server owner cannot be renamed by this command.`;
      } else if (err.message === "Role too low") {
        replyText = `The command could not be executed - the Roberto managed role should be placed above all roles of the user to rename in the server's role list.`;
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

  usage: `• \`/rename @user <name>\`: gives nickname *name* to user *@user*.
• \`/rename @user\`: removes user *@user*'s current nickname.

Note : the server owner cannot be renamed by this command.`
};
