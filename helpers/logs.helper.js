const fs = require("node:fs");
const path = require("node:path");

module.exports = {
  logEvent (eventInput) {
    const logEntry = {};

    // log entry timestamp & type
    const entryTimestamp = new Date();
    logEntry.timestamp = { date: entryTimestamp.toISOString(), time: entryTimestamp.getTime() };
    logEntry.type = "event";

    // event info
    logEntry.event = {
      name: eventInput.name,
      description: eventInput.description
    };

    if (eventInput.command) {
      logEntry.event.command = {
        id: eventInput.command.id,
        name: eventInput.command.name,
        subcommand: eventInput.command.subcommand,
        arguments: eventInput.command.arguments
      };
    }

    if (eventInput.guild) {
      logEntry.event.guild = {
        id: eventInput.guild.id,
        name: eventInput.guild.name
      };
    }

    if (eventInput.interaction) {
      logEntry.event.interaction = {
        id: eventInput.interaction.id,
        type: eventInput.interaction.isChatInputCommand() ? "chatInputCommand" : eventInput.interaction.isButton() ? "button" : null
      };
    }

    if (eventInput.member) {
      logEntry.event.member = {
        id: eventInput.member.id,
        tag: eventInput.member.user.tag,
        nickname: eventInput.member.nickname
      };
    }

    if (eventInput.role) {
      logEntry.event.role = {
        id: eventInput.role.id,
        name: eventInput.role.name,
        permissions: eventInput.role.permissions.toArray(),
        mentionable: eventInput.role.mentionable
      };
    }

    // write in the logs file
    writeLogEntry(logEntry);
  },

  logAction (actionInput) {
    const logEntry = {};

    // log entry timestamp & type
    const entryTimestamp = new Date();
    logEntry.timestamp = { date: entryTimestamp.toISOString(), time: entryTimestamp.getTime() };
    logEntry.type = "action";

    // action info
    logEntry.action = {
      name: actionInput.name,
      description: actionInput.description
    };

    if (actionInput.command) {
      logEntry.action.command = {
        id: actionInput.command.id,
        name: actionInput.command.name,
        subcommand: actionInput.command.subcommand,
        arguments: actionInput.command.arguments
      };
    }

    if (actionInput.config) {
      logEntry.action.config = actionInput.config;
    }

    if (actionInput.guild) {
      logEntry.action.guild = {
        id: actionInput.guild.id,
        name: actionInput.guild.name
      };
    }

    if (actionInput.interaction) {
      logEntry.action.interaction = {
        id: actionInput.interaction.id,
        type: actionInput.interaction.isChatInputCommand() ? "chatInputCommand" : actionInput.interaction.isButton() ? "button" : null
      };
    }

    if (actionInput.member) {
      logEntry.action.member = {
        id: actionInput.member.id,
        tag: actionInput.member.user.tag,
        nickname: actionInput.member.nickname
      };
    }

    if (actionInput.message) {
      logEntry.action.message = {
        id: actionInput.message.id,
        content: actionInput.message.content
      };
    }

    if (actionInput.role) {
      logEntry.action.role = {
        id: actionInput.role.id,
        name: actionInput.role.name,
        permissions: actionInput.role.permissions.toArray(),
        mentionable: actionInput.role.mentionable
      };
    }

    if (actionInput.user) {
      logEntry.action.user = {
        id: actionInput.user.id,
        tag: actionInput.user.tag
      };
    }

    // write in the logs file
    writeLogEntry(logEntry);
  },

  logError (errorInput) {
    const logEntry = {};

    // log entry timestamp & type
    const entryTimestamp = new Date();
    logEntry.timestamp = { date: entryTimestamp.toISOString(), time: entryTimestamp.getTime() };
    logEntry.type = "error";

    // error info
    logEntry.error = {
      name: errorInput.name,
      description: errorInput.description
    };

    if (errorInput.function) {
      logEntry.error.function = {
        name: errorInput.function.name
      };
    }

    if (errorInput.errorObject) {
      logEntry.error.errorObject = errorInput.errorObject;
    }

    // write in the logs file
    writeLogEntry(logEntry);
  },

  async pruneLogs (days) {
    const xDaysAgo = Date.now() - 1000 * 3600 * 24 * days;

    const logsDir = path.join(path.dirname(__dirname), "logs.json");
    let data = await fs.promises.readFile(logsDir);
    const logs = JSON.parse(data);
    const recentLogs = logs.filter(entry => entry.timestamp.time > xDaysAgo);

    data = JSON.stringify(recentLogs, null, 2);
    await fs.promises.writeFile(logsDir, data);

    return logs.length - recentLogs.length;
  }
};

function writeLogEntry (logEntry) {
  try {
    // open the file, read its content, append a new list element
    const logsDir = path.join(path.dirname(__dirname), "logs.json");
    let data = fs.readFileSync(logsDir);
    const logs = JSON.parse(data);
    logs.push(logEntry);

    // try overwriting the file with the new list
    data = JSON.stringify(logs, null, 2);
    fs.writeFileSync(logsDir, data);
  } catch (err) {
    // if this fails, just log the entry
    console.log("Log writing failed");
    console.log(err);
    console.log(logEntry);
  }
}