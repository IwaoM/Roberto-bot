const { checkHexCode } = require("../helpers/color.helper.js");

module.exports = {
  name: "guildMemberRemove",

  async execute (member, client) {
    // return if the removed member was Roberto themself
    if (member.id === client.user.id) {
      return;
    }

    // prune unused color roles
    const allRoles = await member.guild.roles.fetch();
    const unusedColorRoles = allRoles.filter(role => checkHexCode(role.name, true) && !role.members.size);

    for (let i = 0; i < unusedColorRoles.size; i++) {
      try {
        await unusedColorRoles.at(i).delete();
      } catch (err) {
        if (err.code === 50013) { // Missing permissions : Roberto role incorrectly placed in role list
          console.log(`Failed to delete unused color role [${unusedColorRoles.at(i).name}] - the Roberto role is incorrectly placed in the role list`);
        } else {
          console.log(`Failed to delete unused color role [${unusedColorRoles.at(i).name}] - Unknown error`);
        }
      }
    }
  },
};