 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class IMDB extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for movies and tv shows on imdb.",
            help:
            `
            \`imdb query\` - Searches for a movie or tv series.
            `,
            examples:
            `
            \`=>imdb dragon maid\`
            \`=>imdb konosuba\`
            `,
            aliases: ["movie", "film"],
            random: "string",
            cooldown: 10,
            defer: true,
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
        const Imdb = require("imdb-api")
        const imdb = new Imdb.Client({apiKey: process.env.IMDB_API_KEY})

        const query = Functions.combineArgs(args, 1)
        if (!query) {
            return this.noQuery(embeds.createEmbed())
        }

        const result = await imdb.get({name: query})
        const imdbEmbed = embeds.createEmbed()
        .setAuthor({name: "imdb", iconURL: "https://kisaragi.moe/assets/embed/imdb.png", url: "https://www.imdb.com/"})
        .setTitle(`**IMDb Search** ${discord.getEmoji("yaoi")}`)
        .setImage(result.poster)
        .setURL(result.imdburl)
        .setDescription(
            `${discord.getEmoji("star")}_Title:_ **${result.title}**\n` +
            `${discord.getEmoji("star")}_Released_ **${Functions.formatDate(result.released)}**\n` +
            `${discord.getEmoji("star")}_Genres:_ **${result.genres}**\n` +
            `${discord.getEmoji("star")}_Rating:_ **${result.rated}**\n` +
            `${discord.getEmoji("star")}_Runtime:_ **${result.runtime}**\n` +
            `${discord.getEmoji("star")}_Country:_ **${result.country}**\n` +
            `${discord.getEmoji("star")}_Score:_ **${result.rating}**\n` +
            `${discord.getEmoji("star")}_Votes:_ **${result.votes}**\n` +
            `${discord.getEmoji("star")}_Actors:_ ${Functions.checkChar(result.actors, 100, ",")}\n` +
            `${discord.getEmoji("star")}_Synopsis:_ ${Functions.checkChar(result.plot, 1500, " ")}\n`
        )
        return this.reply(imdbEmbed)
    }
}
