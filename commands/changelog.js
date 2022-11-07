const { SlashCommandBuilder } = require("discord.js");
const { OctokitToken } = require("../config.json");
const { Octokit } = require("octokit");
const { logError, logAction, logEvent } = require("../helpers/logs.helper.js");

const octokit = new Octokit({ auth: OctokitToken });

module.exports = {
  data: new SlashCommandBuilder()
    .setName("changelog")
    .setDescription("Shows the latest changelog for Roberto"),

  async execute (interaction) {
    try {
      logEvent({
        name: "changelog",
        description: "The changelog command was called",
        command: { id: interaction.commandId, name: interaction.commandName },
        guild: interaction.guild,
        member: interaction.member
      });
      // No specific permission needed

      await interaction.deferReply();

      // get latest release from github
      let latestRelease;
      try {
        latestRelease = await octokit.request("GET /repos/IwaoM/Roberto-bot/releases/latest");
      } catch (err) {
        throw new Error("github API error");
      }

      // Create text & message
      if (!latestRelease.data) {
        const sentReply = await interaction.editReply(`No releases were found.`);
        logAction({ name: `changelog command handling`, command: { id: interaction.commandId, name: interaction.commandName }, message: sentReply });
      }
      const text = `**${latestRelease.data.tag_name}**\n${latestRelease.data.body}\n\nFull list of releases : https://github.com/IwaoM/Roberto-bot/releases`;
      const sentReply = await interaction.editReply(text);

      logAction({ name: `changelog command handling`, command: { id: interaction.commandId, name: interaction.commandName }, message: sentReply });
    } catch (err) {
      logError({
        name: `changelog command handler error`,
        description: `Failed to handle the changelog command`,
        function: { name: `changelog.execute`, arguments: [...arguments] },
        errorObject: err
      });

      let replyText = "The command could not be executed - unknown error.";
      if (err.message === "github API error") {
        replyText = `The command could not be executed - the GitHub API returned an error.`;
      }

      try {
        await interaction.editReply(replyText);
      } catch (e) {
        if (e.code === "InteractionNotReplied") {
          await interaction.reply(replyText);
        }
      }

      throw err;
    }
  },

  usage: `• \`/changelog\`: gets and displays the changelog of the latest release of Roberto from GitHub.`
};
