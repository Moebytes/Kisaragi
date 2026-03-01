 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

const Tenor = require("tenorjs")

export default class TenorCommand extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for gifs on tenor.",
            help:
            `
            \`tenor\` - Posts a random gif
            \`tenor query\` - Searches for a gif with the query
            \`tenor url\` - Gets the gif from the url
            `,
            examples:
            `
            \`=>tenor\`
            \`=>tenor anime\`
            `,
            aliases: ["ten"],
            random: "none",
            cooldown: 5,
            defer: true,
            subcommandEnabled: true
        })
        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("The query to search.")

        this.subcommand = new SlashCommandSubcommand()
            .setName("tenor")
            .setDescription(this.options.description)
            .addOption(queryOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const tenor = new Tenor.client({
            Key: process.env.GOOGLE_API_KEY,
            Filter: "off",
            Locale: "en_US",
            MediaFilter: "minimal",
            DateFormat: "MM/DD/YYYY"
        })

        const query = Functions.combineArgs(args, 1)
        let result: any
        if (query) {
            if (query.match(/tenor.com/)) {
                const id = query.match(/(?<=-)(?:.(?!-))+$/)
                result = tenor.Search.Find([id])
            } else {
                result = await tenor.Search.Query(query, "10")
            }
        } else {
            result = await tenor.Trending.GIFs("10")
        }
        const tenorArray: EmbedBuilder[] = []
        for (let i = 0; i < result.length; i++) {
            const tenorEmbed = embeds.createEmbed()
            tenorEmbed
            .setAuthor({name: "tenor", iconURL: "https://kisaragi.moe/assets/embed/tenor.png", url: "https://tenor.com/"})
            .setTitle(`**Tenor Gif** ${discord.getEmoji("raphi")}`)
            .setURL(result[i].itemurl)
            .setDescription(
                `${discord.getEmoji("star")}_Title:_ **${result[i].title}**\n` +
                `${discord.getEmoji("star")}_Creation Date:_ **${Functions.formatDate(result[i].created)}**`
            )
            .setImage(result[i].media_formats.gif.url)
            tenorArray.push(tenorEmbed)
        }

        if (tenorArray.length === 1) {
            return this.reply(tenorArray[0])
        } else {
            return embeds.createReactionEmbed(Functions.shuffleArray(tenorArray), true, true)
        }
    }
}
