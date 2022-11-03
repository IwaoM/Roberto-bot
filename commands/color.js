const { SlashCommandBuilder } = require("discord.js");
const { randomColor, checkHexCode, getDominantColor } = require("../helpers/color.helper.js");
const { checkOwnMissingPermissions } = require("../helpers/discord.helper.js");
const { updateColorRole } = require("../helpers/processes.helper.js");
const { saveUserAvatar, unlinkFile } = require("../helpers/files.helper.js");
const { logError, logAction, logEvent } = require("../helpers/logs.helper.js");

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
    try {
      const subcommand = interaction.options.getSubcommand();
      let commandOption, commandArgs;
      if (subcommand === "hex") {
        commandOption = interaction.options.getString("hex-code");
        commandArgs = { hexCode: commandOption };
      } else if (subcommand === "dominant") {
        commandOption = interaction.options.getString("type");
        commandArgs = { type: commandOption };
      }

      await logEvent({
        name: "color",
        description: "The color command was called",
        command: commandArgs ?
          { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand, arguments: commandArgs } :
          { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand },
        guild: interaction.guild,
        member: interaction.member
      });

      // before anything else, check if Roberto has the required permissions
      const neededPermissionsForCommand = ["ManageRoles"];
      const missingPermissions = await checkOwnMissingPermissions(interaction.guild, neededPermissionsForCommand);
      if (missingPermissions.length) {
        throw new Error(`Missing permissions - [${neededPermissionsForCommand.join(", ")}]`);
      }

      await interaction.deferReply();

      // get a hex color to apply depending on the subcommand & arguments if any
      let hexCode;
      if (subcommand === "hex") {

        hexCode = checkHexCode(commandOption);
        if (!hexCode) {
          throw new Error(`Invalid hex code - "${commandOption}"`);
        }

      } else if (subcommand === "random") {

        hexCode = randomColor();

      } else if (subcommand === "random-vibrant") {

        hexCode = randomColor(true);

      } else if (subcommand === "dominant") {

        const avatarDir = await saveUserAvatar(interaction.member);
        hexCode = await getDominantColor(commandOption, avatarDir);
        await unlinkFile (avatarDir);

      } else if (subcommand === "remove") {

        hexCode = "none";

      }

      // unassign any previous color, delete the role if not needed anymore
      // assign the new color - use the existing color role if it exists, create a new one otherwise
      const resultRoleId = await updateColorRole(hexCode, interaction.member);

      let sentReply;
      if (resultRoleId === "none") {
        sentReply = await interaction.editReply(`Color was reset for <@${interaction.user.id}>.`);
      } else {
        sentReply = await interaction.editReply(`Color <@&${resultRoleId}> was given to <@${interaction.user.id}>.`);
      }

      await logAction({
        name: `handle color command`,
        command: commandArgs ?
          { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand, arguments: commandArgs } :
          { id: interaction.commandId, name: interaction.commandName, subcommand: subcommand },
        message: sentReply
      });
    } catch (err) {
      await logError({
        name: `config command handler error`,
        description: `Failed to handle the config command`,
        function: { name: `config.execute`, arguments: [...arguments] },
        errorObject: err
      });

      if (err.message.startsWith("Missing permissions")) {
        interaction.reply(`The command could not be executed - missing permissions : ${err.message.split(" - ")[1]}`);
      } else if (err.message.startsWith("Invalid hex code")) {
        await interaction.editReply(`The command could not be executed - ${err.message.split(" - ")[1]} is not a valid hex color code.`);
      } else if (err.message === "Role too low") {
        await interaction.editReply("The command could not be executed - the Roberto managed role should be placed above color roles in the server's role list.");
      } else if (err.message === "Dominant color processing failed") {
        await interaction.editReply("The command could not be executed - dominant color processing failed, please retry later.");
      } else {
        try {
          await interaction.reply("The command could not be executed - unknown error.");
        } catch (e) {
          if (e.code === "InteractionAlreadyReplied") {
            await interaction.editReply("The command could not be executed - unknown error.");
          }
        }
      }

      throw err;
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