import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Images} from "./../../structures/Images"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class JSONCommand extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Gets the JSON data of a message, embed, guild, role, channel, or emoji.",
            help:
            `
            _Note: If the message contains an embed, the JSON for the embed is posted._
            \`json id?\` - Gets the json data of the resource, or last posted message.
            \`json embed\` - Gets the json data of the last posted embed, specifically.
            `,
            examples:
            `
            \`=>json\`
            `,
            aliases: [],
            cooldown: 3,
            defer: true,
            unlist: true,
            subcommandEnabled: true
        })
        const embedOption = new SlashCommandOption()
            .setType("string")
            .setName("embed")
            .setDescription("Can be embed or an id")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName("json")
            .setDescription(this.options.description)
            .addOption(embedOption)
    }

    public getEmbed = async (msg: Message) => {
        if (!msg.embeds?.[0]?.description) return msg
        let json: any
        const cache = await SQLQuery.selectColumn("collectors", "message")
        let cached = false
        for (let i = 0; i < cache.length; i++) {
            if (cache[i] === msg.id) {
                cached = true
            }
        }
        if (cached) {
            const raw = await SQLQuery.fetchColumn("collectors", "embeds", "message", msg.id)
            const newRaw = [] as any
            for (let i = 0; i < raw.length; i++) {
                newRaw.push(JSON.parse(raw[i]))
            }
            json = newRaw
        } else {
            json = msg.embeds[0]
        }
        return json
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const images = new Images(discord, message)

        let json = null as any
        ifLoop:
        if (args[1]) {
            if (args[1].toLowerCase() === "embed") {
                const messages = await message.channel.messages.fetch({limit: 100})
                const msg = messages.find((m) => {
                    if (m.embeds?.[0]?.description) return true
                    return false
                })
                if (!msg) return message.reply(`No message with embeds found ${discord.getEmoji("kannaFacepalm")}`)
                json = await this.getEmbed(msg)
            } else {
                const msg = await discord.fetchMessage(message, args[1])
                if (msg) {json = await this.getEmbed(msg); break ifLoop}
                const guild = discord.guilds.cache.get(args[1])
                if (guild) {json = guild; break ifLoop}
                const channel = discord.channels.cache.get(args[1])
                if (channel) {json = channel; break ifLoop}
                const role = message.guild?.roles.cache.get(args[1])
                if (role) {json = role; break ifLoop}
                const emoji = discord.emojis.cache.get(args[1])
                if (emoji) {json = emoji; break ifLoop}
            }
        } else {
            json = await this.getEmbed(await discord.getLastMessage(message))
        }

        if (!json || json === "null" || json === "undefined") return message.reply(`No JSON found, the ID is invalid ${discord.getEmoji("kannaFacepalm")}`)
        // .replace(/(?<!: )(")(?!,| |$)/g, "")
        let link: string
        try {
            link = await images.hastebinUpload(JSON.stringify(json, null, 4))
        } catch {
            return this.reply(`Something went wrong ${discord.getEmoji("kannaFacepalm")}`)
        }

        const jsonEmbed = embeds.createEmbed()
        jsonEmbed
        .setAuthor({name: "json", iconURL: "https://kisaragi.moe/assets/embed/json.png"})
        .setTitle(`**JSON Data** ${discord.getEmoji("kannaCurious")}`)
        .setURL(link)
        .setDescription(`${discord.getEmoji("star")}Find the JSON data [**here**](${link})`)
        return this.reply(jsonEmbed)
    }
}
