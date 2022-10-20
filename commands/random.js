const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("random")
    .setDescription("Generate random numbers and lists (dice rolls, draws...)")
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
      for (let i = 0; i < rollsOption; i++) {
        if (i > 0) {
          text += "** - **";
        }
        text += Math.ceil(Math.random() * sidesOption);
      }
      text += "**]";

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
      const pool = [];
      for (let i = 0; i < totalOption; i++) {
        pool.push(i + 1);
      }
      for (let i = 0; i < drawsOption; i++) {
        const drawIndex = Math.floor(Math.random() * pool.length);
        if (i > 0) {
          text += "** - **";
        }
        text += pool[drawIndex];
        pool.splice(drawIndex, 1);
      }
      text += "**]";

    }

    const buttonRow = new ActionRowBuilder().addComponents(againButton);

    await interaction.reply({ content: text, components: [buttonRow] });
  },

  async executeButton (interaction) {
    const name = "";
    await interaction.update(name);
  },

  usage: `• \`/random\`: `
};
