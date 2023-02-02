const { logError, logAction } = require("../helpers/logs.helper.js");
const { getGuildConfigs } = require("../helpers/files.helper.js");
const { checkRoleAssignment } = require("../helpers/discord.helper.js");
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
      const guildConfig = await getGuildConfigs(message.guildId);
      if (!guildConfig.slowmodeDelay || !guildConfig.slowmodeChannels?.length || guildConfig.missingPermissions.includes("ManageMessages")) {
        return;
      }

      const messageAuthorMember = await message.guild.members.fetch(message.author.id);
      // if message author has the slowmode role
      if (await checkRoleAssignment(messageAuthorMember, guildConfig.slowmodeRoleId)) {
        // if channel is affected by slowmode role
        if (guildConfig.slowmodeChannels.includes(message.channelId) && message.channel.type === 0) {
          if (!latestMessages.has(message.channelId)) {
            latestMessages.set(message.channelId, new Collection());
          }
          if (!latestMessages.get(message.channelId).has(message.author.id)) {
            latestMessages.get(message.channelId).set(message.author.id, message.createdTimestamp);
          } else if (message.createdTimestamp - latestMessages.get(message.channelId).get(message.author.id) < guildConfig.slowmodeDelay * 1000) {
            message.delete();
            logAction({ name: `${this.name} event handling (slowmode)`, guild: message.guild, message: message });
          } else {
            latestMessages.get(message.channelId).set(message.author.id, message.createdTimestamp);
          }
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