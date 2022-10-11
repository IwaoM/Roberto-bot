const { SlashCommandBuilder } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

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
    let answer;
    const commandOption = interaction.options.getString("command");

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
      answer = `List of available commands : \n• \`/${commandNames.join("`\n•  `/")}\``;

    }

    await interaction.reply(answer);
  },
};

