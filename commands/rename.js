const { SlashCommandBuilder } = require("discord.js");
const { checkOwnMissingPermissions } = require("../helpers/discord.helper.js");
const { logError, logAction, logEvent } = require("../helpers/logs.helper.js");

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

      await logEvent({
        name: "rename",
        description: "The rename command was called",
        command: { id: interaction.commandId, name: interaction.commandName, arguments: commandArgs },
        guild: interaction.guild,
        member: interaction.member
      });

      // before anything else, check if Roberto has the required permissions
      const neededPermissionsForCommand = ["ManageNicknames"];
      const missingPermissions = await checkOwnMissingPermissions(interaction.guild, neededPermissionsForCommand);
      if (missingPermissions.length) {
        throw new Error(`Missing permissions - [${neededPermissionsForCommand.join(", ")}]`);
      }

      await interaction.deferReply();

      const memberToRename = await interaction.guild.members.fetch(userOption.id);
      try {

        await memberToRename.setNickname(nicknameOption);
        await logAction({ name: `member nickname update`, guild: interaction.guild, member: memberToRename });
        let sentReply;
        if (nicknameOption) {
          sentReply = await interaction.editReply(`Nickname **${nicknameOption}** was given to <@${userOption.id}> by <@${interaction.user.id}>.`);
        } else {
          sentReply = await interaction.editReply(`Nickname of <@${userOption.id}> was reset by <@${interaction.user.id}>.`);
        }
        await logAction({
          name: `handle random command`,
          command: { id: interaction.commandId, name: interaction.commandName, arguments: commandArgs },
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
      await logError({
        name: `rename command handler error`,
        description: `Failed to handle the rename command`,
        function: { name: `rename.execute`, arguments: [...arguments] },
        errorObject: err
      });

      if (err.message.startsWith("Missing permissions")) {
        interaction.reply(`The command could not be executed - missing permissions : ${err.message.split(" - ")[1]}`);
      } else if (err.message === "Target is server owner") {
        interaction.reply(`The command could not be executed - the server owner cannot be renamed by this command.`);
      } else if (err.message === "Role too low") {
        interaction.reply(`The command could not be executed - the Roberto managed role should be placed above all roles of the user to rename in the server's role list.`);
      } else {
        try {
          await interaction.reply("The command could not be executed - unknown error.");
        } catch (e) {
          if (e.code === "InteractionAlreadyReplied") {
            await interaction.editReply("The command could not be executed - unknown error.");
          }
        }
      }

      throw err;
    }
  },

  usage: `• \`/rename @user <name>\`: gives nickname *name* to user *@user*.
• \`/rename @user\`: removes user *@user*'s current nickname.

Note : the server owner cannot be renamed by this command.`
};
