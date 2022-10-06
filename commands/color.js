const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("color")
		.setDescription("Changes your name's color"),

	async execute(interaction) {
		await interaction.reply("Color");
	},

  usage: "bababababa"
};
