const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("px")
		.setDescription("Writes 'Phoenix'"),

	async execute(interaction) {
		await interaction.reply("Px");
	},

  usage: "pxpxpxpxpxpx"
};
