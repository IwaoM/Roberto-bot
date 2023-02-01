const { logError } = require("../helpers/logs.helper.js");

module.exports = {
  name: "messageCreate",

  async execute (message) {
    try {
      console.log(message.content);
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