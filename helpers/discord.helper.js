const { adminRoleName } = require("../publicConfig.js");
const { logError, logAction } = require("../helpers/logs.helper.js");

module.exports = {
  async createRobertoAdminRole (guild) {
    try {
      const roleIds = {};

      let robertoAdminRole = await guild.roles.create({ name: adminRoleName });
      logAction({ name: "role creation", guild: guild, role: robertoAdminRole });
      robertoAdminRole = await robertoAdminRole.setPermissions([]);
      logAction({ name: "role update", guild: guild, role: robertoAdminRole });
      robertoAdminRole = await robertoAdminRole.setMentionable(true);
      logAction({ name: "role update", guild: guild, role: robertoAdminRole });
      roleIds.robertoAdminRoleId = robertoAdminRole.id;

      return roleIds;
    } catch (err) {
      logError({
        name: `roberto roles create error`,
        description: `Failed to create roberto roles`,
        function: { name: "createRobertoAdminRole", arguments: [...arguments] },
        errorObject: err
      });
      throw err;
    }
  },

  async getInviterUser (guild, client) {
    try {
      // get latest logs and look for Roberto's invite log entry
      let logs = await guild.fetchAuditLogs();
      let robertoInvite = logs.entries.filter(entry => entry.action === 28 && entry.target?.id === client.user.id)[0];

      // search through older logs until the wanted log is found or end of logs is reached
      let oldestLog;
      while (!robertoInvite && logs.entries.size === 50) {
        oldestLog = logs.entries.at(49);
        logs = await guild.fetchAuditLogs({ before: oldestLog });
        robertoInvite = logs.entries.filter(entry => entry.action === 28 && entry.target?.id === client.user.id)[0];
      }

      // return the executor of Roberto's invite (ie the inviter) or null if not found
      if (robertoInvite) {
        return robertoInvite.executor;
      } else {
        return null;
      }
    } catch (err) {
      logError({
        name: `inviter fetch error`,
        description: `Failed to retrieve the user who invited Roberto`,
        function: { name: "getInviterUser", arguments: [...arguments] },
        errorObject: err
      });
      throw err;
    }
  },

  async dmUsers (text, users) {
    // send text to users
    try {
      const recipientList = [];

      // eliminate potential duplicate recipients
      for (let user of users) {
        if (user && recipientList.findIndex(elem => elem.id === user.id) === -1) {
          recipientList.push(user);
        }
      }

      let sentCount = 0;
      for (let recipient of recipientList) {
        try {

          const recipientDm = await recipient.createDM();
          const sentDm = await recipientDm.send(text);
          sentCount++;
          logAction({
            name: `dm sending`,
            description: `Send a DM to a user`,
            message: { id: sentDm.id, content: sentDm.content },
            user: { id: recipient.id, tag: recipient.tag }
          });

        } catch (err) {

          if (err.code === 50007) {
            // log the failure of this particular dm but continue iterating
            logError({
              name: `dm send error`,
              description: `Cannot message this user`,
              function: { name: "dmUsers", arguments: [...arguments] },
              errorObject: err
            });
          } else {
            throw err;
          }

        }
      }

      // if all DMs succeeded, return the number of sent DMs
      return sentCount;
    } catch (err) {
      logError({
        name: `dm dispatch error`,
        description: `Failed to dispatch DMs`,
        function: { name: "dmUsers", arguments: [...arguments] },
        errorObject: err
      });
      throw err;
    }
  },

  checkOwnMissingPermissions (guild, missingPermissions) {
    try {
      missingPermissions = [...missingPermissions]; // copying the array instead of altering the argument
      const ownPermissions = guild.members.me.permissions.toArray();
      for (let permission of ownPermissions) {
        // if permission is found, remove from missing permissions
        if (missingPermissions.indexOf(permission) >= 0) {
          missingPermissions.splice(missingPermissions.indexOf(permission), 1);
        }
      }
      return missingPermissions;
    } catch (err) {
      logError({
        name: `missing permissions check error`,
        description: `Failed to check which permissions are missing`,
        function: { name: "checkOwnMissingPermissions", arguments: [...arguments] },
        errorObject: err
      });
      throw err;
    }
  },

  async getPermissionUpdaterUser (oldElem, newElem, eventType) {
    try {
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
    } catch (err) {
      logError({
        name: `permission updater fetch error`,
        description: `Failed to retrieve the user who updated Roberto's permissions`,
        function: { name: "getPermissionUpdaterUser", arguments: [...arguments] },
        errorObject: err
      });
      throw err;
    }
  },
};