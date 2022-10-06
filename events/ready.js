module.exports = {
	name: "ready",
	once: true,
	async execute(client) {
		console.log(`================================\n${client.user.tag} ready\nJoined ${client.guilds.cache.size} guild(s) :`);
		for (let guild of client.guilds.cache) {
			await guild[1].members.fetch();
			console.log(`* ${guild[1].name} (ID ${guild[1].id}) - ${guild[1].members.cache.size} members`);
		}
		console.log("================================");
	},
};