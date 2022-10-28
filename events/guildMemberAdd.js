const { updateColorRole } = require("../helpers/processes.helper.js");
const { getGuildConfigs, saveUserAvatar } = require("../helpers/files.helper.js");
const { getDominantColor } = require("../helpers/color.helper.js");
const fs = require("node:fs");

const welcomeMessages = [
  "<@NEW_MEMBER> joined the party.",
  "<@NEW_MEMBER> is here.",
  "Welcome, <@NEW_MEMBER>. We hope you brought pizza.",
  "A wild <@NEW_MEMBER> appeared.",
  "<@NEW_MEMBER> just landed.",
  "<@NEW_MEMBER> just slid into the server.",
  "<@NEW_MEMBER> just showed up!",
  "Welcome <@NEW_MEMBER>. Say hi!",
  "<@NEW_MEMBER> hopped into the server.",
  "Everyone welcome <@NEW_MEMBER>!",
  "Glad you're here, <@NEW_MEMBER>.",
  "Good to see you, <@NEW_MEMBER>.",
  "Yay you made it, <@NEW_MEMBER>!",
  "<@NEW_MEMBER> just joined the server - glhf!",
  "<@NEW_MEMBER> just joined. Everyone, look busy!",
  "<@NEW_MEMBER> just joined. Can I get a heal?",
  "<@NEW_MEMBER> joined your party.",
  "<@NEW_MEMBER> joined. You must construct additional pylons.",
  "Ermagherd. <@NEW_MEMBER> is here.",
  "Welcome, <@NEW_MEMBER>. Stay awhile and listen.",
  "Welcome, <@NEW_MEMBER>. We were expecting you ( ͡° ͜ʖ ͡°)",
  "Welcome, <@NEW_MEMBER>. We hope you brought pizza.",
  "Welcome <@NEW_MEMBER>. Leave your weapons by the door.",
  "A wild <@NEW_MEMBER> appeared.",
  "Swoooosh. <@NEW_MEMBER> just landed.",
  "Brace yourselves. <@NEW_MEMBER> just joined the server.",
  "<@NEW_MEMBER> just joined. Hide your bananas.",
  "<@NEW_MEMBER> just arrived. Seems OP - please nerf.",
  "<@NEW_MEMBER> just slid into the server.",
  "A <@NEW_MEMBER> has spawned in the server.",
  "Big <@NEW_MEMBER> showed up!",
  "Where’s <@NEW_MEMBER>? In the server!",
  "<@NEW_MEMBER> hopped into the server. Kangaroo!!",
  "<@NEW_MEMBER> just showed up. Hold my beer.",
  "Challenger approaching - <@NEW_MEMBER> has appeared!",
  "It's a bird! It's a plane! Nevermind, it's just <@NEW_MEMBER>.",
  "It's <@NEW_MEMBER>! Praise the sun! \\[T]/",
  "Never gonna give <@NEW_MEMBER> up. Never gonna let <@NEW_MEMBER> down.",
  "Ha! <@NEW_MEMBER> has joined! You activated my trap card!",
  "Cheers, love! <@NEW_MEMBER>'s here!",
  "Hey! Listen! <@NEW_MEMBER> has joined!",
  "We've been expecting you <@NEW_MEMBER>",
  "It's dangerous to go alone, take <@NEW_MEMBER>!",
  "<@NEW_MEMBER> has joined the server! It's super effective!",
  "Cheers, love! <@NEW_MEMBER> is here!",
  "<@NEW_MEMBER> is here, as the prophecy foretold.",
  "<@NEW_MEMBER> has arrived. Party's over.",
  "Ready player <@NEW_MEMBER>",
  "<@NEW_MEMBER> is here to kick butt and chew bubblegum. And <@NEW_MEMBER> is all out of gum.",
  "Hello. Is it <@NEW_MEMBER> you're looking for?",
  "<@NEW_MEMBER> has joined. Stay a while and listen!",
  "Roses are red, violets are blue, <@NEW_MEMBER> joined this server with you",
];

module.exports = {
  name: "guildMemberAdd",

  async execute (member) {
    let currentGuildConfig;
    try {
      currentGuildConfig = await getGuildConfigs(member.guild.id);
    } catch (err) {
      if (err.message === "Config entry not found") {
        console.log(`Failed to handle new guild member - guild config was not found`);
        return;
      } else {
        throw err;
      }
    }

    // auto color new members
    if (currentGuildConfig.colorNewMembers) {
      const avatarDir = await saveUserAvatar(member);

      const hexCode = await getDominantColor("Vibrant", avatarDir);
      if (hexCode) {
        await updateColorRole(hexCode, member);
      }

      await fs.unlink(avatarDir, err => {
        if (err) { throw err; }
      });

    }

    // auto greet new members
    if (currentGuildConfig.greetNewMembers) {
      const messageIndex = Math.floor(Math.random(welcomeMessages.length) * welcomeMessages.length);
      const welcomeMessage = welcomeMessages[messageIndex].replace("NEW_MEMBER", member.id);

      member.guild.systemChannel.send(welcomeMessage);
    }
  },
};