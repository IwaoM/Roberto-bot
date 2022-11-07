const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const HTMLParser = require("node-html-parser");
const { bodyToListFrench, bodyToListEnglish } = require("../helpers/wiktionary.helper.js");
const { trimAll } = require("../helpers/misc.helper.js");
const { logError, logAction, logEvent } = require("../helpers/logs.helper.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dictionary")
    .setDescription("Looks up definitions for a word or expression")
    .addSubcommand(subcommand =>
      subcommand
        .setName("en")
        .setDescription("English dictionary")
        .addStringOption(option => option.setName("word").setDescription("Word to search for").setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("fr")
        .setDescription("French dictionary")
        .addStringOption(option => option.setName("word").setDescription("Word to search for").setRequired(true))
    ),

  async execute (interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      const commandOption = trimAll(interaction.options.getString("word"));
      logEvent({
        name: "dictionary",
        description: "The dictionary command was called",
        command: { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand, arguments: { word: commandOption } },
        guild: interaction.guild,
        member: interaction.member
      });

      // No specific permission needed

      await interaction.deferReply();

      // Search for the word in wiktionary of the chosen language
      let searchData;
      try {
        const searchResponse = await fetch(`http://${subcommand}.wiktionary.org/w/rest.php/v1/search/page?q=${commandOption}&limit=5`);
        searchData = await searchResponse.json();
      } catch (err) {
        throw new Error("Search API error");
      }

      if (!searchData.pages.length) {
        const sentReply = await interaction.editReply(`No results were found for "${commandOption}".`);
        logAction({
          name: `dictionary command handling`,
          command: { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand, arguments: { word: commandOption } },
          message: sentReply
        });
        return;
      }

      const similarKeyPages = searchData.pages.filter (page => page.key.toLowerCase() === searchData.pages[0].key.toLowerCase());

      // choose the result with the same case as the query, or the first result by default
      let indexToGet = 0;
      for (let i = 0; i < similarKeyPages.length; i++) {
        if (similarKeyPages[i].key === commandOption) {
          indexToGet = i;
          break;
        }
      }
      const pageToGet = similarKeyPages[indexToGet];

      // get the corresponding page's html
      let pageHtml;
      try {
        const pageResponse = await fetch(`http://${subcommand}.wiktionary.org/w/rest.php/v1/page/${pageToGet.key}/html`);
        pageHtml = await pageResponse.text();
      } catch (err) {
        throw new Error("Page API error");
      }
      const parsedHtml = HTMLParser.parse(pageHtml);
      const body = parsedHtml.getElementsByTagName("html")[0].getElementsByTagName("body")[0];

      const dictionaryResult = {
        word: pageToGet.title,
        directUrl: `https://${subcommand}.wiktionary.org/wiki/${pageToGet.key}`
      };

      // Parse the HTML body to get relevant info
      if (subcommand === "en") {
        dictionaryResult.language = "en";
        dictionaryResult.resultData = await bodyToListEnglish(body);
      } else if (subcommand === "fr") {
        dictionaryResult.language = "fr";
        dictionaryResult.resultData = await bodyToListFrench(body);
      }

      // construct embed
      const definitionFields = [];
      for (let data of dictionaryResult.resultData) {
        let name = `**${data.title}**`;
        if (data.gender) {
          name += ` - *${data.gender}*`;
        }

        let value = `1. ${data.definitions[0]}`;
        for (let i = 1; i < data.definitions.length; i++) {
          if (`${value}\n${i + 1}. ${data.definitions[i]}`.length <= 1024) {
            value += `\n${i + 1}. ${data.definitions[i]}`;
          } else {
            break;
          }
        }

        definitionFields.push({ name, value });
      }

      const dictionaryEmbed = new EmbedBuilder()
        .setColor(0xe7c78d)
        .setTitle(dictionaryResult.word)
        .setAuthor({ name: "Wiktionary", iconURL: "https://upload.wikimedia.org/wikipedia/meta/6/61/Wiktionary_propsed-smurrayinchester.png" })
        .setDescription(dictionaryResult.directUrl)
        .addFields(...definitionFields);

      const sentReply = await interaction.editReply({ embeds: [dictionaryEmbed] });
      logAction({
        name: `dictionary command handling`,
        command: { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand, arguments: { word: commandOption } },
        message: sentReply
      });
    } catch (err) {
      logError({
        name: `dictionary command handler error`,
        description: `Failed to handle the dictionary command`,
        function: { name: `dictionary.execute`, arguments: [...arguments] },
        errorObject: err
      });

      let replyText = "The command could not be executed - unknown error.";
      if (err.message === "Search API error") {
        replyText = `The command could not be executed - the Wikimedia search API returned an error.`;
      } else if (err.message === "Page API error") {
        replyText = `The command could not be executed - the Wikimedia page fetch API returned an error.`;
      }

      try {
        await interaction.reply(replyText);
      } catch (e) {
        if (e.code === "InteractionAlreadyReplied") {
          await interaction.editReply(replyText);
        }
      }

      throw err;
    }
  },

  usage: `• \`/dictionary [en|fr] <word-or-expr>\`: looks up and returns definitions for *word-or-expr* in the selected language code's dictionary.
    • The returned definition may be trucated - the returned embed also contains a link to the full Wiktionary page for this word or expression.`
};
