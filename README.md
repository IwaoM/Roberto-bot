# [Roberto-bot](link) ![GitHub release (latest by date)](https://img.shields.io/github/v/release/IwaoM/Roberto-bot) ![GitHub](https://img.shields.io/github/license/IwaoM/Roberto-bot)

<img src="icon.png" alt="Roberto logo" width="120"/>

A Discord bot with various utility & customization features. It is most suited for small to medium servers.

Roberto is licensed under the MIT license. Feel free to reuse it if you want!

If you find any issues, please report them in [Issues](https://github.com/IwaoM/Roberto-bot/issues).

**[Invite Roberto in your server](link)**

## Setting up the bot

### Inviting Roberto

When inviting Roberto to your server, you will be prompted to give them a set of permissions within it. The purpose for each of those asked permissions are explained in the next section.

Once Roberto has joined your server, a new **Roberto** role will have automatically been created and marked as "managed by an integration". This role is managed by Discord itself and is used to give Roberto their needed permissions. Note that if Roberto doesn't have more permissions than **@everyone**, no such role will be generated. **It is highly recommended to put this role at the very top of your server's role list. This is required for several features to work properly.**

<img src="https://i.imgur.com/xSuik2f.png" alt="Roberto role on top of the role list" height=240/>

If the *Manage Roles* permissions was given to Roberto, another role will be created on your server : **Roberto Admin**. This role is not automatically created or managed by Discord, and is used solely by Roberto : some commands will require their caller to have this role. Its permissions or position in the role list are of no importance.

When inviting Roberto to a server, the server owner will automatically receive a DM from Roberto explaining the basics of the bot's usage. If the **View audit logs** permission is granted, the user who invited Roberto will receive this DM as well.

### Managing Roberto

The `/config` command is used to modify Roberto's behavior on the server. The last section explains those configurable options in more detail. This command can only be used by users with the **Roberto Admin** role, excepted the `roles-repair` subcommand, the purpose of which is to regenerate the **Roberto Admin** role, in case it was deleted or other roles with the same name were created (and you don't know which one is the real one).

### Removing Roberto from your server

The **Roberto** role managed by the integration will automatically be deleted when removing Roberto from your server. Other roles such as color roles or the **Roberto Admin** role, however, will remain.

## Needed permissions

When inviting Roberto, you will be asked to grant them 5 permissions:

- **Read messages :** this is mainly used to display Roberto in the right sidebar of Discord.
- **Send messages :** this is used for Roberto to send auto-greet messages on new member joins if the option is active (disabled by default).
  - Note that neither **Read messages** or **Send messages** is needed for commands to be read and responded to by Roberto.
- **Manage nicknames :** this is obviously needed for the `/rename` command.
- **Manage roles :** this is needed for the following:
  - Creating the **Roberto Admin** role (performed when Roberto joins your server - this role is needed to call some commands).
  - Calling the `/config roles-repair` command, which may create a new role and delete unused roles.
  - Using the `/color` command since name colors are given through roles. For the same reason, it is also needed for the **auto-color** feature to function.
- **View audit logs:** this is used for the following:
  - Fetch the user who invited Roberto in the server to send them a DM.
  - Fetch the user who removed needed permissions from Roberto (by editing a server role or Roberto's role list) and send them a DM (configurable with the **permission-dm** option).

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
- `/config roles-repair`: Regenerates the Roberto admin role and deletes unused roles with the same name (a role is considered unused if it has no members).

### /changelog

Displays the changelog of the latest release of Roberto.

#### Usage

- `/changelog`: Fetches the changelog from Roberto's latest release from GitHub and displays it.

## Other features

Roberto's behavior on your server can be customized through 3 togglable options. Each of those options can be shown and edited through the corresponding subcommand of `/config`.

### Auto-color

This option is enabled by default.

When this option is enabled, new members joining the server will automatically be given a color role - the chosen color will be the main dominant color from their profile picture (as if the member called the `/color dominant main` command upon joining).

The color role will not be created or applied if Roberto was offline when the new member joined.

### Auto-greet

This option is disabled by default.

When this option is enabled, Roberto will automatically send a greetings message when a new member joins the server. The message is randomly picked from a pool containing both Discord's old greetings message list (not used anymore) and new message list.

If this option is enabled, it is recommended to disable Discord's native greeting feature to avoid a double greeting.

The greeting message will not be sent if Roberto was offline when the new member joined.

### Permission DM

This option is enabled by default.

When this option is enabled, whenever a role needed by Roberto is removed from them (this can happen when a role Roberto has is edited or removed from them), an alert DM is sent to the person who removed the permissions. If Roberto doesn't have the **View audit logs** permission or was offline when this was performed, the DM will be sent to the server owner instead (the next time Roberto starts up).
