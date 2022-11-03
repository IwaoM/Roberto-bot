const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { generatePhoenix } = require("../helpers/misc.helper.js");
const { logError, logAction, logEvent } = require("../helpers/logs.helper.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("px")
    .setDescription("Alternate ways to spell the name of that fire guy in Valorant"),

  async execute (interaction) {
    try {
      await logEvent({
        name: "px",
        description: "The px command was called",
        command: { id: interaction.commandId, name: interaction.commandName },
        guild: interaction.guild,
        member: interaction.member
      });
      // No specific permission needed

      const againButton = new ButtonBuilder().setCustomId("px_again").setLabel("Again!").setStyle(ButtonStyle.Primary);
      const buttonRow = new ActionRowBuilder().addComponents(againButton);

      let name = generatePhoenix();
      const sentReply = await interaction.reply({ content: name, components: [buttonRow] });
      await logAction({
        name: `px command handling`,
        command: { id: interaction.commandId, name: interaction.commandName },
        message: sentReply
      });
    } catch (err) {
      await logError({
        name: `px command handler error`,
        description: `Failed to handle the px command`,
        function: { name: `px.execute`, arguments: [...arguments] },
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

  async executeButton (interaction) {
    try {
      await logEvent({
        name: "px_again",
        description: "The px_again button was pressed",
        guild: interaction.guild,
        member: interaction.member
      });

      // No specific permission needed

      // return if the user who pressed the button is not the user who called the original command
      if (interaction.user.id !== interaction.message.interaction.user.id) {
        const sentReply = await interaction.reply({ content: "Only the original command caller can use this button.", ephemeral: true });
        await logAction({ name: `px_again button handling`, message: sentReply });
        return;
      }

      const name = generatePhoenix();
      const sentReply = await interaction.update(name);
      await logAction({ name: `px_again button handling`, message: sentReply });
    } catch (err) {
      await logError({
        name: `px_again button handler error`,
        description: `Failed to handle the px_again button interaction`,
        function: { name: `px.executeButton`, arguments: [...arguments] },
        errorObject: err
      });

      try {
        await interaction.reply("The button interaction could not be executed - unknown error.");
      } catch (e) {
        if (e.code === "InteractionAlreadyReplied") {
          await interaction.editReply("The button interaction could not be executed - unknown error.");
        }
      }

      throw err;
    }
  },

  usage: `• \`/px\`: generates a new variant of the name.
    • Tap the *Again!* button to regenerate.`
};
