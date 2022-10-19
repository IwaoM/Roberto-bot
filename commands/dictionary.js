const { SlashCommandBuilder } = require("discord.js");
const HTMLParser = require("node-html-parser");
const { bodyToJsonFrench } = require("../helpers/wiktionary.helper.js");
const { trimAll } = require("../helpers/misc.helper.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dictionary")
    .setDescription("Searches the definition for a word")
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
      // TODO get english definition
    } else if (subcommand === "fr") {
      // TODO get french definition
      dictionaryResult.resultData = bodyToJsonFrench(body);
      console.log(dictionaryResult);
    }

    await interaction.editReply(commandOption);
  },

  usage: ""
};
