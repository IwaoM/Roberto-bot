const { getGuildConfigs, updateGuildConfigEntry } = require("../helpers/files.helper.js");
const { checkOwnMissingPermissions, dmUsers } = require("../helpers/discord.helper.js");
const { processGuildCreate, processGuildDelete } = require("../helpers/processes.helper.js");
const { robertoNeededPermissions } = require("../config.json");
const { logEvent, logAction, logError, pruneLogs } = require("../helpers/logs.helper.js");

module.exports = {
  name: "ready",
  once: true,

  async execute (client) {
    try {
      logEvent({ name: this.name, description: "The discord.js client is ready to start working" });
      console.log(`Initializing ${client.user.username}`);

      // Prune logs older than a week
      const clearedLogsCount = pruneLogs(7);
      console.log(`\nCleared ${clearedLogsCount} log(s) older than 1 week.`);

      // * 1. Syncing & display of the joined guild list

      // Get the current list of guilds and display it
      let descText = `Joined guild(s) : ${(await client.guilds.fetch()).size}`;
      let guildList = [...client.guilds.cache.values()].sort((a, b) => a.name.localeCompare(b.name));

      for (let guild of guildList) {
        await guild.members.fetch();
        descText += `\n* ${guild.name} (ID ${guild.id}) - ${guild.members.cache.size} members`;
      }
      console.log(`\n${descText}`);

      let guildConfigs = await getGuildConfigs();

      // Check for guilds joined while Roberto was offline & perform join actions for them
      let guildUpdateCount = 0;
      console.log("\nChecking for guilds joined while offline");
      for (let guild of guildList) {
        if (guildConfigs.findIndex(config => config.id === guild.id) === -1) {
          guildUpdateCount++;
          await processGuildCreate(guild, client);
        }
      }
      if (guildUpdateCount) { console.log(""); }
      console.log(`${guildUpdateCount} guild(s) joined`);

      // Check for guilds left while Roberto was offline & perform leave actions for them
      guildConfigs = await getGuildConfigs();
      guildUpdateCount = 0;
      console.log("\nChecking for guilds left while offline");
      for (let config of guildConfigs) {
        if (guildList.findIndex(guild => guild.id === config.id) === -1) {
          guildUpdateCount++;
          await processGuildDelete(config);
        }
      }
      if (guildUpdateCount) { console.log(""); }
      console.log(`${guildUpdateCount} guild(s) left`);

      // * 2. Syncing of Roberto's permissions in each joined guild

      // For each joined guild, compare Roberto's current missing permission list with the stored one
      guildUpdateCount = 0;
      console.log("\nChecking for needed permissions update for Roberto in all joined guilds");

      guildConfigs = await getGuildConfigs();
      for (let guild of guildList) {
        let dmSent;
        const guildConfig = guildConfigs.find(entry => entry.id === guild.id);
        const newBotMissingPermissions = (await checkOwnMissingPermissions(guild, robertoNeededPermissions)).sort();
        const oldBotMissingPermissions = guildConfig.missingPermissions.sort();
        const newlyBotMissingPermissions = newBotMissingPermissions.filter(perm => oldBotMissingPermissions.indexOf(perm) === -1);

        // if previously granted needed permissions were removed from Roberto && DM option is enabled
        if (newlyBotMissingPermissions.length && guildConfig.dmOnPermissionRemoved) {
          let dmText;

          // get the server owner
          const dmRecipient = (await guild.fetchOwner()).user;

          // construct DM text
          dmText = `Hello!
my permissions on the server **${guild.name}** or my list of needed permissions was updated while I was offline, and I currently miss the following permission${newlyBotMissingPermissions.length === 1 ? "" : "s"}: [${newlyBotMissingPermissions.join(", ")}].
I need th${newlyBotMissingPermissions.length === 1 ? "is permission" : "ese permissions"} to function properly (more details on why exactly here: https://github.com/IwaoM/Roberto-bot#readme). Please consider giving ${newlyBotMissingPermissions.length === 1 ? "it" : "them"} to me :)
Thanks!

Note: this automatic DM can be disabled with the \`/config permission-dm\` command.`;

          // if DM text & recipient are not empty, send the text to the recipient
          dmSent = await dmUsers(dmText, [dmRecipient]);
        }

        // in any case, if permissions were changed for Roberto, replace the missing permission value in the guild config
        if (newBotMissingPermissions.toString() !== oldBotMissingPermissions.toString()) {
          guildUpdateCount++;
          console.log(`\nMissing permissions updated in guild ${guild.name} (ID ${guild.id})`);
          console.log(`* Old missing permission list : [${oldBotMissingPermissions.join(", ")}]`);
          console.log(`* New missing permission list : [${newBotMissingPermissions.join(", ")}]`);
          if (dmSent) {
            console.log("* DM sent to the guild owner");
          }

          await updateGuildConfigEntry(guild.id, { missingPermissions: newBotMissingPermissions });
        }
      }
      if (guildUpdateCount) { console.log(""); }
      console.log(`Needed permissions were updated in ${guildUpdateCount} guild(s)`);

      logAction({ name: `${this.name} event handling` });
      console.log(`\n${client.user.username} ready!\n`);
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