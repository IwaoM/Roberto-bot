// Command deployment script
const fs = require("node:fs");
const path = require("node:path");
const { REST, Routes } = require("discord.js");
const { clientId, token } = require("./config.json");

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(token);

// to add commands
rest.put(Routes.applicationCommands(clientId), { body: commands })
  .then((data) => console.log(`Successfully registered ${data.length} application commands.`))
  .catch(console.error);

// to delete a command
/*
rest.delete(Routes.applicationCommand(clientId, "1027540994578718810")) // command ID
  .then(() => console.log("Successfully deleted application command"))
  .catch(console.error);
*/