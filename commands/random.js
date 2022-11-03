const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { randomDice, randomDraw } = require("../helpers/misc.helper.js");
const { logError, logAction, logEvent } = require("../helpers/logs.helper.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("random")
    .setDescription("Generates random numbers and lists (dice rolls, draws...)")
    .addSubcommand(subcommand =>
      subcommand
        .setName("dice")
        .setDescription("Dice rolls")
        .addIntegerOption(option => option.setName("sides").setDescription("Number of sides of the dice").setRequired(true).setMinValue(2).setMaxValue(1000000))
        .addIntegerOption(option => option.setName("rolls").setDescription("Number of rolls of the dice").setRequired(true).setMinValue(1).setMaxValue(20))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("draw")
        .setDescription("Random draws (sampling without replacement)")
        .addIntegerOption(option => option.setName("total").setDescription("Number of drawable values").setRequired(true).setMinValue(2).setMaxValue(1000000))
        .addIntegerOption(option => option.setName("draws").setDescription("Number of draws").setRequired(true).setMinValue(1).setMaxValue(20))
    ),

  async execute (interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      let commandArgs, sidesOption, rollsOption, totalOption, drawsOption;
      if (subcommand === "dice") {
        // get & check option values
        sidesOption = interaction.options.getInteger("sides");
        rollsOption = interaction.options.getInteger("rolls");
        commandArgs = { sides: sidesOption, rolls: rollsOption };
      } else if (subcommand === "draw") {
        totalOption = interaction.options.getInteger("total");
        drawsOption = interaction.options.getInteger("draws");
        commandArgs = { total: totalOption, draws: drawsOption };
      }

      await logEvent({
        name: "random",
        description: "The random command was called",
        command: { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand, arguments: commandArgs },
        guild: interaction.guild,
        member: interaction.member
      });

      // No specific permission needed

      let text, againButton;

      if (subcommand === "dice") {

        // create button & text
        againButton = new ButtonBuilder().setCustomId("random_dice_again").setLabel("Roll again").setStyle(ButtonStyle.Primary);

        text = `Throwing a ${sidesOption}-sided dice ${rollsOption} times:\n1. [**`;
        const diceResultText = randomDice(sidesOption, rollsOption).join("** - **");
        text += `${diceResultText}**]`; `${diceResultText}**]`;

      } else if (subcommand === "draw") {

        if (drawsOption > totalOption) {
          throw new Error("Draws greater than total");
        }

        // create button & text
        againButton = new ButtonBuilder().setCustomId("random_draw_again").setLabel("Draw again").setStyle(ButtonStyle.Primary);

        text = `Drawing ${drawsOption} values among ${totalOption} total options:\n1. [**`;
        const drawResultText = randomDraw(totalOption, drawsOption).join("** - **");
        text += `${drawResultText}**]`;

      }

      const buttonRow = new ActionRowBuilder().addComponents(againButton);
      const sentReply = await interaction.reply({ content: text, components: [buttonRow] });
      await logAction({
        name: `handle random command`,
        command: { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand, arguments: commandArgs },
        message: sentReply
      });
    } catch (err) {
      await logError({
        name: `random command handler error`,
        description: `Failed to handle the random command`,
        function: { name: `random.execute`, arguments: [...arguments] },
        errorObject: err
      });

      if (err.message === "Draws greater than total") {
        await interaction.reply("The command could not be executed - the number of draws should be less than or equal to the number of drawable values.");
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

      const replyText = interaction.message.content;
      const replyLines = replyText.split("\n");
      const lastLineIndex = parseInt(replyLines[replyLines.length - 1].split(".")[0]);
      if (replyLines.length > 10) {
        replyLines.splice(1, 1);
      }

      let newLineText;
      if (interaction.customId === "random_dice_again") {

        const sidesOption = parseInt(replyLines[0].split(" ")[2].split("-")[0]);
        const rollsOption = parseInt(replyLines[0].split(" ")[4]);
        const diceResultText = randomDice(sidesOption, rollsOption).join("** - **");
        newLineText = `${lastLineIndex + 1}. [**${diceResultText}**]`;

      } else if (interaction.customId === "random_draw_again") {

        const totalOption = parseInt(replyLines[0].split(" ")[4]);
        const drawsOption = parseInt(replyLines[0].split(" ")[1]);
        const drawResultText = randomDraw(totalOption, drawsOption).join("** - **");
        newLineText = `${lastLineIndex + 1}. [**${drawResultText}**]`;

      }

      replyLines.push(newLineText);
      const newText = replyLines.join("\n");

      const sentReply = await interaction.update(newText);
      await logAction({ name: `handle ${interaction.customId} button`, message: sentReply });
    } catch (err) {
      await logError({
        name: `${interaction.customId} button handler error`,
        description: `Failed to handle the ${interaction.customId} button`,
        function: { name: `random.executeButton`, arguments: [...arguments] },
        errorObject: err
      });

      try {
        await interaction.reply("The command could not be executed - unknown error.");
      } catch (e) {
        if (e.code === "InteractionAlreadyReplied") {
          await interaction.editReply("The command could not be executed - unknown error.");
        }
      }

      throw err;
    }
  },

  usage: `• \`/random dice <sides> <rolls>\`: rolls a *sides*-sided dice *rolls* times.
• \`/random draw <total> <draws>\`: draws *draws* values among *total* total options.`
};
