const fs = require("node:fs");
const path = require("node:path");

module.exports = {
  name: "guildCreate",

  async execute (guild) {
    // add an entry for the joined guild in guildConfigs.json
    const guildConfigsDir = path.join(path.dirname(__dirname), "guildConfigs.json");
    let data = await fs.promises.readFile(guildConfigsDir);
    const guildConfigs = JSON.parse(data);

    guildConfigs.push({
      id: guild.id,
      name: guild.name,
      greetNewMembers: false,
      colorNewMembers: true,
      changelogIndexes: [],
      robertoAdminRoleId: "",
      robertoOperatorRoleId: ""
    });
    console.log(guildConfigs);

    data = JSON.stringify(guildConfigs, null, 2);
    await fs.promises.writeFile(guildConfigsDir, data);

    console.log(`Guild ${guild.name} (ID ${guild.id}) joined`);
    console.log("New entry added in guildConfigs.json");
  },
};