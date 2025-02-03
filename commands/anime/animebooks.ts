import axios from "axios"
import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class AnimeBooks extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Anime girls holding programming books.",
            help:
            `
            \`animebooks\` - Get any books
            \`animebooks language\` - Searches for books in the language
            `,
            examples:
            `
            \`=>animebooks\`
            \`=>animebooks javascript\`
            \`=>animebooks c\`
            `,
            aliases: ["books", "animegirlbooks", "animegirlsholdingprogrammingbooks"],
            random: "string",
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const languageOption = new SlashCommandOption()
            .setType("string")
            .setName("language")
            .setDescription("Specify a programming language.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(languageOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const query = Functions.combineArgs(args, 1).trim().replace(/ +/g, "_")
        const headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36"}

        let pictures = [] as string[]
        if (!query) {
            for (let i = 0; i < 20; i++) {
                const random = `https://api.senpy.club/v2/random`
                const image = await axios.get(random, {headers}).then((r) => r.data.image)
                pictures.push(image)
            }
        } else {
            const url = `https://api.senpy.club/v2/language/${query}`
            const json = await axios.get(url, {headers}).then((r) => r.data).catch(() => {
                return message.reply(`Invalid programming language ${discord.getEmoji("kannaFacepalm")}`)
            })
            pictures.push(...json)
        }

        pictures = Functions.shuffleArray(pictures)

        const bookArray: EmbedBuilder[] = []
        for (let i = 0; i < pictures.length; i++) {
            const bookEmbed = embeds.createEmbed()
            bookEmbed
            .setURL("https://anime-girls-holding-programming-books-app.pages.dev/")
            .setTitle(`**Anime Girls Holding Programming Books** ${discord.getEmoji("raphi")}`)
            .setImage(pictures[i])
            bookArray.push(bookEmbed)
        }

        if (bookArray.length === 1) {
            return this.reply(bookArray[0])
        } else {
            return embeds.createReactionEmbed(bookArray, false, true)
        }
    }
}
