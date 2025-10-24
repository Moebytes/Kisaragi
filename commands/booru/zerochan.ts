import axios from "axios"
import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "./../../structures/Permission"

interface ZerochanPost {
    id: number
    width: number
    height: number
    md5: string
    thumbnail: string
    source: string
    tag: string
    tags: string[]
}

interface ZerochanFullPost {
    id: number
    small: string
    medium: string
    large: string
    full: string
    width: number
    height: number
    size: number
    hash: string
    source: string
    primary: string
    tags: string[]
}

export default class Zerochan extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for anime pictures on zerochan.",
            help:
            `
            \`zerochan\` - Get random images.
            \`zerochan tags\` - Gets images with the tags.
            \`zerochan link/id\` - Gets the image from the link.
            `,
            examples:
`
            \`=>zerochan\`
            \`=>zerochan citlali\`
            `,
            aliases: ["zc"],
            random: "none",
            cooldown: 20,
            defer: true,
            subcommandEnabled: true
        })
        const tagOption = new SlashCommandOption()
            .setType("string")
            .setName("tags")
            .setDescription("tags or link to search")
        
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(tagOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)

        const zerochanEmbed = embeds.createEmbed()
        .setAuthor({name: "zerochan", iconURL: "https://kisaragi.moe/assets/embed/zerochan.png"})
        .setTitle(`**Zerochan Search** ${discord.getEmoji("gabUghh")}`)

        let tags = Functions.combineArgs(args, 1).split(",").filter(Boolean)

        let tagArray: string[] = []
        for (let i = 0; i < tags.length; i++) {
            tagArray.push(tags[i].trim().replace(/ /g, "+"))
        }

        let id = tags.join("").match(/\d\d+/g)
        if (id) {
            let post = await axios.get(`https://www.zerochan.net/${id}?json`).then((r) => r.data) as ZerochanFullPost
            const zerochanEmbed = embeds.createEmbed()
            .setAuthor({name: "zerochan", iconURL: "https://kisaragi.moe/assets/embed/zerochan.png"})
            .setTitle(`**Zerochan Search** ${discord.getEmoji("gabUghh")}`)
            .setURL(`https://www.zerochan.net/${post.id}`)
            .setDescription(
                `${discord.getEmoji("star")}_Width:_ **${post.width}**\n` +
                `${discord.getEmoji("star")}_Height:_ **${post.height}**\n` +
                `${discord.getEmoji("star")}_Source:_ ${post.source}\n` +
                `${discord.getEmoji("star")}_Tags:_ ${Functions.checkChar(post.tags?.join(", "), 2048, " ")}\n`
            )
            .setImage(post.full)
            return this.reply(zerochanEmbed)
        }

        let queryString = tagArray.join(",")
        let posts = await axios.get(`https://www.zerochan.net/${queryString}?json`).then((r) => r.data.items) as ZerochanPost[]

        const zerochanArray: EmbedBuilder[] = []
        for (let i = 0; i < posts?.length; i++) {
            const post = posts[i]
            const zerochanEmbed = embeds.createEmbed()
            .setAuthor({name: "zerochan", iconURL: "https://kisaragi.moe/assets/embed/zerochan.png"})
            .setTitle(`**Zerochan Search** ${discord.getEmoji("gabUghh")}`)
            .setURL(`https://www.zerochan.net/${post.id}`)
            .setDescription(
                `${discord.getEmoji("star")}_Width:_ **${post.width}**\n` +
                `${discord.getEmoji("star")}_Height:_ **${post.height}**\n` +
                `${discord.getEmoji("star")}_Source:_ ${post.source}\n` +
                `${discord.getEmoji("star")}_Tags:_ ${Functions.checkChar(post.tags.join(", "), 2048, " ")}\n`
            )
            .setImage(post.thumbnail)
            zerochanArray.push(zerochanEmbed)
        }
        if (!zerochanArray[0]) {
            return this.invalidQuery(zerochanEmbed)
        }
        if (zerochanArray.length === 1) {
            return this.reply(zerochanArray[0])
        } else {
            return embeds.createReactionEmbed(zerochanArray, true, true)
        }
    }
}
