import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import axios from "axios"
import * as cheerio from "cheerio"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Permission} from "../../structures/Permission"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class ReverseImage extends Command {
    private readonly headers = {
        "referer": "https://www.google.com/",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:135.0) Gecko/20100101 Firefox/135.0"
    }
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Reverse image searches an image, avatar, or guild icon.",
            help:
            `
            _Note:_ If no image is found, it defaults to your avatar.
            \`reverseimage\` - Reverse searches the last sent image.
            \`reverseimage url\` - Reverse searches the image from the url.
            \`reverseimage @user/id\` - Reverse searches the user's avatar.
            \`reverseimage guild\` - Reverse searches the guild's icon.
            \`reverseimage me\` - Reverse searches your avatar.
            `,
            examples:
            `
            \`=>reverseimage\`
            \`=>reverseimage https://i.imgur.com/Dt2KANz.jpg\`
            \`=>reverseimage guild\`
            `,
            aliases: ["revimg", "reverseimg"],
            random: "none",
            cooldown: 10,
            voteLocked: true,
            defer: true,
            unlist: true,
            subcommandEnabled: false
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

    public revSearch = async (image: string) => {
        const data: any[] = []
        const response = await axios.get(`https://lens.google.com/uploadbyurl?url=${encodeURI(image)}`, {headers: this.headers}).then((r) => r.data)
        const $ = cheerio.load(response)
        $("#search > div > div").each((index, element) => {
            const url = $(element).find("a").attr("href")
            const desc = $(element).text()
            data.push({url, desc})
        })
        console.log(data)
        const newArray: any[] = []
        for (let i = 3; i < data.length; i++) {
            const obj = {} as any
            obj.url = data[i]?.url ?? "None"
            obj.title = data[i]?.title ?? "None"
            obj.image = data[i]?.image ?? ""
            obj.desc = data[i]?.desc ?? "None"
            newArray.push(obj)
        }
        return newArray
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        let image: string | undefined | null
        if (!args[1]) {
            image = await discord.fetchLastAttachment(message)
        } else if (args[1] === "guild") {
            image = message.guild?.iconURL({extension: "png"})
        } else if (args[1] === "me") {
            image = message.author.displayAvatarURL({extension: "png"})
        } else if (args[1].match(/\d{17,}/)) {
            const user = message.guild?.members.cache.find((m) => m.id === args[1].match(/\d{17,}/)![0])
            if (user) {
                image = user?.user.displayAvatarURL({extension: "png"})
            } else {
                image = args[1]
            }
        } else {
            image = args[1]
        }

        if (!image) image = message.author.displayAvatarURL({extension: "png"})
        let result = [] as any[]
        try {
            result = await Functions.promiseTimeout(10000, this.revSearch(image))
        } catch {
            const revEmbed = embeds.createEmbed()
            .setAuthor({name: "reverse image search", iconURL: "https://kisaragi.moe/assets/embed/reverseimage.png", url: "https://images.google.com/"})
            .setTitle(`**Google Reverse Image Search** ${discord.getEmoji("gabSip")}`)
            .setURL(`https://www.google.com/searchbyimage?image_url=${image}`)
            .setThumbnail(image!)
            .setDescription(
                `${discord.getEmoji("star")}Sorry, but no results were found. [**Here**](https://images.google.com/searchbyimage?safe=off&sbisrc=tg&image_url=${image}) is a direct link to the search.`
            )
            return this.reply(revEmbed)
        }

        const revArray: EmbedBuilder[] = []
        for (let i = 0; i < result.length; i++) {
            const revEmbed = embeds.createEmbed()
            revEmbed
            .setAuthor({name: "reverse image search", iconURL: "https://kisaragi.moe/assets/embed/reverseimage.png", url: "https://images.google.com/"})
            .setTitle(`**Google Reverse Image Search** ${discord.getEmoji("gabSip")}`)
            .setURL(`https://images.google.com/searchbyimage?safe=off&sbisrc=tg&image_url=${image}`)
            .setThumbnail(image!)
            //.setImage(result[i].image)
            .setDescription(
                //`${discord.getEmoji("star")}_Title:_ **${result[i].title}**\n` +
                `${discord.getEmoji("star")}_Link:_ ${result[i].url}\n` +
                `${discord.getEmoji("star")}_Description:_ ${result[i].desc}\n`
            )
            revArray.push(revEmbed)
        }

        if (!revArray[0]) return
        if (revArray.length === 1) {
            return this.reply(revArray[0])
        } else {
            return embeds.createReactionEmbed(revArray, true, true)
        }
    }
}