const { SlashCommandBuilder } = require("discord.js");
const { randomColor, checkHexCode, getDominantColor } = require("../helpers/color.helper.js");
const { updateColorRole, checkOwnMissingPermissions } = require("../helpers/discord.helper.js");
const { saveUserAvatar } = require("../helpers/files.helper.js");
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

  async execute (interaction, client, guild) {
    // before anything else, check if Roberto has the required permissions
    const neededPermissions = ["ManageRoles"];
    const missingPermissions = await checkOwnMissingPermissions(client, guild, neededPermissions);
    if (missingPermissions.length) {
      interaction.reply(`The command could not be executed - missing permissions : [${neededPermissions.join(", ")}]`);
      return;
    }

    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();
    let hexCode;

    // get a hex color to apply depending on the subcommand & arguments if any
    if (subcommand === "hex") {

      const commandOption = interaction.options.getString("hex-code");
      hexCode = checkHexCode(commandOption);
      if (!hexCode) {
        await interaction.editReply(`The command could not be executed - "${commandOption}" is not a valid hex color code.`);
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
      // sometimes the dominant color sampler fails
      if (!hexCode) {
        await interaction.editReply({ content: "The command could not be executed - dominant color processing failed, please retry later.", ephemeral: true });
        return;
      }

      await fs.unlink(avatarDir, err => {
        if (err) { throw err; }
      });

    } else if (subcommand === "remove") {

      hexCode = "none";

    }

    try {

      // unassign any previous color, delete the role if not needed anymore
      // assign the new color - use the existing color role if it exists, create a new one otherwise
      const resultRoleId = await updateColorRole(hexCode, interaction.member);

      if (resultRoleId === "none") {
        await interaction.editReply(`Color was reset for <@${interaction.user.id}>.`);
      } else {
        await interaction.editReply(`Color <@&${resultRoleId}> was given to <@${interaction.user.id}>.`);
      }

    } catch (err) {

      if (err.message === "Missing permissions") {
        await interaction.editReply("The command could not be executed - the Roberto managed role should be placed above color roles in the server's role list.");
      } else {
        throw err;
      }

    }
  },

  usage: `• \`/color hex <hex-code>\`: gives your name color *hex-code*.
    • *hex-code* should be a valid hex color code (with or without the \`#\`).
    • 6-characters as well as 3-characters hex color codes are accepted.
    • Example: \`/color hex #ff7f00\`
    • Hex color picker : https://www.w3schools.com/colors/colors_picker.asp
• \`/color random\`: gives your name a random color.
• \`/color random-vibrant\`: gives your name a random vibrant color.
• \`/color dominant <type>\`: gives your name a dominant color from your profile picture.
    • *type* can be either **main**, **dark** or **light**.
• \`/color remove\`: removes your current name color.`
};