import {Message, AttachmentBuilder, MessageReaction, User} from "discord.js"
import Pixiv, {PixivIllust, UgoiraMetaData} from "pixiv.ts"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Images} from "./../../structures/Images"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "./../../structures/Permission"
import {PixivApi} from "./../../structures/PixivApi"
import fs from "fs"
import path from "path"

export default class Ugoira extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for animated pixiv images (pixiv ugoira).",
            help:
            `
            _Note: Using the **pixiv** command on a ugoira link will run this command too!_
            \`ugoira\` - Gets a pixiv ugoira with some defaults.
            \`ugoira link/id\` - Gets the pixiv ugoira from the link.
            \`ugoira tag\` - Gets a pixiv ugoira from the tag (translated to japanese).
            \`ugoira en tag\` - Gets a pixiv ugoira from the tag (not translated).
            `,
            examples:
            `
            \`=>ugoira\`
            \`=>ugoira izumi sagiri\`
            \`=>ugoira kisaragi (azur lane)\`
            `,
            aliases: ["u"],
            random: "none",
            cooldown: 30,
            defer: true,
            voteLocked: true,
            subcommandEnabled: true
        })
        const tag2Option = new SlashCommandOption()
            .setType("string")
            .setName("tags2")
            .setDescription("Can be tags for en/r18 subcommands.")

        const tagOption = new SlashCommandOption()
            .setType("string")
            .setName("tags")
            .setDescription("Can be a link, tags to search, or en/r18 for subcommands.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(tagOption)
            .addOption(tag2Option)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const pixivApi = new PixivApi(discord, message)
        const perms = new Permission(discord, message)
        if (!message.channel.isSendable()) return
        if (!perms.checkNSFW()) return
        const pixiv = await Pixiv.refreshLogin(process.env.PIXIV_REFRESH_TOKEN!)
        let input: string
        if (args[1] && (args[1].toLowerCase() === "r18" || args[1].toLowerCase() === "en" || args[1].toLowerCase() === "popular")) {
            if (args[2] === "en" || args[2] === "popular") {
                input = Functions.combineArgs(args, 3)
            } else {
                input = Functions.combineArgs(args, 2)
            }
        } else {
            input = Functions.combineArgs(args, 1)
        }
        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)
        const msg1 = await this.reply(`**Fetching Ugoira** ${discord.getEmoji("kisaragiCircle")}`) as Message
        let pixivID = null as any
        if (input.match(/\d\d\d+/g)) {
            pixivID = input.match(/\d+/g)!.join("")
        } else {
            if (args[1] && args[1].toLowerCase() === "r18") {
                if (!perms.checkNSFW()) return
                if (!perms.checkBotDev()) return
                if (args[2] && args[2].toLowerCase() === "en") {
                    const image = await pixivApi.getPixivImage(input, true, true, true, true)
                    pixivID = image.id
                } else {
                    const image = await pixivApi.getPixivImage(input, true, false, true, true)
                    pixivID = image.id
                }
            } else if (args[1] && args[1].toLowerCase() === "en") {
                const image = await pixivApi.getPixivImage(input, false, true, true, true)
                pixivID = image.id
            } else {
                const image = await pixivApi.getPixivImage(input, false, false, true, true)
                pixivID = image.id
            }
        }
        if (String(pixivID).length > 14) return
        let dest = ""
        try {
            const folder = path.join(__dirname, "../../assets/images/gifs")
            if (!fs.existsSync(folder)) fs.mkdirSync(folder, {recursive: true})
            dest = await pixiv.util.downloadUgoira(String(pixivID), path.join(folder, `${pixivID}.gif`), {speed: 1.0})
        } catch {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "pixiv", iconURL: "https://kisaragi.moe/assets/embed/ugoira.png"})
            .setTitle(`**Pixiv Ugoira** ${discord.getEmoji("chinoSmug")}`), "The provided url is not a ugoira.")
        }

        let details: PixivIllust
        try {
            details = await pixiv.illust.detail({illust_id: pixivID as number})
        } catch {
            return Functions.deferDelete(msg1, 1000)
        }
        Functions.deferDelete(msg1, 1000)
        const ugoiraEmbed = embeds.createEmbed()
        const outGif = new AttachmentBuilder(fs.readFileSync(dest), {name: `${pixivID}.gif`})
        const comments = await pixiv.illust.comments({illust_id: pixivID as number})
        const cleanText = details.caption.replace(/<\/?[^>]+(>|$)/g, "")
        const profileFolder = path.join(__dirname, "../../assets/images/pixiv/profiles")
        if (!fs.existsSync(profileFolder)) fs.mkdirSync(profileFolder, {recursive: true})
        const authorUrl = await pixiv.util.downloadProfilePicture(details, profileFolder)
        const authorAttachment = new AttachmentBuilder(fs.readFileSync(authorUrl), {name: "author.png"})
        const commentArray: string[] = []
        for (let i = 0; i <= 5; i++) {
                    if (!comments.comments[i]) break
                    commentArray.push(comments.comments[i].comment)
                }
        ugoiraEmbed
        .setAuthor({name: "pixiv", iconURL: "https://kisaragi.moe/assets/embed/ugoira.png"})
        .setTitle(`**Pixiv Ugoira** ${discord.getEmoji("chinoSmug")}`)
        .setURL(`https://www.pixiv.net/member_illust.php?mode=medium&illust_id=${pixivID}`)
        .setDescription(
            `${discord.getEmoji("star")}_Title:_ **${details.title}**\n` +
            `${discord.getEmoji("star")}_Artist:_ **${details.user.name}**\n` +
            `${discord.getEmoji("star")}_Creation Date:_ **${Functions.formatDate(new Date(details.create_date))}**\n` +
            `${discord.getEmoji("star")}_Views:_ **${details.total_view}**\n` +
            `${discord.getEmoji("star")}_Bookmarks:_ **${details.total_bookmarks}**\n` +
            `${discord.getEmoji("star")}_Description:_ ${cleanText ? cleanText : "None"}\n` +
            `${discord.getEmoji("star")}_Comments:_ ${commentArray.join() ? commentArray.join() : "None"}\n`
            )
        .setThumbnail(`attachment://author.png`)
        .setImage(`attachment://${pixivID}.gif`)
        const msg = await this.send(ugoiraEmbed, [outGif, authorAttachment])

        const reactions = ["reverse"]
        await msg.react(discord.getEmoji(reactions[0]))
        const reverseCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("reverse").id && user.bot === false
        const reverse = msg.createReactionCollector({filter: reverseCheck})
        reverse.on("collect", async (reaction, user) => {
            let factor = 1.0
            let setReverse = false
            let bad = false
            await reaction.users.remove(user)
            async function getSpeedChange(response: Message) {
                response.content = response.content.replace("x", "")
                if (response.content.includes("reverse")) {
                    setReverse = true
                    response.content = response.content.replace("reverse", "")
                }
                if (response.content?.trim() && Number.isNaN(Number(response.content))) {
                    const rep = await discord.reply(response, "You must pass a valid speed factor, eg. \`1.5x\` or \`0.5x\`.")
                    Functions.deferDelete(rep, 3000)
                    bad = true
                } else if (response.content) {
                    factor = Number(response.content)
                }
                await Functions.deferDelete(response, 0)
            }
            const rep = await this.send(`<@${user.id}>, Enter the speed change for this ugoira, eg \`2.0\`. Type \`reverse\` to also reverse the frames.`)
            await embeds.createPrompt(getSpeedChange)
            Functions.deferDelete(rep, 0)
            if (bad) return
            const folder = path.join(__dirname, "../../assets/images/gifs")
            if (!fs.existsSync(folder)) fs.mkdirSync(folder, {recursive: true})
            let dest = await pixiv.util.downloadUgoira(String(pixivID), path.join(folder, `${pixivID}.gif`), {speed: factor, reverse: setReverse})
            const outGif = new AttachmentBuilder(fs.readFileSync(dest), {name: `${pixivID}.gif`})
            await this.send("Here is the new gif!", outGif)
        })
    }
}
