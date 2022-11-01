const fs = require("node:fs");
const path = require("node:path");

module.exports = {
  async logEvent (eventInput) {
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

    if (eventInput.guild) {
      logEntry.event.guild = {
        id: eventInput.guild.id,
        name: eventInput.guild.name
      };
    } else {
      logEntry.event.guild = null;
    }

    if (eventInput.initiator) {
      logEntry.event.initiator = {
        id: eventInput.initiator.id,
        name: eventInput.initiator.name
      };
    } else {
      logEntry.event.initiator = null;
    }

    // write in the logs file
    await writeLogEntry(logEntry);
  },

  async logAction (actionInput) {
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

    if (actionInput.guild) {
      logEntry.action.guild = {
        id: actionInput.guild.id,
        name: actionInput.guild.name
      };
    } else {
      logEntry.action.guild = null;
    }

    if (actionInput.member) {
      logEntry.action.member = {
        id: actionInput.member.id,
        name: actionInput.member.name
      };
    } else {
      logEntry.action.member = null;
    }

    if (actionInput.message) {
      logEntry.action.message = {
        id: actionInput.message.id,
        content: actionInput.message.content
      };
    } else {
      logEntry.action.message = null;
    }

    if (actionInput.role) {
      logEntry.action.role = {
        id: actionInput.role.id,
        name: actionInput.role.name
      };
    } else {
      logEntry.action.role = null;
    }

    if (actionInput.user) {
      logEntry.action.user = {
        id: actionInput.user.id,
        name: actionInput.user.name
      };
    } else {
      logEntry.action.user = null;
    }

    // write in the logs file
    await writeLogEntry(logEntry);
  },

  async logError (errorInput) {
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
        name: errorInput.function.name,
        arguments: errorInput.function.arguments
      };
    } else {
      logEntry.error.function = null;
    }

    if (errorInput.errorObject) {
      logEntry.error.errorObject = errorInput.errorObject;
    } else {
      logEntry.error.errorObject = null;
    }

    // write in the logs file
    await writeLogEntry(logEntry);
  },
};

async function writeLogEntry (logEntry) {
  try {
    // open the file, read its content, append a new list element, then overwrite the file
    const logsDir = path.join(path.dirname(__dirname), "logs.json");
    let data = await fs.promises.readFile(logsDir);
    const logs = JSON.parse(data);
    logs.push(logEntry);
    data = JSON.stringify(logs, null, 2);
    await fs.promises.writeFile(logsDir, data);
  } catch (err) {
    // if this fails, just log the entry
    console.log(logEntry);
  }
}