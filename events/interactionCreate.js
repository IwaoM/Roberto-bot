const { logError, logAction, logEvent } = require("../helpers/logs.helper.js");

module.exports = {
  name: "interactionCreate",

  async execute (interaction, client) {
    try {
      await logEvent({ name: this.name, description: "An interaction was created", guild: interaction.guild, interaction: interaction, member: interaction.member });

      if (interaction.isChatInputCommand()) {

        const command = client.commands.get(interaction.commandName);
        if (!command) {
          return;
        }
        await command.execute(interaction);
        await logAction({ name: `${this.name} event handling`, guild: interaction.guild, interaction: interaction, member: interaction.member });

      } else if (interaction.isButton()) {

        const relatedCommandName = interaction.message.interaction.commandName.split(" ")[0]; // for commands with subcommands
        const relatedCommand = client.commands.get(relatedCommandName);
        if (!relatedCommand) {
          return;
        }
        await relatedCommand.executeButton(interaction);
        await logAction({ name: `${this.name} event handling`, guild: interaction.guild, interaction: interaction, member: interaction.member });

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
