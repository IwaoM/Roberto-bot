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
    const userOption = interaction.options.getUser("user");
    const nicknameOption = interaction.options.getString("nickname");
    const memberToRename = await interaction.member.guild.members.fetch(userOption.id);

    try {

      await memberToRename.setNickname(nicknameOption);
      if (nicknameOption) {
        await interaction.reply(`Nickname **${nicknameOption}** was given to <@${userOption.id}> by <@${interaction.user.id}>`);
      } else {
        await interaction.reply(`Nickname of <@${userOption.id}> was reset by <@${interaction.user.id}>`);
      }

    } catch (err) {

      if (err.code === 50013) { // Missing permissions : Roberto role incorrectly placed in role list
        if (interaction.member.guild.ownerId === userOption.id) {
          await interaction.reply("The command could not be executed - The server owner cannot be renamed by this command");
        } else {
          await interaction.reply("The command could not be executed - Roberto's role should be placed above all roles of the user to rename in the server's role list");
        }
        return;
      } else {
        throw err;
      }

    }
  },

  usage: `• \`/rename @jeanmi foo\`: gives nickname *foo* to user *@jeanmi*
• \`/rename @jeanmi\`: removes user *@jeanmi*'s current nickname

Note : the server owner cannot be renamed by this command`
};
