# [Roberto-bot](link) ![GitHub release (latest by date)](https://img.shields.io/github/v/release/IwaoM/Roberto-bot) ![GitHub](https://img.shields.io/github/license/IwaoM/Roberto-bot)

<img src="icon.png" alt="drawing" width="120"/>

A Discord bot with various utility & customization features. It is most suited for small to medium servers.

Roberto is licensed under the MIT license. Feel free to reuse it if you want!

If you find any issues, please report them in [Issues](https://github.com/IwaoM/Roberto-bot/issues).

**[Invite Roberto in your server](link)**

## Setting up the bot

*TODO*

## Needed permissions

*TODO*

## Commands

Roberto currently has 10 commands. All of them support Discord's slash command feature.

### /color

Changes the user's name's color in the server using roles. When a user changes their color, the old color role is automatically deleted if unused.

Roberto needs the permission to manage roles for this command to work. Additionally, Roberto's role should be placed above all color roles in order for this command to work properly.

#### Usage

- `/color hex <hex-code>`: Applies the entered hex color code to the user.
- `/color random`: gives the user a random color.
- `/color random-vibrant`: gives the user a random vibrant color - that is, a color from the saturated color wheel.
- `/color dominant <type>`: picks a dominant color from the user's profile picture - the user can choose between the main, dark or light dominant colors.
- `/color remove`: removes the user's current color role.

### /dictionary

Looks up the entered word or expression on Wiktionary and displays an embed with the found definitions.

#### Usage

- `/dictionary en <word-or-expression>`: Looks up the word or expression in the english Wiktionary. Only english definitions will be displayed.
- `/dictionary fr <word-or-expression>`: Looks up the word or expression in the french Wiktionary. Only english definitions will be displayed.

### /px

When you play Valorant, you sometimes need to send chat messages to your team - but in the heat of a round, it can be difficult to quickly type that british fire guy's name without errors. That's where this command comes handy: it generates alternative spellings for his name, that are guaranteed to be easier to write but still recognizable!

#### Usage

- `/px`: Generates an alternative spelling for "Phoenix" - the "Again!" button can be pressed to regenerate it as many times as needed.

### /random

Generates random values, such as dice rolls or draws from a pool of values.

#### Usage

- `/random dice <sides> <rolls>`: Rolls a dice with a specific number of sides one or several times.
- `/random draw <total> <draws>`: Draws a specific number of values (without duplicates) from a pool of possible numbers.

### /random-channel

Randomly chooses users from your voice channel - can be used to pick people or generate teams.

#### Usage

- `/random-channel teams <teams>`: distributes all channel members in a specific number of teams.
- `/random-channel draw <draws>`: randomly draws a specific number of users from the voice channel.

### /rename

Adds or changes the nickname of a server member (the command caller or another member).

Roberto needs the permission to manage nicknames for this command to work. Additionally, Roberto's role should be placed above all roles of a user in order for him to successfully give them a new nickname. For this reason, it is impossible to rename the server owner, as their owner status automatically counts as the highest role in the role list.

#### Usage

- `/rename <user> <nickname>`: gives a nickname to the tagged server member.
- `/rename <user>`: removes a server member's nickname if they have one.

### /weather

Fetches the weather for the entered location on OpenWeather and displays an embed with the found information.

#### Usage

- `/weather <location>`: Fetches the weather for the given location.

### /help

Displays informations about available commands and their usage.

#### Usage

- `/help`: Displays a list of all available commands.
- `/help <command>`: Displays information about a specific command.

### /config

This command is used to configure Roberto's behavior on your server. 

Most of its subcommands can only be called by server members with the **Roberto Admin** role - the only exception is the *roles-repair* subcommand.

Roberto needs the permission to manage roles for the *roles-repair* subcommand command to work.

#### Usage

- `/config auto-color <action>`: Enables, disables or shows the current value for the *auto-color* configuration option. 
- `/config auto-greet <action>`: Enables, disables or shows the current value for the *auto-greet* configuration option. 
- `/config permission-dm <action>`: Enables, disables or shows the current value for the *permission-dm* configuration option. 
- `/config roles-show`: Shows the current Roberto admin role name and ID.
- `/config roles-repair`: Regenerates the Roberto admin role and deletes unused roles with the same name.

### /changelog

Displays the changelog of the latest release of Roberto.

#### Usage

- `/changelog`: Fetches the changelog from Roberto's latest release from GitHub and displays it.

## Other features

*TODO*

### Auto-color

*TODO*

### Auto-greet

*TODO*

### Permission DM

*TODO*

