const { logError, logAction } = require("../helpers/logs.helper.js");
const { getGuildConfigs } = require("../helpers/files.helper.js");
const { Collection } = require("discord.js");

// collection of collections to store timestamps of latest messages per user and per channel
// root collection has channel IDs as keys
// each child collection has user IDs as keys
const latestMessages = new Collection();

module.exports = {
  name: "messageCreate",

  async execute (message) {
    try {
      // console.log(message.channel);
      const guildConfig = getGuildConfigs(message.guildId);
      if (!guildConfig.slowmodeDelay || !guildConfig.slowmodeChannels?.length || guildConfig.missingPermissions.includes("ManageMessages")) {
        return;
      }

      // if message author (as a guild member) has the slowmode role
      if (
        message?.member.roles.cache.get(guildConfig.slowmodeRoleId)
        && guildConfig.slowmodeChannels.includes(message.channelId)
        && message.channel.type === 0
      ) {
        if (!latestMessages.has(message.channelId)) {
          latestMessages.set(message.channelId, new Collection());
        }
        if (!latestMessages.get(message.channelId).has(message.author.id)) {
          latestMessages.get(message.channelId).set(message.author.id, message.createdTimestamp);
        } else if (message.createdTimestamp - latestMessages.get(message.channelId).get(message.author.id) < guildConfig.slowmodeDelay * 1000) {
          const t1 = Date.now();
          await message.delete();
          const t2 = Date.now();
          logAction({ name: `${this.name} event handling - applying slowmode`, guild: message.guild, message: message });

          if (t2 - t1 > 1000 && !guildConfig.missingPermissions.includes("ModerateMembers")) {
            // if the delete method takes too much time, it means that the user is spamming too quickly and Roberto reaches their API rate limit
            // in that case, timeout the user for 2x the slowmode delay
            // (of course, an admin can still revoke the timeout before it expires)
            const timeoutMessage = `${guildConfig.slowmodeDelay * 4} seconds timeout for spamming`;
            message.member.timeout(guildConfig.slowmodeDelay * 4000, timeoutMessage);
            logAction({ name: `${this.name} event handling - applying a timeout`, guild: message.guild, member: message.member, reason: timeoutMessage });
          }
        } else {
          latestMessages.get(message.channelId).set(message.author.id, message.createdTimestamp);
        }
      }
    } catch (err) {
      logError({
        name: `${this.name} event handler error`,
        description: `Failed to handle the ${this.name} event`,
        function: { name: `${this.name}.execute`, arguments: [...arguments] },
        errorObject: err
      });
    }
  }
};