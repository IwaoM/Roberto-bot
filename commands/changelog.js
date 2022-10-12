const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const changelogs = require("../changelogs.json");
const { getGuildConfigs, updateGuildConfigEntry } = require("../helpers/misc.helper.js")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("changelog")
    .setDescription("Shows the latest changelog for Roberto"),

  async execute (interaction) {
    const guildId = interaction.guild.id;
    let guildConfig, changelogIndexesArray;

    // Create button row
    const latestButton = new ButtonBuilder().setCustomId("changelog_latest").setLabel("Latest").setStyle(ButtonStyle.Primary).setDisabled(true);
    const nextButton = new ButtonBuilder().setCustomId("changelog_next").setLabel("Next").setStyle(ButtonStyle.Secondary).setDisabled(true);
    const previousButton = new ButtonBuilder().setCustomId("changelog_previous").setLabel("Previous").setStyle(ButtonStyle.Secondary).setDisabled(changelogs.length > 1 ? false : true);
    const dismissButton = new ButtonBuilder().setCustomId("changelog_dismiss").setLabel("Dismiss").setStyle(ButtonStyle.Danger);

    const buttonRow = new ActionRowBuilder().addComponents(latestButton, nextButton, previousButton, dismissButton);

    // Create text & message
    let text = `**${changelogs[0].version}**\n${changelogs[0].description}`;
    let interactionResponse = await interaction.reply({ content: text, components: [buttonRow] });

    // Store interaction ID & associated index of displayed changelog
    guildConfig = await getGuildConfigs(guildId);
    changelogIndexesArray = guildConfig.changelogIndexes;
    changelogIndexesArray.push([interactionResponse.id, 0]);
    await updateGuildConfigEntry(guildId, { changelogIndexes: changelogIndexesArray });

    // Schedule button disablement & array entry removal after 10 minutes
    /*
      TODO change changelogIndexes' data structure to include a timestamp, use it to delete old entries instead of a setTimeout()
      Currently, entries that are still in the array when the bot restarts are forgotten by the script and pile up
    */
    await setTimeout(async () => {
      // Disable buttons (excepted Dismiss)
      const disabledButtonRow = new ActionRowBuilder().addComponents(dismissButton);
      const replyMsg = await interaction.fetchReply();
      await interaction.editReply({ content: replyMsg.content, components: [disabledButtonRow] });

      // Delete array entry
      guildConfig = await getGuildConfigs(guildId);
      changelogIndexesArray = guildConfig.changelogIndexes;
      const itemToRemoveIndex = changelogIndexesArray.findIndex(item => item[0] === interactionResponse.id);
      changelogIndexesArray.splice(itemToRemoveIndex, 1);
      await updateGuildConfigEntry(guildId, { changelogIndexes: changelogIndexesArray });
    }, 600000);
  },

  async executeButton (interaction) {
    const guildId = interaction.guild.id;
    let guildConfig, changelogIndexesArray;

    guildConfig = await getGuildConfigs(guildId);
    changelogIndexesArray = guildConfig.changelogIndexes;
    const itemToFindIndex = changelogIndexesArray.findIndex(item => item[0] === interaction.message.interaction.id);
    if (itemToFindIndex === -1) { // if entry was deleted in array
      if (interaction.customId === "changelog_dismiss") { // and clicked button was dismiss
        // Then delete the message
        await interaction.message.delete();
      }
      return;
    }

    // Get the index of displayed changelog for this interaction's message
    let changelogIndex = changelogIndexesArray[itemToFindIndex][1];

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
      changelogIndexesArray[itemToFindIndex][1] = changelogIndex;
      await updateGuildConfigEntry(guildId, { changelogIndexes: changelogIndexesArray });

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
      changelogIndexesArray.splice(itemToFindIndex, 1);
      await updateGuildConfigEntry(guildId, { changelogIndexes: changelogIndexesArray });

    }

  },
};
