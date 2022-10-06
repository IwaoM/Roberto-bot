const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("changelog")
		.setDescription("Shows the latest changelog for Roberto"),

	async execute(interaction) {
		await interaction.reply("Changelog");
	},
};
