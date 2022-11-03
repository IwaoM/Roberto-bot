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
      await logEvent({
        name: "changelog",
        description: "The changelog command was called",
        command: { id: interaction.commandId, name: interaction.commandName },
        guild: interaction.guild,
        member: interaction.member
      });
      // No specific permission needed

      await interaction.deferReply();

      // get latest release from github
      let latestRelease = await octokit.request("GET /repos/IwaoM/Roberto-bot/releases/latest");

      // Create text & message
      const text = `**${latestRelease.data.tag_name}**\n${latestRelease.data.body}\n\nFull list of releases : https://github.com/IwaoM/Roberto-bot/releases`;
      const sentReply = await interaction.editReply(text);

      await logAction({ name: `changelog command handling`, command: { id: interaction.commandId, name: interaction.commandName }, message: sentReply });
    } catch (err) {
      await logError({
        name: `changelog command handler error`,
        description: `Failed to handle the changelog command`,
        function: { name: `changelog.execute`, arguments: [...arguments] },
        errorObject: err
      });

      try {
        await interaction.reply("The command could not be executed - unknown error.");
      } catch (e) {
        if (e.code === "InteractionAlreadyReplied") {
          await interaction.editReply("The command could not be executed - unknown error.");
        }
      }

      throw err;
    }
  },

  usage: `• \`/changelog\`: gets and displays the changelog of the latest release of Roberto from GitHub.`
};
