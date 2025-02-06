import {Message} from "discord.js"
import {SQLQuery} from "./SQLQuery"

interface Init {
    [propName: string]: unknown
}

export class Settings {
    private readonly sql: SQLQuery
    private tableMap: object
    private guildSettings: Init

   constructor(private readonly message: Message) {
        this.sql = new SQLQuery(this.message)

        this.guildSettings = {
            "name": this.message.guild!.name,
            "guild id": this.message.guild!.id,
            "members": this.message.guild!.memberCount,
            "prefix": "=>",
            "mod log": null,
            "message log": null,
            "user log": null,
            "member log": null,
            "starboard": null,
            "star threshold": 3,
            "star emoji": "⭐",
            "pinboard": null,
            "nsfw pinboard": null,
            "yt channels": null,
            "twitch channels": null,
            "global chat": null,
            "linked": null,
            "gallery": null,
            "source": null,
            "mute role": null,
            "restricted role": null,
            "warn one": null,
            "warn two": null,
            "mod role": null,
            "admin role": null,
            "self roles": null,
            "reaction roles": null,
            "emoji roles": null,
            "warn log": null,
            "warn penalty": "none",
            "warn threshold": 3,
            "cases": null,
            "blocked words": null,
            "disabled categories": null,
            "pfp ban toggle": "off",
            "leaver ban toggle": "off",
            "everyone ban toggle": "off",
            "ascii name toggle": "off",
            "default channel": null,
            "block match": "partial",
            "block toggle": "off",
            "link ban": "off",
            "asterisk": "off",
            "invite": "off",
            "self promo": "None",
            "verify toggle": "off",
            "verify role": null,
            "captcha type": "text",
            "captcha color": "#ffffff",
            "difficulty": "medium",
            "links": "on",
            "anime": "off",
            "pfp": "off",
            "response": "on",
            "weeb": null,
            "normie": null,
            "ignored": null,
            "welcome channel": null,
            "welcome message": "Welcome to guild, user!",
            "welcome toggle": "off",
            "welcome bg images": ["https://i.imgur.com/WOYlL17.gif"],
            "welcome bg text": "Welcome username! There are now count members.",
            "welcome bg color": "rainbow",
            "welcome bg toggle": "on",
            "leave channel": null,
            "leave message": "user has left guild!",
            "leave toggle": "off",
            "leave bg images": ["https://i.imgur.com/3KoLVtn.gif"],
            "leave bg text": "username left! There are now count members.",
            "leave bg color": "rainbow",
            "leave bg toggle": "on",
            "embed colors": ["default"],
            "permissions": "role",
            "scores": null,
            "point range": [10, 20],
            "point threshold": 1000,
            "level message": "Congrats user, you are now level newlevel!",
            "point timeout": 60000,
            "point toggle": "off",
            "level roles": null,
            "level channels": null,
            "auto": null,
            "birthdays": null,
            "birthday channel": null,
            "birthday message": "Happy birthday to user!",
            "birthday toggle": "off",
            "guild log": null,
            "sources": null
        }
        this.tableMap = {guilds: this.guildSettings}
    }

    // Populate async fields
    public populateAsync = async () => {
        const owner = await this.message.guild?.fetchOwner()
        const asyncSettings = {
            "owner": owner?.user.username,
            "owner id": owner?.user.id
        }
        this.guildSettings = {...this.guildSettings, ...asyncSettings}
        this.tableMap = {guilds: this.guildSettings}
    }

    // Initialize all tables
    public initAll = async () => {
        await this.populateAsync()
        const entries = Object.entries(this.tableMap)
        for (const [table, object] of entries) {
            const settings = Object.entries(object)
            for (const [column, value] of settings) {
                if (column === "scores") {
                    const exists = await this.sql.fetchColumn("guilds", "scores")
                    if (exists) continue
                }
                await this.sql.updateColumn(table, column, value)
              }
          }
        return
    }
}
