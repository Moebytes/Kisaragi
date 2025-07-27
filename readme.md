# Kisaragi Discord Bot

Kisaragi is a discord bot focusing on anime, website searching, and music playback, and some other server utilities. Invite the bot [**here**](https://discordapp.com/oauth2/authorize?client_id=593838271650332672&permissions=2113793271&scope=bot)

![Best Girl](https://kisaragi.moe/assets/images/promo1.png)
![Best Girl](https://kisaragi.moe/assets/images/promo2.png)

## Help
_Double click on the same reaction to toggle a compact form of the help menu._

`=>help` - Open the help menu which lists all commands.

`=>help command` - Detailed help information, such as arguments, usage, and an example image.

`=>help !category` - Only posts the help menu page for that category.

`=>help dm` - Compact help list that is compatible in dm's.

## Bugs/Feature Requests

Please let me know by submitting an issue or using the `feedback` command on the bot. 

## Self Hosting

First you need to download all of these.

- Node.js v23: https://nodejs.org/en/
- PostgreSQL v16: https://www.postgresql.org/
- Redis v7: https://redis.io/
- Sox: http://sox.sourceforge.net/
- FFmpeg: https://www.ffmpeg.org/

The first step is to clone this repo to download all of the code. \
```git clone https://github.com/Moebits/Kisaragi.git``` \
In the same directory, install all of the dependencies with the command: \
```npm install```

You need to create a bot application on Discord. Create a new application at: https://discord.com/developers/applications
Create a bot under the bot tab, you can give it any name and profile picture that you wish. Rename the file named `.env.example` to
`.env` - this file has all of your credentials, so it should never be shared. Add your token after the variable named `TOKEN`.
Filling out the rest of the file is relatively self-explanatory, only your token and database credentials are mandatory. API keys can 
be omitted, but their respective commands won't work.

The bot uses a lot of custom emojis, which you can find in assets/custom emojis. Add all of these emojis to your bot application in 
the discord developer portal.

The URL to add this bot is the following, replacing CLIENT_ID with the client ID of your bot:

`https://discord.com/oauth2/authorize?client_id=CLIENT_ID&permissions=2113793271&scope=bot`

Finally, you can start the bot with the following command:
```npm start```

In production, it is recommended to run it with pm2 so it auto-restarts on any errors:
```npm run pm2```

That's all!
