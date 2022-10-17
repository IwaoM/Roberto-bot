const { checkHexCode } = require("../helpers/color.helper.js");

module.exports = {
  name: "guildMemberRemove",

  async execute (member) {
    // prune unused color roles
    const allRoles = await member.guild.roles.fetch();
    const unusedColorRoles = allRoles.filter(role => checkHexCode(role.name, true) && !role.members.size);

    for (let i = 0; i < unusedColorRoles.size; i++) {
      try {
        await unusedColorRoles.at(i).delete();
      } catch (err) {
        if (err.code === 50013) { // Missing permissions : Roberto role incorrectly placed in role list
          return false;
        } else {
          throw err;
        }
      }
    }
  },
};