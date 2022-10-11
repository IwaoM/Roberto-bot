const { SlashCommandBuilder } = require("discord.js");
const { randomColor, checkHexCode } = require("../helpers/color.helper.js");
const { saveUserAvatar } = require("../helpers/misc.helper.js");
const Vibrant = require("node-vibrant");

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
    console.log(interaction);
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
    } else if (subcommand === "remove") {
      hexCode = "none";
    }

    // #000000 disables name color, we don't want that
    if (hexCode === "#000000") {
      hexCode = "#000001";
    }

    // check client & member top roles
    const userMember = interaction.member;
    const userMemberRoleList = userMember.roles.cache;
    const userMemberTopRole = { name: "", id: "", pos: 0 };
    for (let role of userMemberRoleList.entries()) {
      if (role[1].rawPosition > userMemberTopRole.pos) {
        userMemberTopRole.name = role[1].name;
        userMemberTopRole.id = role[1].id;
        userMemberTopRole.pos = role[1].rawPosition;
      }
    }

    const guildMemberList = await interaction.member.guild.members.fetch();
    const botMember = guildMemberList.get(interaction.applicationId);
    const botMemberRoleList = botMember.roles.cache;
    const botMemberTopRole = { name: "", id: "", pos: 0 };
    for (let role of botMemberRoleList.entries()) {
      if (role[1].rawPosition > botMemberTopRole.pos) {
        botMemberTopRole.name = role[1].name;
        botMemberTopRole.id = role[1].id;
        botMemberTopRole.pos = role[1].rawPosition;
      }
    }

    console.log(userMemberTopRole);
    console.log(botMemberTopRole);

    await interaction.reply(hexCode);
  },

  usage: "bababababa"
};