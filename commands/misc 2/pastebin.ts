import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import fs from "fs"
import path from "path"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Images} from "./../../structures/Images"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Pastebin extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Uploads a message or text file to pastebin.",
            help:
            `
            \`pastebin [title]? text?\` - Uploads the text, or the last uploaded text file
            \`pastebin public [title]? text?\` - By default, the privacy is unlisted, but this makes it public
            `,
            examples:
            `
            \`=>pastebin [some code]\`
            `,
            aliases: [],
            cooldown: 3,
            subcommandEnabled: true
        })
        const textOption = new SlashCommandOption()
            .setType("string")
            .setName("text")
            .setDescription("Pastebin text.")

        const titleOption = new SlashCommandOption()
            .setType("string")
            .setName("title")
            .setDescription("Can be the [title]. Add public to post publicly.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(titleOption)
            .addOption(textOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const images = new Images(discord, message)
        let privacy = 1
        if (args[1].toLowerCase() === "public") {
            privacy = 0
            args.shift()
        }
        const input = Functions.combineArgs(args, 1).trim()
        let title = input.match(/(?<=^\[)(.*?)(?=\])/)?.[0] ?? ""
        let content = input.replace(/(^\[)(.*?)(\])/, "").trim()
        let user = message.author
        if (!content) {
            const {image, author} = await discord.fetchLastAttachment(message, true, /.(txt|ts|js|json|py|html|css|less|scss|tsx|jsx|c|cs|cpp|java|xml)/)
            if (image) {
                const ext = path.extname(image).replace(".", "")
                let dest = path.resolve(__dirname, `../../assets/misc/dump/pastebin.${ext}`)
                let i = 1
                while (fs.existsSync(dest)) {
                    dest =  path.resolve(__dirname, `../../assets/misc/dump/pastebin${i}.${ext}`)
                    i++
                }
                await images.download(image, dest)
                if (author) user = author
                content = fs.readFileSync(dest, "utf8")
            }
        }
        if (!content) return this.reply(`What do you want to post on pastebin ${discord.getEmoji("kannaFacepalm")}`)
        if (!title) title = `Paste from ${user.tag}`
        const link = await images.pastebinUpload(title, content, privacy)
        if (!link.startsWith("http")) return this.reply(`Something went wrong ${discord.getEmoji("kannaFacepalm")}`)

        const pastebinEmbed = embeds.createEmbed()
        pastebinEmbed
        .setAuthor({name: "pastebin", iconURL: "https://kisaragi.moe/assets/embed/pastebin.png", url: "https://pastebin.com/"})
        .setTitle(`**Pastebin Upload** ${discord.getEmoji("raphi")}`)
        .setURL(link)
        .setDescription(`${discord.getEmoji("star")}Successfully uploaded to pastebin, find your paste [**here**](${link})`)
        return this.reply(pastebinEmbed)
    }
}
