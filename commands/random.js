const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { randomDice, randomDraw } = require("../helpers/misc.helper.js");

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
    const subcommand = interaction.options.getSubcommand();
    let text, againButton;

    if (subcommand === "dice") {

      // get & check option values
      const sidesOption = interaction.options.getInteger("sides");
      const rollsOption = interaction.options.getInteger("rolls");

      // create button & text
      againButton = new ButtonBuilder().setCustomId("random_dice_again").setLabel("Roll again").setStyle(ButtonStyle.Primary);

      text = `Throwing a ${sidesOption}-sided dice ${rollsOption} times:\n1. [**`;
      const diceResultText = randomDice(sidesOption, rollsOption).join("** - **");
      text += `${diceResultText}**]`; `${diceResultText}**]`;

    } else if (subcommand === "draw") {

      // get & check option values
      const totalOption = interaction.options.getInteger("total");
      const drawsOption = interaction.options.getInteger("draws");

      if (drawsOption > totalOption) {
        interaction.reply("The number of draws is invalid - it should be below or equal to the number of drawable values");
        return;
      }

      // create button & text
      againButton = new ButtonBuilder().setCustomId("random_draw_again").setLabel("Draw again").setStyle(ButtonStyle.Primary);

      text = `Drawing ${drawsOption} values among ${totalOption} total options:\n1. [**`;
      const drawResultText = randomDraw(totalOption, drawsOption).join("** - **");
      text += `${drawResultText}**]`;

    }

    const buttonRow = new ActionRowBuilder().addComponents(againButton);
    await interaction.reply({ content: text, components: [buttonRow] });
  },

  async executeButton (interaction) {
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

    await interaction.update(newText);
  },

  usage: `• \`/random dice <sides> <rolls>\`: rolls a *sides*-sided dice *rolls* times.
• \`/random draw <total> <draws>\`: draws *draws* values among *total* total options.`
};
