import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import config from "./../../config.json"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Changelog extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "The most recent bot updates in chronological order.",
            help:
            `
            \`changelog num?\` - Sends the changelog (or specific one)
            `,
            examples:
            `
            \`=>changelog\`
            `,
            aliases: ["updates"],
            random: "none",
            cooldown: 10,
            unlist: true,
            subcommandEnabled: true
        })
        const numOption = new SlashCommandOption()
            .setType("integer")
            .setName("num")
            .setDescription("Num of changelog.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(numOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)

        // {num: 1, date: "", changes: ""},
        const changelog = [
            {num: 37, date: "6/10/2020", changes: "Added \`source\` to automatically search pictures in certain channels on saucenao."},
            {num: 36, date: "5/6/2020", changes: "Added a new copy reaction. The \`emojis\` command was modified to return just the emojis by default."},
            {num: 35, date: "5/3/2020", changes: "Added \`gallery\` and revamped the moderation case system."},
            {num: 34, date: "4/29/2020", changes: "You can now send the compact help list to your direct messages."},
            {num: 33, date: "4/26/2020", changes: "Added a section for twitter, and you can now reply/like/retweet twitter posts."},
            {num: 32, date: "4/24/2020", changes: "Added \`redditoauth\` so that you can upvote, downvote, comment on, save, and subscribe to posts/subreddits directly."},
            {num: 31, date: "4/24/2020", changes: "Added some subreddit specific commands such as \`animemes\` and \`animeirl\`."},
            {num: 30, date: "4/23/2020", changes: "Added some music presets - \`nightcore\`, \`bassboost\`, and \`trebleboost\`."},
            {num: 29, date: "4/23/2020", changes: "The \`spotify\` command has a new reaction that will post the link to the track in the chat."},
            {num: 28, date: "4/23/2020", changes: "Added \`json\`, \`pastebin\`, and \`hastebin\`, mostly for easy debugging purposes."},
            {num: 27, date: "4/23/2020", changes: "Added \`embed\`, and ability to cycle multiple images in \`welcome\` and \`leave\`."},
            {num: 26, date: "4/20/2020", changes: "Added \`levelroles\`, \`levelchannels\`, and \`usage\`."},
            {num: 25, date: "4/20/2020", changes: "Added twitch notifications with \`twitchnotify\` and level up commands such as \`rank\` and \`leaderboard\`"},
            {num: 24, date: "4/17/2020", changes: "The \`block\` command can now block invite links."},
            {num: 23, date: "4/17/2020", changes: "Added \`trace\` and \`books\`."},
            {num: 22, date: "4/6/2020", changes: "Added \`tweet\` and (global) \`chat\` commands!"},
            {num: 21, date: "4/5/2020", changes: "Added music commands such as \`record\` and \`rewind\`, moderation commands such as \`softban\` and \`tempban\`, and oauth2 commands such as \`email\`"},
            {num: 20, date: "4/3/2020", changes: "Added waifu commands such as \`gab\` and \`megumin\`. The help command also now has pagination because there are over 20 sections now."},
            {num: 19, date: "4/2/2020", changes: "Added \`yelp\` and maybe some more stuff that I forgot about."},
            {num: 18, date: "3/26/2020", changes: "Added \`logs\` (message, mod, user, and member)."},
            {num: 17, date: "3/26/2020", changes: "Added \`reactionroles\`."},
            {num: 16, date: "3/24/2020", changes: "Added \`tumblr\`, \`musescore\`, \`fiverr\`, and \`instagram\`."},
            {num: 15, date: "3/24/2020", changes: "Added \`bots\`, \`flickr\`, \`gravatar\`, and \`steam\`. Had to make a third website category!"},
            {num: 14, date: "3/21/2020", changes: "Added \`blacklist\`, and \`unblacklist\`! Don't make me use them."},
            {num: 13, date: "3/21/2020", changes: "Added random results to the \`xkcd\` command."},
            {num: 12, date: "3/20/2020", changes: "Fixed the photoshop editor, added pagination for the booru commands and the new command \`safebooru\`."},
            {num: 11, date: "3/18/2020", changes: "Added the command \`crunchyroll\` for searching anime on crunchyroll."},
            {num: 10, date: "3/18/2020", changes: "Added new video commands, for speeding up/reversing videos or for converting them to mp3/gif files."},
            {num: 9, date: "3/17/2020", changes: "Some download commands support folder mapping (organizing pictures into subfolders within the zip file)."},
            {num: 8, date: "3/17/2020", changes: "There are now image manipulation commands as well, such as brightness, contrast, flip, hsv, etc. I added an editor with an undo/redo system for ease of use."},
            {num: 7, date: "3/17/2020", changes: "I also added support for audio effects and filters, such as: reverse, speed, pitch, highpass, highshelf, etc."},
            {num: 6, date: "3/17/2020", changes: "I added music playback commands with a queue system. You can play tracks from youtube, soundcloud, links, and attachments."},
            {num: 5, date: "3/8/2020", changes: "Added \`binary/hexadecimal/base64/md5/bcrypt\` commands. They are kind of pointless but whatever."},
            {num: 4, date: "3/7/2020", changes: "Added bandcamp, wattpad, pokemon, and nasa commands. Help embeds can now be collapsed, as well."},
            {num: 3, date: "3/6/2020", changes: "Added a download option for reaction embeds, as well as a new command \`download\`."},
            {num: 2, date: "3/6/2020", changes: "The \`kancolle\` and \`azurlane\` commands can now be used without providing any arguments (added handpicked ship girls) :)"},
            {num: 1, date: "3/6/2020", changes: "This is the initial release. Added the new game command \`minesweeper\` that can be played with reactions or spoilers. Obviously, \`changelog\` as well for posting updates."}
        ]

        if (Number(args[1])) {
            const log = changelog.find((c) => c.num === Number(args[1]))
            if (!log) {
                return this.invalidQuery(embeds.createEmbed()
                .setAuthor({name: "changelog", iconURL: "https://kisaragi.moe/assets/embed/changelog.png"})
                .setTitle(`**Changelog** ${discord.getEmoji("tohruThumbsUp2")}`))
            }
            const changeEmbed = embeds.createEmbed()
            changeEmbed
            .setAuthor({name: "changelog", iconURL: "https://kisaragi.moe/assets/embed/changelog.png"})
            .setTitle(`**Changelog #${log.num}** ${discord.getEmoji("tohruThumbsUp2")}`)
            .setDescription(`${discord.getEmoji("star")}**${log.num}** \`(${log.date})\` -> ${log.changes}\n`)
            return this.reply(changeEmbed)
        }

        let changeDesc = ""
        for (let i = 0; i < changelog.length; i++) {
            changeDesc += `${discord.getEmoji("star")}**${changelog[i].num}** \`(${changelog[i].date})\` -> ${changelog[i].changes}\n`
        }

        const splits = Functions.splitMessage(changeDesc, {maxLength: 1800, char: "\n"})

        const changeArray: EmbedBuilder[] = []
        for (let i = 0; i < splits.length; i++) {
            const changeEmbed = embeds.createEmbed()
            changeEmbed
            .setAuthor({name: "changelog", iconURL: "https://kisaragi.moe/assets/embed/changelog.png"})
            .setTitle(`**Changelog** ${discord.getEmoji("tohruThumbsUp2")}`)
            .setDescription(splits[i])
            changeArray.push(changeEmbed)
        }

        if (changeArray.length === 1) {
            this.reply(changeArray[0])
        } else {
            embeds.createReactionEmbed(changeArray)
        }
    }
}
