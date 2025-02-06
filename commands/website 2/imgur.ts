import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {ImgurClient} from "imgur"

export default class Imgur extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for images on imgur.",
            help:
            `
            \`imgur query\` - Searches for images with the query
            `,
            examples:
            `
            \`=>imgur anime\`
            `,
            aliases: ["img", "image"],
            random: "string",
            cooldown: 5,
            defer: true,
            unlist: true,
            subcommandEnabled: true
        })
        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("The query to search.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(queryOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)

        const imgur = new ImgurClient({clientId: process.env.IMGUR_CLIENT_ID})
        const query = Functions.combineArgs(args, 1)
        if (!query) {
            return this.noQuery(embeds.createEmbed()
            .setAuthor({name: "imgur", iconURL: "https://kisaragi.moe/assets/embed/imgur.png"})
            .setTitle(`**Imgur Search** ${discord.getEmoji("kannaWave")}`))
        }

        if (query.match(/imgur.com/)) {
            const id = query.match(/(?<=\/)(?:.(?!\/))+$/)![0].replace(/.(png|jpg|gif)/, "")
            const image = await imgur.getImage(id).then((r) => r.data)
            const imgurEmbed = embeds.createEmbed()
            let extension = ""
            switch (image.type.slice(-3)) {
                case "mp4": extension = "gif"; break
                case "peg": extension = "jpeg"; break
                default: extension = image.type.slice(-3)
            }
            const cover = `https://imgur.com/${image.id}.${extension}`
            imgurEmbed
            .setAuthor({name: "imgur", iconURL: "https://kisaragi.moe/assets/embed/imgur.png", url: "https://imgur.com/"})
            .setURL(image.link)
            .setTitle(`**Imgur Search** ${discord.getEmoji("kannaWave")}`)
            .setDescription(
                `${discord.getEmoji("star")}_Title:_ **${image.title ?? "None"}**\n` +
                `${discord.getEmoji("star")}_Account:_ **${image.account_url ?? "None"}**\n` +
                `${discord.getEmoji("star")}**${image.ups ?? 0}** ${discord.getEmoji("thumbsUp")} **${image.downs ?? 0}** ${discord.getEmoji("thumbsDown")}\n` +
                `${discord.getEmoji("star")}_Views:_ **${image.views}**\n` +
                `${discord.getEmoji("star")}_Animated:_ **${image.animated ? "Yes" : "No"}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${image.description ? image.description : "None"}\n`
            )
            .setImage(cover)
            return this.reply(imgurEmbed)
        }
        const json = await imgur.searchGallery({q: query})
        const random = Math.floor(Math.random() * json.data.length)
        const image = json.data[random] as any
        if (!image) {
            const imgurEmbed = embeds.createEmbed()
            imgurEmbed
            .setAuthor({name: "imgur", iconURL: "https://kisaragi.moe/assets/embed/imgur.png", url: "https://imgur.com/"})
            .setTitle(`**Imgur Search** ${discord.getEmoji("kannaWave")}`)
            .setDescription("No results were found! Try searching for a tag on the imgur website.\n" +
            "[Imgur Website](https://imgur.com/)")
            return this.reply(imgurEmbed)
        }
        if (!image.is_album) {
            const imgurEmbed = embeds.createEmbed()
            let extension = ""
            switch (image.type.slice(-3)) {
                case "mp4": extension = "gif"; break
                case "peg": extension = "jpeg"; break
                default: extension = image.type.slice(-3)
            }
            const cover = `https://imgur.com/${image.id}.${extension}`
            imgurEmbed
            .setAuthor({name: "imgur", iconURL: "https://kisaragi.moe/assets/embed/imgur.png", url: "https://imgur.com/"})
            .setURL(image.link)
            .setTitle(`**Imgur Search** ${discord.getEmoji("kannaWave")}`)
            .setDescription(
                `${discord.getEmoji("star")}_Title:_ **${image.title ?? "None"}**\n` +
                `${discord.getEmoji("star")}_Account:_ **${image.account_url ?? "None"}**\n` +
                `${discord.getEmoji("star")}**${image.ups ?? 0}** ${discord.getEmoji("thumbsUp")} **${image.downs ?? 0}** ${discord.getEmoji("thumbsDown")}\n` +
                `${discord.getEmoji("star")}_Views:_ **${image.views}**\n` +
                `${discord.getEmoji("star")}_Animated:_ **${image.animated ? "Yes" : "No"}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${image.description ? image.description : "None"}\n`
            )
            .setImage(cover)
            return this.reply(imgurEmbed)
        } else {
            const imageArray: EmbedBuilder[] = []
            for (let i = 0; i < image.images.length - 1; i++) {
                const imgurEmbed = embeds.createEmbed()
                let extension
                switch (image.images[i].type.slice(-3)) {
                    case "mp4": extension = "gif"; break
                    case "peg": extension = "jpeg"; break
                    default: extension = image.images[i].type.slice(-3)
                }
                const cover = `https://imgur.com/${image.images[i].id}.${extension}`
                imgurEmbed
                .setAuthor({name: "imgur", iconURL: "https://kisaragi.moe/assets/embed/imgur.png", url: "https://imgur.com/"})
                .setURL(image.link)
                .setTitle(`**Imgur Search** ${discord.getEmoji("kannaWave")}`)
                .setDescription(
                    `${discord.getEmoji("star")}_Title:_ **${image.title ?? "None"}**\n` +
                    `${discord.getEmoji("star")}_Account:_ **${image.account_url ?? "None"}**\n` +
                    `${discord.getEmoji("star")}**${image.ups ?? 0}** ${discord.getEmoji("thumbsUp")} **${image.downs ?? 0}** ${discord.getEmoji("thumbsDown")}\n` +
                    `${discord.getEmoji("star")}_Views:_ **${image.views}**\n` +
                    `${discord.getEmoji("star")}_Animated:_ **${image.images[i].animated ? "Yes" : "No"}**\n` +
                    `${discord.getEmoji("star")}_Description:_ ${image.description ? image.description : "None"}\n`
                )
                .setImage(cover)
                imageArray.push(imgurEmbed)
            }
            return embeds.createReactionEmbed(imageArray, true, true)
        }
    }
}
