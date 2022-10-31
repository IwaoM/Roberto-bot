const { getGuildConfigs, updateGuildConfigEntry } = require("../helpers/files.helper.js");
const { checkOwnMissingPermissions, dmUsers } = require("../helpers/discord.helper.js");
const { processGuildCreate, processGuildDelete } = require("../helpers/processes.helper.js");
const { robertoNeededPermissions } = require("../config.json");

module.exports = {
  name: "ready",
  once: true,

  async execute (client) {
    console.log(`Initializing ${client.user.username}`);

    // * 1. Syncing & display of the joined guild list

    // Get the current list of guilds and display it
    console.log(`\nJoined guild(s) : ${(await client.guilds.fetch()).size}`);
    let guildList = [...client.guilds.cache.values()].sort((a, b) => a.name.localeCompare(b.name));

    for (let guild of guildList) {
      await guild.members.fetch();
      console.log(`* ${guild.name} (ID ${guild.id}) - ${guild.members.cache.size} members`);
    }

    let guildConfigs;
    try {
      guildConfigs = await getGuildConfigs();
    } catch (err) {
      console.log("Failed to retrieve the guild config list");
      return;
    }

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
my permissions on the server **${guild.name}** were updated while I was offline, and the following permission${newlyBotMissingPermissions.length === 1 ? " was" : "s were"} removed from me: [${newlyBotMissingPermissions.join(", ")}].
I need th${newlyBotMissingPermissions.length === 1 ? "is permission" : "ese permissions"} to function properly (more details on why exactly here: https://github.com/IwaoM/Roberto-bot#readme). Please consider restoring ${newlyBotMissingPermissions.length === 1 ? "it" : "them"} :)
Thanks!

Note: this automatic DM can be disabled with the \`/config permission-dm\` command.`;

        // if DM text & recipient are not empty, send the text to the recipient
        try {
          dmSent = await dmUsers(dmText, [dmRecipient]);
        } catch (err) {
          if (err.message !== "Cannot message this user") {
            console.log(`Failed to send a DM to user ${dmRecipient.username} - unknown error`);
          }
        }
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

        try {
          await updateGuildConfigEntry(guild.id, { missingPermissions: newBotMissingPermissions });
        } catch (err) {
          if (err.message === "Invalid argument") {
            console.log(`Failed to update the guild's config - unknown config option.`);
          } else if (err.message === "Config entry not found") {
            console.log(`Failed to update the guild's config - guild config was not found.`);
          } else {
            throw err;
          }
        }
      }
    }
    if (guildUpdateCount) { console.log(""); }
    console.log(`Needed permissions were updated in ${guildUpdateCount} guild(s)`);

    console.log(`\n${client.user.username} ready!\n`);
  },
};