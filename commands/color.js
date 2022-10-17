const { SlashCommandBuilder } = require("discord.js");
const { randomColor, checkHexCode, getDominantColor } = require("../helpers/color.helper.js");
const { saveUserAvatar, updateColorRole } = require("../helpers/misc.helper.js");
const fs = require("node:fs");

const dominantChoices = [
  { name: "main", value: "Vibrant" },
  { name: "dark", value: "DarkVibrant" },
  { name: "light", value: "LightVibrant" }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("color")
    .setDescription("Changes your name's color")
    .addSubcommand(subcommand =>
      subcommand
        .setName("hex")
        .setDescription("Changes your color - manually enter a hex color code")
        .addStringOption(option => option.setName("hex-code").setDescription("Hex color code").setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("random")
        .setDescription("Changes your color - random color")
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("random-vibrant")
        .setDescription("Changes your color - random vibrant color")
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("dominant")
        .setDescription("Changes your color - dominant color from your profile picture")
        .addStringOption(option => option.setName("type").setDescription("Dominant color type").setRequired(true).addChoices(...dominantChoices))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("remove")
        .setDescription("Removes your currently assigned color")
    ),

  async execute (interaction) {
    const subcommand = interaction.options.getSubcommand();
    let hexCode;

    // get a hex color to apply depending on the subcommand & arguments if any
    if (subcommand === "hex") {

      const commandOption = interaction.options.getString("hex-code");
      hexCode = checkHexCode(commandOption);
      if (!hexCode) {
        await interaction.reply(`**${commandOption}** is not a valid hex color code.`);
        return;
      }

    } else if (subcommand === "random") {

      hexCode = randomColor();

    } else if (subcommand === "random-vibrant") {

      hexCode = randomColor(true);

    } else if (subcommand === "dominant") {

      const commandOption = interaction.options.getString("type");
      const avatarDir = await saveUserAvatar(interaction.member);

      hexCode = await getDominantColor(commandOption, avatarDir);
      if (!hexCode) {
        await interaction.reply({ content: "Dominant color processing failed - please retry later", ephemeral: true });
        return;
      }

      await fs.unlink(avatarDir, err => {
        if (err) { throw err; }
      });

    } else if (subcommand === "remove") {

      hexCode = "none";

    }

    await updateColorRole(hexCode, interaction.member, interaction);
  },

  usage: `• \`/color hex <hex-code>\`: gives your name color *hex-code*
    • *hex-code* should be a valid hex color code (with or without the \`#\`)
    • 6-characters as well as 3-characters hex color codes are accepted
    • Example: \`/color hex #ff7f00\`
    • Hex color picker : https://www.w3schools.com/colors/colors_picker.asp

• \`/color random\`: gives your name a random color

• \`/color random-vibrant\`: gives your name a random vibrant color

• \`/color dominant <type>\`: gives your name a dominant color from your profile picture
    • *type* can be either **main**, **dark** or **light**

• \`/color remove\`: removes your current name color`
};