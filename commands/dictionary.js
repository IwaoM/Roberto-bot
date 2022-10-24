const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const HTMLParser = require("node-html-parser");
const { bodyToListFrench, bodyToListEnglish } = require("../helpers/wiktionary.helper.js");
const { trimAll } = require("../helpers/misc.helper.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dictionary")
    .setDescription("Looks up definitions for a word")
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
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();
    const commandOption = trimAll(interaction.options.getString("word"));

    // Search for the word in wiktionary of the chosen language
    const searchResponse = await fetch(`http://${subcommand}.wiktionary.org/w/rest.php/v1/search/page?q=${commandOption}&limit=5`);
    const searchData = await searchResponse.json();

    if (!searchData.pages.length) {
      await interaction.editReply(`No results were found for "${commandOption}".`);
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
    const pageResponse = await fetch(`http://${subcommand}.wiktionary.org/w/rest.php/v1/page/${pageToGet.key}/html`);
    const pageHtml = await pageResponse.text();
    const parsedHtml = HTMLParser.parse(pageHtml);
    const body = parsedHtml.getElementsByTagName("html")[0].getElementsByTagName("body")[0];

    const dictionaryResult = {
      word: pageToGet.title,
      directUrl: `https://${subcommand}.wiktionary.org/wiki/${pageToGet.key}`
    };

    // Parse the HTML body to get relevant info
    if (subcommand === "en") {
      dictionaryResult.language = "en";
      dictionaryResult.resultData = bodyToListEnglish(body);
    } else if (subcommand === "fr") {
      dictionaryResult.language = "fr";
      dictionaryResult.resultData = bodyToListFrench(body);
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

    await interaction.editReply({ embeds: [dictionaryEmbed] });
  },

  usage: `• \`/dictionary [en|fr] <word>\`: looks up and returns definitions for *word* in the selected language code's dictionary.
    • The returned definition may be trucated - the returned embed also contains a link to the full Wiktionary page for this word.`
};
