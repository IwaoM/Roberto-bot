const { checkHexCode } = require("../helpers/color.helper.js");
const { logError, logAction, logEvent } = require("../helpers/logs.helper.js");

module.exports = {
  name: "guildMemberRemove",

  async execute (member, client) {
    try {
      await logEvent({ name: this.name, description: "A user left the guild", guild: member.guild, member: member });

      // return if the removed member was Roberto themself
      if (member.id === client.user.id) {
        await logAction({ name: `guild leaving`, guild: member.guild });
        return;
      }

      // prune unused color roles
      const allRoles = await member.guild.roles.fetch();
      const unusedColorRoles = allRoles.filter(role => checkHexCode(role.name, true) && !role.members.size);

      for (let i = 0; i < unusedColorRoles.size; i++) {
        await unusedColorRoles.at(i).delete();
        await logAction({ name: `role deletion`, role: unusedColorRoles.at(i) });
      }

      await logAction({ name: `${this.name} event handling`, guild: member.guild, member: member });
    } catch (err) {
      await logError({
        name: `${this.name} event handler error`,
        description: `Failed to handle the ${this.name} event`,
        function: { name: `${this.name}.execute`, arguments: [...arguments] },
        errorObject: err
      });
    }
  },
};