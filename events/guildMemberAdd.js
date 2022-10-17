const { getGuildConfigs, saveUserAvatar, updateColorRole } = require("../helpers/misc.helper.js");
const { getDominantColor } = require("../helpers/color.helper.js");
const fs = require("node:fs");

module.exports = {
  name: "guildMemberAdd",

  async execute (member) {
    const currentGuildConfig = await getGuildConfigs(member.guild.id);

    // auto color new members
    if (currentGuildConfig.colorNewMembers) {
      const avatarDir = await saveUserAvatar(member);

      const hexCode = await getDominantColor("Vibrant", avatarDir);
      if (!hexCode) {
        await updateColorRole(hexCode, member);
      }

      await fs.unlink(avatarDir, err => {
        if (err) { throw err; }
      });

    }

    // auto greet new members
    if (currentGuildConfig.greetNewMembers) {
      // let's go to mexico
    }
  },
};