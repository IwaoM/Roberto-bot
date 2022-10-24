const { checkHexCode } = require("./color.helper.js");
const { adminRoleName, operatorRoleName } = require("../config.json");

module.exports = {
  async createRobertoRoles (guild, roleNames = "admin operator") {
    const roleIds = {};

    if (roleNames.search("admin") >= 0) {
      const robertoAdminRole = await guild.roles.create({ name: adminRoleName });
      await robertoAdminRole.setPermissions([]);
      await robertoAdminRole.setMentionable(true);
      roleIds.robertoAdminRoleId = robertoAdminRole.id;
    }

    if (roleNames.search("operator") >= 0) {
      const robertoOperatorRole = await guild.roles.create({ name: operatorRoleName });
      await robertoOperatorRole.setPermissions([]);
      await robertoOperatorRole.setMentionable(true);
      roleIds.robertoOperatorRoleId = robertoOperatorRole.id;
    }

    return roleIds;
  },

  async updateColorRole (hexCode, userMember, interaction) {
    if (!hexCode || !userMember) { return false; }

    // #000000 disables name color, we don't want that
    if (hexCode === "#000000") {
      hexCode = "#000001";
    }

    // find any color roles already assigned to user
    const userMemberRoleList = userMember.roles.cache;
    const userMemberColorRoleList = userMemberRoleList.filter(role => checkHexCode(role.name, true));

    // for each found color role
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
            if (interaction) {
              await interaction.editReply("The command could not be executed - Roberto's role should be placed above color roles in the server's role list");
            }
            return false;
          } else {
            throw err;
          }
        }
      }
    }

    if (hexCode !== "none") {
      // check if a color role for hexCode exists
      const guildRoles = await userMember.guild.roles.fetch();
      let wantedColorRole = guildRoles.find(role => role.name === hexCode);

      if (!wantedColorRole) {
        // if not : create it
        wantedColorRole = await userMember.guild.roles.create({ name: hexCode, color: hexCode });
        await wantedColorRole.setPermissions([]);
        await wantedColorRole.setMentionable(true);
      }

      // assign the found or created color role to user
      userMember.roles.add(wantedColorRole);
      if (interaction) {
        await interaction.editReply(`Color <@&${wantedColorRole.id}> was given to <@${interaction.user.id}>`);
      }

    } else if (interaction) {

      await interaction.editReply(`Color was reset for <@${interaction.user.id}>`);

    }
  },

  async getInviterUser (guild, client) {

    // get latest logs and look for Roberto's invite log entry
    let logs = await guild.fetchAuditLogs();
    let botInvites = logs.entries.filter(entry => entry.action === 28);
    let robertoInvite = botInvites.find(entry => entry.target?.id === client.user.id);

    // search through older logs until the wanted log is found or end of logs is reached
    let oldestLog;
    while (!robertoInvite && logs.entries.size === 50) {
      oldestLog = logs.entries.at(49);
      logs = await guild.fetchAuditLogs({ before: oldestLog });
      botInvites = logs.entries.filter(entry => entry.action === 28);
      robertoInvite = botInvites.find(entry => entry.target?.id === client.user.id);
    }

    // return the executor of Roberto's invite (ie the inviter) or false if not found
    if (robertoInvite) {
      return robertoInvite.executor;
    } else {
      return false;
    }

  },

  async dmUsers (text, users) {
    const recipientList = [];

    for (let user of users) {
      if (recipientList.findIndex(elem => elem.id === user.id) === -1) {
        recipientList.push(user);
      }
    }

    for (let recipient of recipientList) {
      const recipientDm = await recipient.createDM();
      recipientDm.send(text);
    }
  },

  checkRoleAssignment (member, roleId) {
    if (!member || !roleId) {
      return false;
    }

    const userRoles = member.roles.cache;
    return userRoles.get(roleId);
  },

  getVoiceChannelMembers (channel) {
    // if argument is null, return
    if (!channel) {
      return [];
    }

    // otherwise, get channel members
    const channelMemberNames = [];
    for (let i = 0; i < channel.members.size; i++) {
      channelMemberNames.push(channel.members.at(i).nickname ? channel.members.at(i).nickname : channel.members.at(i).user.username);
    }

    return channelMemberNames;
  }
};