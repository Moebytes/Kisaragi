import {Message, User} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import Sagiri from "sagiri"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Saucenao extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Finds the source of an anime picture, avatar, or guild icon.",
            help:
            `
            \`saucenao\` - Searches the last posted image (or your avatar)
            \`sauceno url\` - Searches the linked image
            \`saucenao @user/id\` - Searches a user's avatar
            \`saucenao guild\` - Searches the guild icon
            \`saucenao me\` - Searches for your icon
            `,
            examples:
            `
            \`=>saucenao\`
            \`=>saucenao @user\`
            `,
            aliases: ["sn"],
            random: "none",
            cooldown: 10,
            voteLocked: true,
            defer: true,
            subcommandEnabled: true
        })
        const urlOption = new SlashCommandOption()
            .setType("string")
            .setName("url")
            .setDescription("Can be a url/user/guild/me.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(urlOption)
    }

    public getDetails = (source: any) => {
        const discord = this.discord
        let description = ""
        let url = ""
        let i = 0
        while (description.length < 1600 && source[i]) {
            switch (source[i].site) {
                case "Pixiv":
                    description += `${discord.getEmoji("star")}_Site:_ **Pixiv**\n` +
                    `${discord.getEmoji("star")}_Similarity:_ **${source[i].similarity}**\n` +
                    `${discord.getEmoji("star")}_Title:_ **${source[i]?.raw?.data?.title ?? "Not found"}**\n` +
                    `${discord.getEmoji("star")}_Artist:_ **${source[i]?.raw?.data?.member_name ?? "Not found"}**\n` +
                    `${discord.getEmoji("star")}_Pixiv Link:_ **${source[i]?.raw?.data?.pixiv_id ? `https://www.pixiv.net/en/artworks/${source[i]?.raw?.data?.pixiv_id}` : "Not found"}**\n` +
                    `${discord.getEmoji("star")}_Artist Link:_ **${source[i]?.raw?.data?.member_id ? `https://www.pixiv.net/en/users/${source[i].raw.data.member_id}` : "Not found"}**\n`
                    if (!url) url = `https://www.pixiv.net/en/artworks/${source[i]?.raw?.data?.pixiv_id}`
                    break
                default:
                    description +=
                    `${discord.getEmoji("star")}_Site:_ **${Functions.toProperCase(source[i].site.replace("-", " "))}**\n` +
                    `${discord.getEmoji("star")}_Similarity:_ **${source[i].similarity}**\n` +
                    `${discord.getEmoji("star")}_Title:_ **${source[i]?.raw?.data?.title ?? "Not found"}**\n` +
                    `${discord.getEmoji("star")}_Artist:_ **${source[i]?.raw?.data?.member_name ?? "Not found"}**\n` +
                    `${discord.getEmoji("star")}_${Functions.toProperCase(source[i].site.replace("-", " "))} Link:_ ${source[i]?.raw?.data?.ext_urls ? source[i]?.raw?.data?.ext_urls[0] : "Not found"}\n` +
                    `${discord.getEmoji("star")}_Artist Link:_ ${source[i].authorUrl ?? "Not found"}\n`
                    if (!url) url = source[i]?.raw?.data?.ext_urls ? source[i]?.raw?.data?.ext_urls[0] : ""
            }
            description += "\n"
            i++
        }
        return {description, url}
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const sagiri = Sagiri(process.env.SAUCENAO_API_KEY!)
        let image: string | undefined | null
        let author: User | undefined | null

        if (args[1]) {
            if (args[1] === "guild") {
                image = message.guild?.iconURL({extension: "png"})
                author = message.author
            } else if (args[1] === "me") {
                image = message.author.displayAvatarURL({extension: "png"})
                author = message.author
            } else if (args[1].match(/\d{15,}/)) {
                const id = args[1].match(/\d{15,}/)?.[0]
                const user = message.guild?.members.cache.find((m) => m.id === id)
                image = user?.user.displayAvatarURL({extension: "png"})
                author = user?.user
            } else {
                image = args[1]
                author = message.author
            }
        } else {
            const result = await discord.fetchLastAttachment(message, true)
            if (!result) {
                author = message.author
                image = message.author.displayAvatarURL({extension: "png"})
            } else {
                image = result.image
                author = result.author
            }
        }

        if (!image) {
            return this.noQuery(embeds.createEmbed()
            .setAuthor({name: "saucenao", iconURL: "https://kisaragi.moe/assets/embed/saucenao.png", url: "https://saucenao.com/"})
            .setTitle(`**Saucenao Search** ${discord.getEmoji("gabrielLick")}`), "No image could be found.")
        }

        const source = await sagiri(image)
        const {description, url} = this.getDetails(source)
        const siteEmbed = embeds.createEmbed()
        siteEmbed
        .setAuthor({name: "saucenao", iconURL: "https://kisaragi.moe/assets/embed/saucenao.png", url: "https://saucenao.com/"})
        .setTitle(`**Saucenao Search** ${discord.getEmoji("gabrielLick")}`)
        .setThumbnail(author?.displayAvatarURL({extension: "png"}) ?? "")
        .setURL(url)
        .setImage(image)
        .setDescription(Functions.checkChar(description, 2000, " "))
        return this.reply(siteEmbed)
    }
}
