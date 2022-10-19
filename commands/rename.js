const { SlashCommandBuilder } = require("discord.js");

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
    await interaction.deferReply();

    const userOption = interaction.options.getUser("user");
    const nicknameOption = interaction.options.getString("nickname");
    const memberToRename = await interaction.member.guild.members.fetch(userOption.id);

    try {

      await memberToRename.setNickname(nicknameOption);
      if (nicknameOption) {
        await interaction.editReply(`Nickname **${nicknameOption}** was given to <@${userOption.id}> by <@${interaction.user.id}>`);
      } else {
        await interaction.editReply(`Nickname of <@${userOption.id}> was reset by <@${interaction.user.id}>`);
      }

    } catch (err) {

      if (err.code === 50013) { // Missing permissions : Roberto role incorrectly placed in role list
        if (interaction.member.guild.ownerId === userOption.id) {
          await interaction.editReply("The command could not be executed - The server owner cannot be renamed by this command");
        } else {
          await interaction.editReply("The command could not be executed - Roberto's role should be placed above all roles of the user to rename in the server's role list");
        }
        return;
      } else {
        throw err;
      }

    }
  },

  usage: `• \`/rename @user <name>\`: gives nickname *name* to user *@user*
• \`/rename @user\`: removes user *@user*'s current nickname

Note : the server owner cannot be renamed by this command`
};
