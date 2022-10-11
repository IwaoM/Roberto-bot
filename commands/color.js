const { SlashCommandBuilder } = require("discord.js");
const { randomColor, checkHexCode } = require("../helpers/color.helper.js");
const { saveUserAvatar } = require("../helpers/misc.helper.js");
const Vibrant = require("node-vibrant");
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
      const palette = await Vibrant.from(avatarDir).getPalette();
      hexCode = palette[commandOption].hex;
      await fs.unlink(avatarDir, err => {
        if (err) { throw err; }
      });

    } else if (subcommand === "remove") {

      hexCode = "none";

    }

    // #000000 disables name color, we don't want that
    if (hexCode === "#000000") {
      hexCode = "#000001";
    }

    // find any color roles already assigned to user
    const userMember = interaction.member;
    const userMemberRoleList = userMember.roles.cache;
    const userMemberColorRoleList = userMemberRoleList.filter(role => checkHexCode(role.name));

    for (let role of userMemberColorRoleList.entries()) {
      if (role[1].members.size > 1) {
        // remove the color role from the user
        await userMember.roles.remove(role[1]);
      } else {
        // delete role if no one else used it
        try {
          await role[1].delete();
        } catch (err) {
          if (err.code === 50013) { // Missing permissions : Roberto role incorrectly placed in role list
            await interaction.reply("The command could not be executed - Roberto's role should be placed above color roles in the server's role list");
            return;
          } else {
            throw err;
          }
        }
      }
    }

    if (hexCode !== "none") {
      // check if a color role for hexCode exists
      const guildRoles = await interaction.member.guild.roles.fetch();
      let wantedColorRole = guildRoles.find(role => role.name === hexCode);

      if (!wantedColorRole) {
        // if not : create it
        wantedColorRole = await interaction.member.guild.roles.create({ name: hexCode, color: hexCode });
        await wantedColorRole.setPermissions([]);
        await wantedColorRole.setMentionable(true);
      }

      // assign the found or created color role to user
      userMember.roles.add(wantedColorRole);

      await interaction.reply(`Color **<@&${wantedColorRole.id}>** was given to **<@${interaction.user.id}>**`);

    } else {

      await interaction.reply(`Color was reset for **<@${interaction.user.id}>**`);

    }
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

• \`/color remove\`: removes your current name color
`
};