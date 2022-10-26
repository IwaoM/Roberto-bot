module.exports = {
  name: "interactionCreate",

  async execute (interaction, client) {
    if (interaction.isChatInputCommand()) {

      const command = client.commands.get(interaction.commandName);
      if (!command) { return; }

      try {
        await command.execute(interaction, client, interaction.guild);
      } catch (error) {
        console.error(error);
        try {
          await interaction.reply({ content: "The command could not be executed - unknown error.", ephemeral: true });
        } catch (err) {
          if (err.code === "InteractionAlreadyReplied") {
            await interaction.editReply({ content: "The command could not be executed - unknown error.", ephemeral: true });
          }
        }
      }

    } else if (interaction.isButton()) {

      const relatedCommandName = interaction.message.interaction.commandName.split(" ")[0]; // for commands with subcommands
      const relatedCommand = client.commands.get(relatedCommandName);
      if (!relatedCommand) { return; }

      try {
        await relatedCommand.executeButton(interaction);
      } catch (error) {
        console.error(error);
        try {
          await interaction.reply({ content: "The button interaction could not be executed - unknown error.", ephemeral: true });
        } catch (err) {
          if (err.code === "InteractionAlreadyReplied") {
            await interaction.editReply({ content: "The button interaction could not be executed - unknown error.", ephemeral: true });
          }
        }
      }
    } else if (interaction.isAutocomplete()) {

      const command = client.commands.get(interaction.commandName);
      if (!command) { return; }

      try {
        await command.executeAutocomplete(interaction);
      } catch (error) {
        console.error(error);
        try {
          await interaction.reply({ content: "The autocompletion could not be executed - unknown error.", ephemeral: true });
        } catch (err) {
          if (err.code === "InteractionAlreadyReplied") {
            await interaction.editReply({ content: "The autocompletion could not be executed - unknown error.", ephemeral: true });
          }
        }
      }

    } else {
      return;
    }

  },
};
