const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { generatePhoenix } = require("../helpers/misc.helper.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("px")
    .setDescription("Alternate ways to spell the name of that fire guy in Valorant"),

  async execute (interaction) {
    // No specific permission needed

    const againButton = new ButtonBuilder().setCustomId("px_again").setLabel("Again!").setStyle(ButtonStyle.Primary);
    const buttonRow = new ActionRowBuilder().addComponents(againButton);

    let name = generatePhoenix();
    await interaction.reply({ content: name, components: [buttonRow] });
  },

  async executeButton (interaction) {
    // No specific permission needed

    // return if the user who pressed the button is not the user who called the original command
    if (interaction.user.id !== interaction.message.interaction.user.id) {
      await interaction.reply({ content: "Only the original command caller can use this button.", ephemeral: true });
      return;
    }

    const name = generatePhoenix();
    await interaction.update(name);
  },

  usage: `• \`/px\`: generates a new variant of the name.
    • Tap the *Again!* button to regenerate.`
};
