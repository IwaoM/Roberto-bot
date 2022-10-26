const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { randomTeams, randomDraw } = require("../helpers/misc.helper.js");
const { getVoiceChannelMembers } = require("../helpers/discord.helper.js");

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
    // No specific permission needed

    // return if the caller is not in a voice channel or the channel doesn't have enough members
    const channelMemberNames = getVoiceChannelMembers(interaction.member.voice.channel);
    // channelMemberNames.push("Bob", "Mauricette", "Ricardo", "Bobine"); // used for testing

    if (!channelMemberNames.length) {
      await interaction.reply({ content: "The command could not be executed - you are not connected to a voice channel.", ephemeral: true });
      return;
    }

    if (channelMemberNames.length <= 2) {
      await interaction.reply({ content: "The command could not be executed - not enough members in this voice channel.", ephemeral: true });
      return;
    }

    // get subcommand & init variables
    const subcommand = interaction.options.getSubcommand();
    let text, againButton;

    if (subcommand === "teams") {

      // get & check option values
      const teamsOption = interaction.options.getInteger("teams");
      if (teamsOption >= channelMemberNames.length) {
        await interaction.reply({ content: "The command could not be executed - the number of teams should be less than the channel member count.", ephemeral: true });
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

      text = `Splitting ${channelMemberNames.length} channel members into ${teamsOption} teams:`;
      for (let i = 0; i < teams.length; i++) {
        text += `\n${i + 1}. [**${teams[i].join("** - **")}**]`;
      }

    } else if (subcommand === "draw") {

      // get & check option values
      const drawsOption = interaction.options.getInteger("draws");
      if (drawsOption > channelMemberNames.length) {
        await interaction.reply({ content: "The command could not be executed - the number of draws should be less than or equal to the channel member count.", ephemeral: true });
        return;
      }

      // drawing users
      const numberSample = randomDraw(channelMemberNames.length, drawsOption);
      const sample = [];
      for (let num of numberSample) {
        sample.push(channelMemberNames[num - 1]);
      }

      // create button & text
      againButton = new ButtonBuilder().setCustomId("random-channel_draw_again").setLabel("Draw again").setStyle(ButtonStyle.Primary);

      text = `Drawing ${drawsOption} channel member${drawsOption > 1 ? "s" : ""} among ${channelMemberNames.length} connected users:`;
      text += `\n[**${sample.join("** - **")}**]`;

    }

    const buttonRow = new ActionRowBuilder().addComponents(againButton);
    await interaction.reply({ content: text, components: [buttonRow] });
  },

  async executeButton (interaction) {
    // No specific permission needed

    // return if the user who pressed the button is not the user who called the original command
    if (interaction.user.id !== interaction.message.interaction.user.id) {
      await interaction.reply({ content: "Only the original command caller can use this button.", ephemeral: true });
      return;
    }

    // return if the caller is not in a voice channel or the channel doesn't have enough members
    const channelMemberNames = getVoiceChannelMembers(interaction.member.voice.channel);
    // channelMemberNames.push("Bob", "Mauricette", "Ricardo", "Bobine"); // used for testing

    if (!channelMemberNames.length) {
      await interaction.reply({ content: "The command could not be executed - you are not connected to a voice channel.", ephemeral: true });
      return;
    }

    if (channelMemberNames.length <= 2) {
      await interaction.reply({ content: "The command could not be executed - not enough members in this voice channel.", ephemeral: true });
      return;
    }

    // get the text of the original command reply & init variables
    const replyText = interaction.message.content;
    const replyLines = replyText.split("\n");
    let text;

    if (interaction.customId === "random-channel_teams_again") {

      // get & check option values
      const teamsOption = parseInt(replyLines[0].split(" ")[5]);
      if (teamsOption >= channelMemberNames.length) {
        await interaction.reply({ content: "The command could not be executed - the number of teams should be less than the channel member count.", ephemeral: true });
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

      // create text
      text = `Splitting ${channelMemberNames.length} channel members into ${teamsOption} teams:`;
      for (let i = 0; i < teams.length; i++) {
        text += `\n${i + 1}. [**${teams[i].join("** - **")}**]`;
      }

    } else if (interaction.customId === "random-channel_draw_again") {

      // get & check option values
      const drawsOption = parseInt(replyLines[0].split(" ")[1]);
      if (drawsOption > channelMemberNames.length) {
        await interaction.reply({ content: "The command could not be executed - the number of draws should be less than or equal to the channel member count.", ephemeral: true });
        return;
      }

      // drawing users
      const numberSample = randomDraw(channelMemberNames.length, drawsOption);
      const sample = [];
      for (let num of numberSample) {
        sample.push(channelMemberNames[num - 1]);
      }

      // create button & text
      text = `Drawing ${drawsOption} channel member${drawsOption > 1 ? "s" : ""} among ${channelMemberNames.length} connected users:`;
      text += `\n[**${sample.join("** - **")}**]`;

    }

    await interaction.update(text);
  },

  usage: `• \`/random-channel teams <teams>\`: splits all voice channel members into *teams* teams.
• \`/random-channel draw <draws>\`: draws <draws> members among all users connected to the voice channel.

To use these commands, a user should be connected to a voice channel. The channel also needs to have enough connected members.`
};
