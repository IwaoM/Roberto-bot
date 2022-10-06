const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Shows informations about available commands"),
	async execute(interaction) {
		await interaction.reply("Help");
	},
};
