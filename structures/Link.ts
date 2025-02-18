import {Collection, Message} from "discord.js"
import {CommandFunctions} from "./CommandFunctions"
import {Cooldown} from "./Cooldown"
import {Kisaragi} from "./Kisaragi.js"
import {Functions} from "./Functions"
const linkCool = new Collection() as Collection<string, Collection<string, number>>

export class Link {
    private readonly cmd: CommandFunctions
    private readonly cool: Cooldown
    constructor(private readonly discord: Kisaragi, private readonly message: Message) {
        this.cmd = new CommandFunctions(this.discord, this.message)
        this.cool = new Cooldown(this.discord, this.message)
    }

    public linkRun = async (msg: Message, args: string[]) => {
        const onCooldown = this.cool.cmdCooldown(args[0], 30, linkCool)
        if (onCooldown && (msg.author!.id !== process.env.OWNER_ID)) return this.discord.reply(msg, onCooldown)
        const loading = await this.discord.send(msg, `**Fetching Link** ${this.discord.getEmoji("kisaragiCircle")}`) as Message
        await this.cmd.runCommand(msg, args).catch(() => null)
        Functions.deferDelete(loading, 1000)
    }

    public postLink = async () => {
        const link = this.message.content.match(/(https?:\/\/)(.*?)(?= |$)/)?.[0] ?? ""
        if (!link) return
        if (link.includes("youtube.com")) {
            await this.linkRun(this.message, ["youtube", link])
        }
        if (link.includes("pixiv.net")) {
            await this.linkRun(this.message, ["pixiv", link])
        }
        if (link.includes("danbooru.donmai.us")) {
            await this.linkRun(this.message, ["danbooru", link])
        }
        if (link.includes("gelbooru.com")) {
            await this.linkRun(this.message, ["gelbooru", link])
        }
        if (link.includes("konachan.net")) {
            await this.linkRun(this.message, ["konachan", link])
        }
        if (link.includes("yande.re")) {
            await this.linkRun(this.message, ["yandere", link])
        }

        if (link.includes("deviantart.com")) {
            await this.linkRun(this.message, ["deviantart", link])
        }

        if (link.includes("newgrounds.com")) {
            await this.linkRun(this.message, ["newgrounds", link])
        }

        if (link.includes("crunchyroll.com")) {
            await this.linkRun(this.message, ["crunchyroll", link])
        }

        if (link.includes("kitsu.io/anime")) {
            await this.linkRun(this.message, ["anime", link])
        }

        if (link.includes("kitsu.io/manga")) {
            await this.linkRun(this.message, ["manga", link])
        }

        if (link.includes("azurlane.koumakan.jp")) {
            await this.linkRun(this.message, ["azurlane", link])
        }

        if (link.includes("osu.ppy.sh")) {
            await this.linkRun(this.message, ["osu", link])
        }

        if (link.includes("kancolle.fandom.com")) {
            await this.linkRun(this.message, ["kancolle", link])
        }

        if (link.includes("jisho.org")) {
            await this.linkRun(this.message, ["jisho", link])
        }

        if (link.includes("daysoftheyear.com")) {
            await this.linkRun(this.message, ["holiday", link])
        }

        if (link.includes("merriam-webster.com/dictionary")) {
            await this.linkRun(this.message, ["define", link])
        }

        if (link.includes("merriam-webster.com/thesaurus")) {
            await this.linkRun(this.message, ["thesaurus", link])
        }

        if (link.includes("boards.4channel.org")) {
            await this.linkRun(this.message, ["4chan", link])
        }

        if (link.includes("giphy.com")) {
            await this.linkRun(this.message, ["giphy", link])
        }

        if (link.includes("google.com") && link.match(/tbm=isch/)) {
            await this.linkRun(this.message, ["images", link])
        }

        if (link.includes("google.com")) {
            await this.linkRun(this.message, ["google", link])
        }

        if (link.includes("myanimelist.net")) {
            await this.linkRun(this.message, ["mal", link])
        }

        if (link.includes("pinterest.com")) {
            await this.linkRun(this.message, ["pinterest", link])
        }

        if (link.includes("reddit.com")) {
            await this.linkRun(this.message, ["reddit", link])
        }

        if (link.includes("soundcloud.com")) {
            await this.linkRun(this.message, ["soundcloud", link])
        }

        if (link.includes("trello.com")) {
            await this.linkRun(this.message, ["trello", link])
        }

        if (link.includes("twitch.tv")) {
            await this.linkRun(this.message, ["twitch", link])
        }

        if (link.includes("twitter.com")) {
            await this.linkRun(this.message, ["twitter", link])
        }

        if (link.includes("en.wikipedia.org")) {
            await this.linkRun(this.message, ["wikipedia", link])
        }

        if (link.includes("discord.js.org")) {
            await this.linkRun(this.message, ["discordjs", link])
        }

        if (link.includes("github.com")) {
            await this.linkRun(this.message, ["github", link])
        }

        if (link.includes("imgur.com")) {
            await this.linkRun(this.message, ["imgur", link])
        }

        if (link.includes("developer.mozilla.org")) {
            await this.linkRun(this.message, ["mdn", link])
        }

        if (link.includes("npmjs.com")) {
            await this.linkRun(this.message, ["npm", link])
        }

        if (link.includes("patreon.com")) {
            await this.linkRun(this.message, ["patreon", link])
        }

        if (link.includes("tenor.com")) {
            await this.linkRun(this.message, ["tenor", link])
        }

        if (link.includes("urbandictionary.com")) {
            await this.linkRun(this.message, ["urban", link])
        }

        if (link.includes("xkcd.com")) {
            await this.linkRun(this.message, ["xkcd", link])
        }
    }
}
