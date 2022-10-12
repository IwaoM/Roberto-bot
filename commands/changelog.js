const { SlashCommandBuilder } = require("discord.js");
const changelogs = require("../changelogs.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("changelog")
    .setDescription("Shows the latest changelog for Roberto"),

  async execute (interaction) {
    // Create text & message
    const text = `**${changelogs[0].version}**\n${changelogs[0].description}`;
    await interaction.reply(text);
  },
};
