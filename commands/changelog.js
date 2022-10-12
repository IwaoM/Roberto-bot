const { SlashCommandBuilder } = require("discord.js");
const { OctokitToken } = require("../config.json");
const { Octokit } = require("octokit");

const octokit = new Octokit({ auth: OctokitToken });

module.exports = {
  data: new SlashCommandBuilder()
    .setName("changelog")
    .setDescription("Shows the latest changelog for Roberto"),

  async execute (interaction) {
    // get latest release from github
    let latestRelease = await octokit.request("GET /repos/IwaoM/Roberto-bot/releases/latest");

    // Create text & message
    const text = `**${latestRelease.data.tag_name}**\n${latestRelease.data.body}\n\nFull list of releases : https://github.com/IwaoM/Roberto-bot/releases`;
    await interaction.reply(text);
  },
};
