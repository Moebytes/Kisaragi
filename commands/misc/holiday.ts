import axios from "axios"
import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Holiday extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for daily holidays.",
            help:
            `
            \`holiday\` - Gets today's holiday.
            \`holiday date\` - Gets the holiday for the date
            `,
            examples:
            `
            \`=>holiday\`
            \`=>holiday January 20\`
            \`=>holiday 7/3\`
            `,
            aliases: [],
            random: "none",
            cooldown: 10,
            unlist: true,
            subcommandEnabled: true
        })
        const dateOption = new SlashCommandOption()
            .setType("string")
            .setName("date")
            .setDescription("Can be an optional date.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(dateOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
        const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
        ]
        let inputMonth, inputDay
        if (args[1]) {
            if (args[1].match(/daysoftheyear.com/)) {
                const holidayName = Functions.toProperCase(args[1].replace("https://www.daysoftheyear.com/days/", "").replace(/\//g, "").replace(/-/g, " "))
                const holidayData = await axios.get(args[1], {headers})
                const imageRegex = /(?<=image" content=")(.*?)(?=(\s))/gm
                const pg2Regex = /(?<=description" content=")(.*?)(?="(\s))/gm
                const rawDescription = holidayData.data.match(pg2Regex)?.[0]
                const description = rawDescription.replace(/&hellip;/g, "...").replace(/&#8217;/g, "'").replace(/&#8211;/g, "-").trim()
                const image = holidayData.data.match(imageRegex)?.[0].replace(/"/g, "")
                const holidayEmbed = embeds.createEmbed()
                holidayEmbed
                .setAuthor({name: "days of the year", iconURL: "https://kisaragi.moe/assets/embed/holiday.png"})
                .setTitle(`**Daily Holiday** ${discord.getEmoji("padoruPadoru")}`)
                .setURL(args[1])
                .setThumbnail(image.trim())
                .setDescription(
                    `${discord.getEmoji("star")}_Holiday:_ **${holidayName}**\n` +
                    `${discord.getEmoji("star")}_Description:_ ${Functions.checkChar(description, 2000, ".")}`
                    )
                return this.reply(holidayEmbed)
            }

            for (let i = 0; i < monthNames.length; i++) {
                if (monthNames[i].toLowerCase() === args[1].toLowerCase()) {
                    inputMonth = i + 1
                }
            }
            if (!inputMonth) inputMonth = parseInt(args[1]?.[0], 10)
            if (!args[2]) {
                inputDay = args[1].match(/\/\d+/g)
                if (inputDay?.[0]) inputDay  = parseInt(inputDay?.[0].replace(/\//g, ""), 10)
            } else {
                inputDay = parseInt(args[2], 10)
            }
        }
        const pg1Regex = /(?<=href="https:\/\/www.daysoftheyear.com\/days\/)(.*?)(?=\/"\>\<img)/gm
        const pg2Regex = /(?<=description" content=")(.*?)(?="(\s))/gm
        const imageRegex = /(?<=image" content=")(.*?)(?=(\s))/gm
        const now = new Date(Date.now())
        const month = inputMonth ? inputMonth : now.getUTCMonth() + 1
        const day = inputDay ? inputDay : now.getUTCDate()
        const year = now.getUTCFullYear()
        const url = `https://www.daysoftheyear.com/days/${year}/${month < 10 ? `0${month}` : month}/${day < 10 ? `0${day}` : day}/`
        const data = await axios.get(url, {headers})
        const matchArray = data.data.match(pg1Regex)
        const holidayName = Functions.toProperCase(matchArray?.[0].replace(/-/g, " ").replace(/\//g, ""))
        const date = `${monthNames[month - 1]} ${day}`
        const url2 = `https://www.daysoftheyear.com/days/${matchArray?.[0]}`
        const holidayData = await axios.get(url2, {headers})
        const rawDescription = holidayData.data.match(pg2Regex)?.[0]
        const description = rawDescription.replace(/&hellip;/g, "...").replace(/&#8217;/g, "'").replace(/&#8211;/g, "-").trim()
        const image = holidayData.data.match(imageRegex)?.[0].replace(/"/g, "")

        const holidayEmbed = embeds.createEmbed()
        holidayEmbed
        .setAuthor({name: "days of the year", iconURL: "https://kisaragi.moe/assets/embed/holiday.png"})
        .setTitle(`**Daily Holiday** ${discord.getEmoji("padoruPadoru")}`)
        .setURL(url)
        .setThumbnail(image.trim())
        .setDescription(
            `${discord.getEmoji("star")}_Holiday:_ **${date} - ${holidayName}**\n` +
            `${discord.getEmoji("star")}_Description:_ ${Functions.checkChar(description, 2000, ".")}`
            )
        this.reply(holidayEmbed)
    }
}
