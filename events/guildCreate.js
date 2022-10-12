const { addGuildConfigEntry } = require("../helpers/misc.helper.js");

module.exports = {
  name: "guildCreate",

  async execute (guild) {
    const newEntry = {
      id: guild.id,
      name: guild.name,
      greetNewMembers: false,
      colorNewMembers: true,
      robertoAdminRoleId: "",
      robertoOperatorRoleId: ""
    };

    await addGuildConfigEntry(newEntry);

    console.log(`Guild ${guild.name} (ID ${guild.id}) joined`);
    console.log("New entry added in guildConfigs.json");
  },
};