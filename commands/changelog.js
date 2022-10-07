const { Collection } = require("discord.js");
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const changelogs = [
  {
    version: "0.0.3",
    description: `Development version
•  More stuff was added
•  Features are still missing though`,
  },
  {
    version: "0.0.2",
    description: `Development version
•  Some stuff was added
•  Better than the previous version`,
  },
  {
    version: "0.0.1",
    description: `Development version
•  Not much to say
•  Stuff will be added later`,
  },
];

// Init collection of interaction IDs & indexes
const changelogIndexes = new Collection();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("changelog")
    .setDescription("Shows the latest changelog for Roberto"),

  async execute (interaction) {

    // Create button row
    const buttonRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("changelog_latest")
          .setLabel("Latest")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("changelog_next")
          .setLabel("Next")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("changelog_previous")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(changelogs.length > 1 ? false : true),
        new ButtonBuilder()
          .setCustomId("changelog_dismiss")
          .setLabel("Dismiss")
          .setStyle(ButtonStyle.Danger)
      );

    // Create text & message
    let text = `**${changelogs[0].version}**\n${changelogs[0].description}`;
    let interactionResponse = await interaction.reply({ content: text, components: [buttonRow] });

    // Store interaction ID & associated index of displayed changelog
    changelogIndexes.set(interactionResponse.id, 0);
  },

  async executeButton (interaction) {

    if (!changelogIndexes.has(interaction.message.interaction.id)) { return; }

    // Get the index of displayed changelog for this interaction's message
    let changelogIndex = changelogIndexes.get(interaction.message.interaction.id);

    if (interaction.customId === "changelog_latest") {
      changelogIndex = 0;
    } else if (interaction.customId === "changelog_next") {
      changelogIndex--;
    } else if (interaction.customId === "changelog_previous") {
      changelogIndex++;
    } else if (interaction.customId === "changelog_dismiss") {
      changelogIndex = -1;
    }

    if (changelogIndex >= 0) { // If clicked button was Latest, Next or Previous
      // Change text
      let newText = `**${changelogs[changelogIndex].version}**\n${changelogs[changelogIndex].description}`;
      changelogIndexes.set(interaction.message.interaction.id, changelogIndex);

      // Change button enablement status
      let oldButtonRow = interaction.message.components[0];
      let updatedLatestButton, updatedNextButton, updatedPreviousButton;

      if (changelogIndex === 0) {
        // enable previous, disable latest & next
        updatedLatestButton = ButtonBuilder.from(oldButtonRow.components[0]).setDisabled(true);
        updatedNextButton = ButtonBuilder.from(oldButtonRow.components[1]).setDisabled(true);
        updatedPreviousButton = ButtonBuilder.from(oldButtonRow.components[2]).setDisabled(false);
      } else if (changelogIndex === changelogs.length - 1) {
        // enable latest & next, disable previous
        updatedLatestButton = ButtonBuilder.from(oldButtonRow.components[0]).setDisabled(false);
        updatedNextButton = ButtonBuilder.from(oldButtonRow.components[1]).setDisabled(false);
        updatedPreviousButton = ButtonBuilder.from(oldButtonRow.components[2]).setDisabled(true);
      } else {
        // enable all
        updatedLatestButton = ButtonBuilder.from(oldButtonRow.components[0]).setDisabled(false);
        updatedNextButton = ButtonBuilder.from(oldButtonRow.components[1]).setDisabled(false);
        updatedPreviousButton = ButtonBuilder.from(oldButtonRow.components[2]).setDisabled(false);
      }
      const dismissButton = ButtonBuilder.from(oldButtonRow.components[3]);

      // New button row
      const newButtonRow = new ActionRowBuilder().addComponents(updatedLatestButton, updatedNextButton, updatedPreviousButton, dismissButton);

      // Update message
      await interaction.update({ content: newText, components: [newButtonRow] });

    } else { // If clicked button was Dismiss

      // delete the message & collection entry
      await interaction.message.delete();
      changelogIndexes.delete(interaction.message.interaction.id);

    }

  },
};
