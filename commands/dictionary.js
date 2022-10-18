const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dictionary")
    .setDescription("Searches the definition for a word")
    .addSubcommand(subcommand =>
      subcommand
        .setName("en")
        .setDescription("English dictionary")
        .addStringOption(option => option.setName("word").setDescription("Word to search for").setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("fr")
        .setDescription("French dictionary")
        .addStringOption(option => option.setName("word").setDescription("Word to search for").setRequired(true))
    ),

  async execute (interaction) {
    const subcommand = interaction.options.getSubcommand();
    const commandOption = interaction.options.getString("word");
    if (subcommand === "en") {
      // TODO get english definition
    } else if (subcommand === "fr") {
      // TODO get french definition
    }
  },

  usage: ""
};
