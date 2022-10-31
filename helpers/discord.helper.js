const { adminRoleName } = require("../config.json");

module.exports = {
  async createRobertoAdminRole (guild) {
    const roleIds = {};

    const robertoAdminRole = await guild.roles.create({ name: adminRoleName });
    await robertoAdminRole.setPermissions([]);
    await robertoAdminRole.setMentionable(true);
    roleIds.robertoAdminRoleId = robertoAdminRole.id;

    return roleIds;
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

    // return the executor of Roberto's invite (ie the inviter) or null if not found
    if (robertoInvite) {
      return robertoInvite.executor;
    } else {
      return null;
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
      try {
        const recipientDm = await recipient.createDM();
        await recipientDm.send(text);
      } catch (err) {
        if (err.code === 50007) {
          throw new Error("Cannot message this user");
        } else {
          throw new Error("Unknown error");
        }
      }
    }

    // if all DMs succeeded, return the number of sent DMs
    return recipientList.length;
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
  },

  async checkOwnMissingPermissions (guild, missingPermissions) {
    missingPermissions = [...missingPermissions]; // copying the array instead of altering the argument
    const ownPermissions = (await guild.members.me).permissions.toArray();
    for (let permission of ownPermissions) {
      if (missingPermissions.indexOf(permission) >= 0) {
        missingPermissions.splice(missingPermissions.indexOf(permission), 1); // if permission is found, remove from missing permissions
      }
    }
    return missingPermissions;
  },

  async getPermissionUpdaterUser (oldElem, newElem, eventType) {
    // newElem & oldElem can be either roles (for events roleUpdate & roleDelete) or members (for event guildMemberUpdate)

    // get latest logs and look for role update or delete
    let logs = await newElem.guild.fetchAuditLogs();
    let permissionUpdateLogList, thisPermissionUpdate;

    if (eventType === "roleUpdate") {

      // find the log of the change that gave the edited role exactly newElem's permissions
      permissionUpdateLogList = logs.entries.filter(entry => entry.action === 31 && entry.target?.id === newElem.id);
      thisPermissionUpdate = permissionUpdateLogList.find(entry => newElem.permissions.equals(entry.changes.find(change => change.key === "permissions").new));

    } else if (eventType === "guildMemberUpdate") {

      // find the log of the change that added or removed the difference between oldElem's and newElem's roles to Roberto
      permissionUpdateLogList = logs.entries.filter(entry => entry.action === 25 && entry.target?.id === newElem.id);
      thisPermissionUpdate = permissionUpdateLogList.find(entry => {
        if (entry.changes[0].key === "$add") {
          // check that added role is in newElem and not in oldElem
          return newElem.roles.cache.has(entry.changes[0].new[0].id) && !oldElem.roles.cache.has(entry.changes[0].new[0].id);
        } else if (entry.changes[0].key === "$remove") {
          // check that removed role is in oldElem and not in newElem
          return oldElem.roles.cache.has(entry.changes[0].new[0].id) && !newElem.roles.cache.has(entry.changes[0].new[0].id);
        }
        return false;
      });

    }

    // search through older logs until the wanted log is found or end of logs is reached
    let oldestLog;
    while (!thisPermissionUpdate && logs.entries.size === 50) {
      oldestLog = logs.entries.at(49);
      logs = await newElem.guild.fetchAuditLogs({ before: oldestLog });

      if (eventType === "roleUpdate") {

        permissionUpdateLogList = logs.entries.filter(entry => entry.action === 31 && entry.target?.id === newElem.id);
        thisPermissionUpdate = permissionUpdateLogList.find(entry => newElem.permissions.equals(entry.changes.find(change => change.key === "permissions").new));

      } else if (eventType === "guildMemberUpdate") {

        permissionUpdateLogList = logs.entries.filter(entry => entry.action === 25 && entry.target?.id === newElem.id);
        thisPermissionUpdate = permissionUpdateLogList.find(entry => {
          if (entry.changes[0].key === "$add") {
            return newElem.roles.cache.has(entry.changes[0].new[0].id) && !oldElem.roles.cache.has(entry.changes[0].new[0].id);
          } else if (entry.changes[0].key === "$remove") {
            return oldElem.roles.cache.has(entry.changes[0].new[0].id) && !newElem.roles.cache.has(entry.changes[0].new[0].id);
          }
          return false;
        });

      }
    }

    // return the executor of the role update or null if not found
    if (thisPermissionUpdate) {
      return thisPermissionUpdate.executor;
    } else {
      return null;
    }

  },
};