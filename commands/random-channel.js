const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { randomTeams, randomDraw } = require("../helpers/misc.helper.js");
const { getVoiceChannelMembers } = require("../helpers/discord.helper.js");
const { logError, logAction, logEvent } = require("../helpers/logs.helper.js");

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
    try {
      const subcommand = interaction.options.getSubcommand();
      await logEvent({
        name: "random-channel",
        description: "The random-channel command was called",
        command: { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand },
        guild: interaction.guild,
        member: interaction.member
      });

      // No specific permission needed

      // return if the caller is not in a voice channel or the channel doesn't have enough members
      const channelMemberNames = await getVoiceChannelMembers(interaction.member.voice.channel);
      // channelMemberNames.push("Bob", "Mauricette", "Ricardo", "Bobine"); // used for testing

      if (!channelMemberNames.length) {
        throw new Error("Not connected to voice");
      }

      if (channelMemberNames.length <= 2) {
        throw new Error("Not enough connected members");
      }

      // get subcommand & init variables
      let text, againButton;

      if (subcommand === "teams") {

        // get & check option values
        const teamsOption = interaction.options.getInteger("teams");
        if (teamsOption >= channelMemberNames.length) {
          throw new Error("Number of teams is too big");
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
          throw new Error("Number of draws is too big");
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
      const sentReply = await interaction.reply({ content: text, components: [buttonRow] });
      await logAction({
        name: `handle random-channel command`,
        command: { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand },
        message: sentReply
      });
    } catch (err) {
      await logError({
        name: `random-channel command handler error`,
        description: `Failed to handle the random-channel command`,
        function: { name: `random-channel.execute`, arguments: [...arguments] },
        errorObject: err
      });

      if (err.message === "Not connected to voice") {
        await interaction.editReply(`The command could not be executed - you are not connected to a voice channel.`);
      } else if (err.message === "Not enough connected members") {
        await interaction.editReply(`The command could not be executed - not enough members in this voice channel.`);
      } else if (err.message === "Number of teams is too big") {
        await interaction.editReply(`The command could not be executed - the number of teams should be less than the channel member count.`);
      } else if (err.message === "Number of draws is too big") {
        await interaction.editReply(`The command could not be executed - the number of draws should be less than or equal to the channel member count.`);
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

  async executeButton (interaction) {
    try {
      await logEvent({
        name: interaction.customId,
        description: `The ${interaction.customId} button was pressed`,
        guild: interaction.guild,
        member: interaction.member
      });

      // No specific permission needed

      // return if the user who pressed the button is not the user who called the original command
      if (interaction.user.id !== interaction.message.interaction.user.id) {
        const sentReply = await interaction.reply({ content: "Only the original command caller can use this button.", ephemeral: true });
        await logAction({ name: `handle ${interaction.customId} button`, message: sentReply });
        return;
      }

      // return if the caller is not in a voice channel or the channel doesn't have enough members
      const channelMemberNames = await getVoiceChannelMembers(interaction.member.voice.channel);
      // channelMemberNames.push("Bob", "Mauricette", "Ricardo", "Bobine"); // used for testing

      if (!channelMemberNames.length) {
        throw new Error("Not connected to voice");
      }

      if (channelMemberNames.length <= 2) {
        throw new Error("Not enough connected members");
      }

      // get the text of the original command reply & init variables
      const replyText = interaction.message.content;
      const replyLines = replyText.split("\n");
      let text;

      if (interaction.customId === "random-channel_teams_again") {

        // get & check option values
        const teamsOption = parseInt(replyLines[0].split(" ")[5]);
        if (teamsOption >= channelMemberNames.length) {
          throw new Error("Number of teams is too big");
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
          throw new Error("Number of draws is too big");
        }

        // drawing users
        const numberSample = randomDraw(channelMemberNames.length, drawsOption);
        const sample = [];
        for (let num of numberSample) {
          sample.push(channelMemberNames[num - 1]);
        }

        // create text
        text = `Drawing ${drawsOption} channel member${drawsOption > 1 ? "s" : ""} among ${channelMemberNames.length} connected users:`;
        text += `\n[**${sample.join("** - **")}**]`;

      }

      const sentReply = await interaction.update(text);
      await logAction({ name: `handle ${interaction.customId} button`, message: sentReply });
    } catch (err) {
      await logError({
        name: `${interaction.customId} button handler error`,
        description: `Failed to handle the ${interaction.customId} button interaction`,
        function: { name: `random-channel.executeButton`, arguments: [...arguments] },
        errorObject: err
      });

      if (err.message === "Not connected to voice") {
        await interaction.reply(`The command could not be executed - you are not connected to a voice channel.`);
      } else if (err.message === "Not enough connected members") {
        await interaction.reply(`The command could not be executed - not enough members in this voice channel.`);
      } else if (err.message === "Number of teams is too big") {
        await interaction.reply(`The command could not be executed - the number of teams should be less than the channel member count.`);
      } else if (err.message === "Number of draws is too big") {
        await interaction.reply(`The command could not be executed - the number of draws should be less than or equal to the channel member count.`);
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

  usage: `• \`/random-channel teams <teams>\`: splits all voice channel members into *teams* teams.
• \`/random-channel draw <draws>\`: draws <draws> members among all users connected to the voice channel.

To use these commands, a user should be connected to a voice channel. The channel also needs to have enough connected members.`
};
