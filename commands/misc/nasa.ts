/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {CommandFunctions} from "./../../structures/CommandFunctions"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

import * as nasa from "nasa-sdk"

export default class Nasa extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Posts a random picture of space.",
            help:
            `
            \`nasa\` - Posts a random picture
            \`nasa today\` - Posts the astronomy picture of the day
            \`nasa date?\` - Posts the astronomy picture of a day, YYYY-MM-DD format
            `,
            examples:
            `
            \`=>nasa\`
            \`=>nasa 2020-03-07\`
            `,
            aliases: ["space", "apod"],
            random: "none",
            cooldown: 10,
            subcommandEnabled: true
        })
        const dateOption = new SlashCommandOption()
            .setType("string")
            .setName("date")
            .setDescription("Can be an optional date or today.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(dateOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const cmd = new CommandFunctions(discord, message)
        nasa.setNasaApiKey(process.env.NASA_API_KEY)
        const nasaEmbed = embeds.createEmbed()
        let data: any
        if (args[1] === "today") {
            data = await nasa.APOD.fetch()
        } else if (args[1]) {
            data = await nasa.APOD.fetch({date: args[1]}).catch(() => {
                return message.reply("The date must be in **YYYY-MM-DD** format!")
            })
        } else {
            const randomDate = Functions.randomDate(new Date(2015, 0, 1), new Date())
            const year = randomDate.getFullYear()
            const month = randomDate.getMonth() < 10 ? `0${randomDate.getMonth()}` : randomDate.getMonth()
            const day = randomDate.getDate() < 10 ? `0${randomDate.getDate()}` : randomDate.getDate()
            const date = `${year}-${month}-${day}`
            data = await nasa.APOD.fetch({date}).catch(() => {
                return cmd.runCommand(message, ["nasa"])
            })
        }
        if (!data) return
        const checkedMessage = Functions.checkChar(data.explanation, 1900, ".")
        nasaEmbed
        .setAuthor({name: "nasa", iconURL: "https://kisaragi.moe/assets/embed/nasa.png"})
        .setTitle(`**Nasa Picture** ${discord.getEmoji("cute")}`)
        .setURL(data.url)
        .setDescription(
        `${discord.getEmoji("star")}_Title:_ **${data.title}**\n` +
        `${discord.getEmoji("star")}_Date:_ **${Functions.formatDate(data.date)}**\n` +
        `${discord.getEmoji("star")}_Explanation:_ ${checkedMessage}\n`
        )
        .setImage(data.url)
        .setThumbnail(message.author!.displayAvatarURL())

        this.reply(nasaEmbed)
    }
}
