 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

const weeb = require("node-weeb")

export default class Manga extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for a manga series.",
            help:
            `
            \`manga query\` - Searches for a manga with the query.
            `,
            examples:
            `
            \`=>manga gabriel dropout\`
            \`=>manga sword art online\`
            \`=>manga himouto umaru chan\`
            `,
            aliases: ["m"],
            random: "string",
            cooldown: 10,
            subcommandEnabled: true
        })
        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("The query to search for")
            .setRequired(true)

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(queryOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        let query = Functions.combineArgs(args, 1)
        const mangaEmbed = embeds.createEmbed()
        .setAuthor({name: "kitsu", iconURL: "https://kisaragi.moe/assets/embed/manga.png"})
        .setTitle(`**Manga** ${discord.getEmoji("gabYes")}`)

        if (!query) {
            return this.noQuery(mangaEmbed,
            `This has to be the name of a manga series. If you are unsure, ` +
            `try searching on the [**Kitsu Website**](https://kitsu.io/anime)`)
        }

        if (query.match(/kitsu.io/)) {
            query = query.replace("https://kitsu.io/manga/", "").replace(/-/g, " ")
        }

        const result = await weeb.manga(query)
        const data = JSON.parse(result).data[0]
        if (!data) {
            return this.invalidQuery(mangaEmbed, "You can try searching on the [**Kitsu Website**](https://kitsu.io/anime)")
        }
        mangaEmbed
        .setURL(`https://kitsu.io/manga/${data.attributes.slug}`)
        .setTitle(`${data.attributes.titles.en_jp} ${discord.getEmoji("gabYes")}`)
        .setDescription(
            `${discord.getEmoji("star")}_Japanese Title:_ **${data.attributes.titles.ja_jp}**\n` +
            `${discord.getEmoji("star")}_Popularity Rank:_ **#${data.attributes.popularityRank}**\n` +
            `${discord.getEmoji("star")}_Community Approval:_ **${data.attributes.averageRating}%**\n` +
            `${discord.getEmoji("star")}_Highly Rated Rank:_ **#${data.attributes.ratingRank}**\n` +
            `${discord.getEmoji("star")}_Chapters:_ **${data.attributes.chapterCount ? data.attributes.chapterCount : "Ongoing"}** _Volumes:_ **${data.attributes.volumeCount}**\n` +
            `${discord.getEmoji("star")}_User Count:_ **${data.attributes.userCount}**\n` +
            `${discord.getEmoji("star")}_Favorites:_ **${data.attributes.favoritesCount}**\n` +
            `${discord.getEmoji("star")}_Published:_ **${Functions.formatDate(data.attributes.startDate)} to ${Functions.formatDate(data.attributes.endDate)}**\n` +
            `${discord.getEmoji("star")}_Trailer:_ https://www.youtube.com/watch?v=${data.attributes.youtubeVideoId}\n` +
            `${discord.getEmoji("star")}_Age Rating:_ **${data.attributes.ageRatingGuide}**\n` +
            `${discord.getEmoji("star")}_Serialization:_ **${data.attributes.serialization}**\n` +
            `${discord.getEmoji("star")}_Synopsis:_ ${Functions.checkChar(data.attributes.synopsis, 2000, ".")}\n`
        )
        .setImage(data.attributes.coverImage ? data.attributes.coverImage.original : data.attributes.posterImage.original)
        .setThumbnail(data.attributes.posterImage.original)
        return this.reply(mangaEmbed)
    }
}
