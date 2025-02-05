# Kisaragi Discord Bot
![Best Girl](https://vignette.wikia.nocookie.net/mudae/images/7/73/Kisaragi_%28AL%294.png/revision/latest?cb=20191205095054)

This is my first programming project, a discord bot mainly to search anime pictures and websites, play music, and provide some server utilities. Invite the bot [**here**](https://discordapp.com/oauth2/authorize?client_id=593838271650332672&permissions=2113793271&scope=bot)!

## Help
_Double click on the same reaction to toggle a compact form of the help menu._

`=>help` - Open the help menu which lists all commands.

`=>help command` - Detailed help information, such as arguments, usage, and an example image.

`=>help !category` - Only posts the help menu page for that category.

`=>help dm` - Compact help list that is compatible in dm's.

## Bugs/Feature Requests

Please let me know by submitting an issue or using the `feedback` command on the bot. I appreciate all ideas.

## Tips

Because discord.js makes breaking changes to the send/reply methods very frequently, for the least pain when developing (avoiding having to change hundreds 
of files) make sure that you centralize your bots reply method... Something like:

```ts
public reply = (input: Message | ChatInputCommandInteraction, embeds: EmbedBuilder | EmbedBuilder[] | string, 
    files?: AttachmentBuilder | AttachmentBuilder[], opts?: MessageReplyOptions) => {
        let options = {...opts} as any
        if (Array.isArray(embeds)) {
            options.embeds = embeds
        } else if (embeds instanceof EmbedBuilder) {
          options.embeds = [embeds]
        } else if (typeof embeds === "string") {
          options.content = embeds
        }
        if (files) options.files = Array.isArray(files) ? files : [files]
        if (this.deferState.has(input.id)) {
            let flags = !!input.guild ? MessageFlags.Ephemeral : undefined
          return (input as ChatInputCommandInteraction).followUp({...options, flags})
        }
        if (!this.deferState.has(input.id)) this.deferState.add(input.id)
        return input.reply(options) as Promise<Message<true>>
    }
```

## Self Hosting

- The bot runs on Node.js: https://nodejs.org/en/
- You will also need to install git if you haven't already: https://git-scm.com/
- The primary database is PostgreSQL (I recommend installing the GUI too): https://www.postgresql.org/
- The secondary database is Redis (caches stuff in-memory): https://redis.io/
- The music effects commands use Sox: http://sox.sourceforge.net/

The first step is to clone this repo to download all of the code.
```git clone <url>```
In the same directory, you can install all of the dependencies with the command:
```npm install```

Next you need to create a bot application on Discord. Create a new application at: https://discord.com/developers/applications
Create a bot under the bot tab, you can give it any name and profile picture that you wish. Rename the file named `.env.example` to
`.env` - this file has all of your credentials, so it should never be shared. Add your token after the variable named `TOKEN`.
For the variable `OWNER_ID`, put your own user ID. This is the person that is considered the bot owner and is the only person that can use bot
developer commands. Filling out the rest of the file is relatively self-explanatory. For example, to use Twitter commands you will need credentials for Twitter's API. You can get this by googling "twitter api" and creating an application in their developer portal - it is the same for the other sites. 

You can instantiate the database by restoring from the sql file that I provided in the self hosting tab. To avoid errors, you need to restore with the option "Do not save owner". The databse credentials should go in the `PG_DATABASE`, `PG_PASSWORD`, etc. variables. For redis use `REDIS_URL`, a new empty Redis database is fine. 

The bot uses a lot of custom emojis, so you need to make sure that it can find all of them. You need to create a bunch of Discord servers (around 5-6) and add the bot to all of them. It's important to note that you must be the owner of the servers, because the bot only checks for emojis in the servers that the bot owner owns. All of the emojis are in the self hosting folder. The URL to add this bot is the following, you need to replace CLIENT_ID with the client ID of your bot:

`https://discord.com/oauth2/authorize?client_id=CLIENT_ID&permissions=2113793271&scope=bot`

In `events/ready.ts`, remove the following line:
```this.discord.postGuildCount()```
Since your version of the bot will not be on any bot lists.

Finally, you can start the bot with the following command:
```npm start```

That's all!
