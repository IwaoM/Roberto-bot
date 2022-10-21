module.exports = {
  name: "interactionCreate",

  async execute (interaction, client) {
    if (interaction.isChatInputCommand()) {

      const command = client.commands.get(interaction.commandName);
      if (!command) { return; }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
      }

    } else if (interaction.isButton()) {

      const relatedCommandName = interaction.message.interaction.commandName.split(" ")[0]; // for commands with subcommands
      const relatedCommand = client.commands.get(relatedCommandName);
      if (!relatedCommand) { return; }

      try {
        await relatedCommand.executeButton(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: "There was an error while executing this button interaction!", ephemeral: true });
      }
    } else if (interaction.isAutocomplete()) {

      const command = client.commands.get(interaction.commandName);
      if (!command) { return; }

      try {
        await command.executeAutocomplete(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: "There was an error while executing this autocompletion!", ephemeral: true });
      }

    } else {
      return;
    }

  },
};
