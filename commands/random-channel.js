const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { randomTeams, randomDraw } = require("../helpers/misc.helper.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("random-channel")
    .setDescription("Generates random numbers and lists (dice rolls, draws...)")
    .addSubcommand(subcommand =>
      subcommand
        .setName("teams")
        .setDescription("Split channel members into teams")
        .addIntegerOption(option => option.setName("teams").setDescription("Number of teams to create").setRequired(true).setMinValue(2))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("draw")
        .setDescription("Draw one or several channel members")
        .addIntegerOption(option => option.setName("draws").setDescription("Number of members to draw").setRequired(true).setMinValue(1))
    ),

  async execute (interaction) {
    await interaction.deferReply();

    const memberVoiceChannel = await interaction.member.voice.channel;
    if (!memberVoiceChannel) {
      interaction.editReply("You are not connected to a voice channel");
      return;
    }

    const channelMembers = memberVoiceChannel.members;
    if (channelMembers.size <= 1) { // TODO revert to 2
      interaction.editReply("Not enough members in this voice channel");
      return;
    }

    const channelMemberNames = [];
    for (let i = 0; i < channelMembers.size; i++) {
      channelMemberNames.push(channelMembers.at(i).nickname ? channelMembers.at(i).nickname : channelMembers.at(i).user.username);
    }
    channelMemberNames.push("Bob", "Mauricette", "Ricardo", "Bobine", "C3PO"); // TODO remove this

    const subcommand = interaction.options.getSubcommand();
    let text, againButton;

    if (subcommand === "teams") {

      // get & check option values
      const teamsOption = interaction.options.getInteger("teams");
      if (teamsOption >= channelMemberNames.length) {
        interaction.editReply("Invalid number of teams");
        return;
      }

      // creating teams
      const numberTeams = randomTeams(channelMemberNames.length, teamsOption);
      const teams = [];
      for (let numberTeam of numberTeams) {
        const team = [];
        for (let num of numberTeam) {
          team.push(channelMemberNames[num - 1]);
        }
        teams.push(team);
      }

      // create button & text
      againButton = new ButtonBuilder().setCustomId("random-channel_teams_again").setLabel("Generate again").setStyle(ButtonStyle.Primary);

      text = `Splitting channel members into ${teamsOption} teams`;
      for (let i = 0; i < teams.length; i++) {
        text += `\n${i + 1}. [**${teams[i].join("** - **")}**]`;
      }


    } else if (subcommand === "draw") {
      // TODO
    }

    const buttonRow = new ActionRowBuilder().addComponents(againButton);
    await interaction.editReply({ content: text, components: [buttonRow] });
  },

  usage: `• \`/random dice <sides> <rolls>\`: `
};
