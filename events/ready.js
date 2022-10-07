module.exports = {
  name: "ready",
  once: true,

  async execute (client) {
    console.log(`Initializing ${client.user.username}\n`);
    await this.listJoinedGuilds(client);
    console.log(`${client.user.username} ready!\n`);
  },

  async listJoinedGuilds (client) {
    console.log(`Joined guild(s) : ${client.guilds.cache.size}`);
    let guildList = [...client.guilds.cache.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name));
    for (let guild of guildList) {
      await guild[1].members.fetch();
      console.log(`* ${guild[1].name} (ID ${guild[1].id}) - ${guild[1].members.cache.size} members`);
    }
    console.log("");
  },
};