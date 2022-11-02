const { logError, logAction, logEvent } = require("../helpers/logs.helper.js");

module.exports = {
  name: "interactionCreate",

  async execute (interaction, client) {
    try {
      await logEvent({ name: this.name, description: "An interaction was created", guild: interaction.guild, interaction: interaction, member: interaction.member });

      if (interaction.isChatInputCommand()) {

        const command = client.commands.get(interaction.commandName);
        if (!command) { return; }

        try {
          await command.execute(interaction);
        } catch (error) {
          try {
            await interaction.reply({ content: "The command could not be executed - unknown error.", ephemeral: true });
          } catch (err) {
            if (err.code === "InteractionAlreadyReplied") {
              await interaction.editReply({ content: "The command could not be executed - unknown error.", ephemeral: true });
            }
          }
        }

        await logAction({ name: `handle ${this.name} event`, interaction: interaction });
      } else if (interaction.isButton()) {

        const relatedCommandName = interaction.message.interaction.commandName.split(" ")[0]; // for commands with subcommands
        const relatedCommand = client.commands.get(relatedCommandName);
        if (!relatedCommand) { return; }

        try {
          await relatedCommand.executeButton(interaction);
        } catch (error) {
          try {
            await interaction.reply({ content: "The button interaction could not be executed - unknown error.", ephemeral: true });
          } catch (err) {
            if (err.code === "InteractionAlreadyReplied") {
              await interaction.editReply({ content: "The button interaction could not be executed - unknown error.", ephemeral: true });
            }
          }
        }

        await logAction({ name: `handle ${this.name} event`, interaction: interaction });
      } else {
        return;
      }
    } catch (err) {
      await logError({
        name: `${this.name} event handler error`,
        description: `Failed to handle the ${this.name} event`,
        function: { name: `${this.name}.execute`, arguments: [...arguments] },
        errorObject: err
      });
    }
  },
};
