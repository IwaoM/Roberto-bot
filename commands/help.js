const { SlashCommandBuilder } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const { logError, logAction, logEvent } = require("../helpers/logs.helper.js");

// Construct list of choices for command argument
const optionChoices = [];
const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith(".js")).filter(file => file !== "help.js");

for (let file of commandFiles) {
  const filePath = path.join(__dirname, file);
  const command = require(filePath);
  optionChoices.push({ name: command.data.name, value: command.data.name });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shows information about available commands")
    .addStringOption(option =>
      option.setName("command")
        .setDescription("The command you need help with (leave empty for a list of all commands)")
        .addChoices(...optionChoices)
    ),

  async execute (interaction) {
    try {
      const commandOption = interaction.options.getString("command");
      logEvent({
        name: "help",
        description: "The help command was called",
        command: commandOption ?
          { id: interaction.commandId, name: interaction.commandName, arguments: { command: commandOption } } :
          { id: interaction.commandId, name: interaction.commandName },
        guild: interaction.guild,
        member: interaction.member
      });

      // No specific permission needed

      let answer;
      if (commandOption) { // If an argument was provided

        // Send the command name, description & usage
        const command = interaction.client.commands.get(commandOption);
        answer = `- **${commandOption}** -`;
        if (command.data.description) {
          answer += `\n\n${command.data.description}`;
        }
        if (command.usage) {
          answer += `\n\n${command.usage}`;
        }

      } else { // If no argument was provided

        // List all available commands
        const commandNames = optionChoices.map(command => command.name);
        answer = `List of available commands : \n• \`/${commandNames.join("`\n• `/")}\``;

      }

      const sentReply = await interaction.reply(answer);
      logAction({
        name: `help command handling`,
        command: commandOption ?
          { id: interaction.commandId, name: interaction.commandName, arguments: { command: commandOption } } :
          { id: interaction.commandId, name: interaction.commandName },
        message: sentReply
      });
    } catch (err) {
      logError({
        name: `help command handler error`,
        description: `Failed to handle the help command`,
        function: { name: `help.execute`, arguments: [...arguments] },
        errorObject: err
      });

      let replyText = "The command could not be executed - unknown error.";

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
};

