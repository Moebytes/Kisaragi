import axios from "axios"
import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import nekoClient from "nekos.life"
import {Command} from "../../structures/Command"
import {Functions} from "../../structures/Functions"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "./../../structures/Permission"

export default class Neko extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Posts images of catgirls.",
            help:
            `
            _Note: Different tags are separated by comma._
            \`neko\` - Posts random neko images.
            \`neko tags\` - Searches for images matching the tags.
            \`neko gif\` - Posts a random neko gif.
            \`neko gif lewd\` - Posts a random nsfw neko gif.
            `,
            examples:
            `
            \`=>neko\`
            \`=>neko :o\`
            \`=>neko lewd\`
            `,
            aliases: ["nekos", "catgirl", "catgirls"],
            random: "none",
            cooldown: 10,
            subcommandEnabled: true
        })
        const tagOption = new SlashCommandOption()
            .setType("string")
            .setName("tags")
            .setDescription("Searches for images with the tags.")

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
        if (!perms.checkNSFW()) return

        if (args[1]?.toLowerCase() === "gif") {
            const neko = new nekoClient()
            let image = await neko.nekoGif()
            let title = "Neko Gif"
            const nekoEmbed = embeds.createEmbed()
            nekoEmbed
            .setTitle(`**${title}** ${discord.getEmoji("madokaLewd")}`)
            .setImage(image.url)
            return this.reply(nekoEmbed)
        }

        const headers = {
            "user-agent": "Kisaragi Bot",
            "authorization": process.env.NEKOS_MOE_TOKEN
        }

        let nsfw = false
        let tags = Functions.combineArgs(args, 1)
        if (args[1]?.toLowerCase() === "lewd") {
            if (!perms.checkNSFW()) return
            if (!perms.checkBotDev()) return
            tags = Functions.combineArgs(args, 2)
            nsfw = true
        }
        let result: any
        if (!tags) {
            result = await axios.get(`https://nekos.moe/api/v1/random/image?count=100&nsfw=${nsfw}`, {headers}).then((r) => r.data.images)
        } else {
            result = await axios.post(`https://nekos.moe/api/v1/images/search`, {nsfw, tags: tags.split(","), limit: 50}, {headers}).then((r) => r.data.images)
        }

        const nekoEmbeds: EmbedBuilder[] = []
        for (let i = 0; i < result.length; i++) {
            const image = result[i]
            const nekoEmbed = embeds.createEmbed()
            nekoEmbed
            .setAuthor({name: "nekos.moe", iconURL: "https://kisaragi.moe/assets/embed/neko.png", url: "https://nekos.moe/"})
            .setTitle(`Neko Image ${discord.getEmoji("tohruSmug")}`)
            .setURL(`https://nekos.moe/post/${image.id}`)
            .setImage(`https://nekos.moe/image/${image.id}`)
            .setDescription(
                `${discord.getEmoji("star")}_Artist:_ **${image.artist}**\n` +
                `${discord.getEmoji("star")}_Likes:_ **${image.likes}**\n` +
                `${discord.getEmoji("star")}_Favorites:_ **${image.favorites}**\n` +
                `${discord.getEmoji("star")}_Uploaded:_ \`${Functions.formatDate(image.createdAt)}\`\n` +
                `${discord.getEmoji("star")}_Tags:_ ${Functions.checkChar(image.tags.join(" "), 1500, " ")}\n`
            )
            nekoEmbeds.push(nekoEmbed)
        }
        if (nekoEmbeds.length === 1) {
            return this.reply(nekoEmbeds[0])
        } else {
            return embeds.createReactionEmbed(nekoEmbeds, true, true)
        }
    }
}
