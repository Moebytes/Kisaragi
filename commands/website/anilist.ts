 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import Anilist from "anilist-node"
import type {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class AnilistCommand extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for anime and manga on anilist.",
            help:
            `
            \`anilist query\` - Searches for anime matching the query
            \`anilist manga query\` - Searches for manga with the query
            \`anilist user name\` - Gets an anilist user profile
            `,
            examples:
            `
            \`=>anilist eromanga sensei\`
            `,
            aliases: ["animelist"],
            random: "string",
            cooldown: 10,
            subcommandEnabled: true
        })
        const query2Option = new SlashCommandOption()
            .setType("string")
            .setName("query2")
            .setDescription("Last chance to input the query.")

        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("Can be a query or manga/user.")
            .setRequired(true)

        this.subcommand = new SlashCommandSubcommand()
            .setName("anilist")
            .setDescription(this.options.description)
            .addOption(queryOption)
            .addOption(query2Option)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const anilist = new Anilist()

        if (args[1] === "user") {
            const term = Functions.combineArgs(args, 2)
            const user = await anilist.user.profile(term).catch(() => null)

            if (!user) {
                return this.invalidQuery(embeds.createEmbed()
                .setAuthor({name: "anilist", iconURL: "https://kisaragi.moe/assets/embed/anilist.png", url: "https://anilist.co/home"})
                .setTitle(`**Anilist Profile** ${discord.getEmoji("raphi")}`))
            }

            const anilistEmbed = embeds.createEmbed()
            .setAuthor({name: "anilist", iconURL: "https://kisaragi.moe/assets/embed/anilist.png", url: "https://anilist.co/home"})
            .setTitle(`**Anilist Profile** ${discord.getEmoji("raphi")}`)
            .setURL(user.siteUrl)
            .setImage(user.bannerImage || null)
            .setThumbnail(user.avatar.large || null)
            .setDescription(
                `${discord.getEmoji("star")}_User:_ **${user.name}**\n` +
                `${discord.getEmoji("star")}_Favorite Anime:_ ${Functions.checkChar(user.favourites.anime?.map((a) => a.title.english).join(", "), 100, " ") || "None"}\n` +
                `${discord.getEmoji("star")}_Favorite Manga:_ ${Functions.checkChar(user.favourites.manga?.map((a) => a.title.english).join(", "), 100, " ") || "None"}\n` +
                `${discord.getEmoji("star")}_Favorite Characters:_ ${Functions.checkChar(user.favourites.character?.map((c) => c.name).join(", "), 100, " ") || "None"}\n` +
                `${discord.getEmoji("star")}_Description:_ ${Functions.checkChar(Functions.cleanHTML(user.about || "None"), 1700, ".")}\n`
            )
            return this.reply(anilistEmbed)
        }

        if (args[1] === "manga") {
            const term = Functions.combineArgs(args, 2)
            const search = await anilist.searchEntry.manga(term, {}, 1, 25)

            if (!search.media.length) {
                return this.invalidQuery(embeds.createEmbed()
                .setAuthor({name: "anilist", iconURL: "https://kisaragi.moe/assets/embed/anilist.png", url: "https://anilist.co/home"})
                .setTitle(`**Anilist Search** ${discord.getEmoji("raphi")}`))
            }

            const anilistArray: EmbedBuilder[] = []
            for (let i = 0; i < search.media.length; i++) {
                const manga = search.media[i]
                const details = await anilist.media.manga(manga.id)
                const startDate = new Date()
                startDate.setFullYear(details.startDate.year!, details.startDate.month!, details.startDate.day!)
                const endDate = new Date()
                endDate.setFullYear(details.endDate.year!, details.endDate.month!, details.endDate.day!)

                const anilistEmbed = embeds.createEmbed()
                .setAuthor({name: "anilist", iconURL: "https://kisaragi.moe/assets/embed/anilist.png", url: "https://anilist.co/home"})
                .setTitle(`**Anilist Search** ${discord.getEmoji("raphi")}`)
                .setURL(details.siteUrl)
                .setImage(details.bannerImage || null)
                .setThumbnail(details.coverImage.large || null)
                .setDescription(
                    `${discord.getEmoji("star")}_Manga:_ **${manga.title.english}**\n` +
                    `${discord.getEmoji("star")}_Japanese Title:_ **${manga.title.native}**\n` +
                    `${discord.getEmoji("star")}_Volumes:_ **${details.volumes}**\n` +
                    `${discord.getEmoji("star")}_Start Date:_ **${Functions.formatDate(startDate)}**\n` +
                    `${discord.getEmoji("star")}_End Date:_ **${Functions.formatDate(endDate)}**\n` +
                    `${discord.getEmoji("star")}_Popularity:_ **#${details.popularity}**\n` +
                    `${discord.getEmoji("star")}_Favourites:_ **${details.favourites}**\n` +
                    `${discord.getEmoji("star")}_Score:_ **${details.averageScore}**\n` +
                    `${discord.getEmoji("star")}_Tags:_ ${details.tags.map((s) => s.name).join(", ")}\n` +
                    `${discord.getEmoji("star")}_Description:_ ${Functions.checkChar(Functions.cleanHTML(details.description || "None"), 1700, ".")}\n`
                )
                anilistArray.push(anilistEmbed)
            }
            return embeds.createReactionEmbed(anilistArray, true, true)
        }


        const term = Functions.combineArgs(args, 1)
        const search = await anilist.searchEntry.anime(term, {}, 1, 25)

        if (!search.media.length) {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "anilist", iconURL: "https://kisaragi.moe/assets/embed/anilist.png", url: "https://anilist.co/home"})
            .setTitle(`**Anilist Search** ${discord.getEmoji("raphi")}`))
        }

        const anilistArray: EmbedBuilder[] = []
        for (let i = 0; i < search.media.length; i++) {
            const anime = search.media[i]
            const details = await anilist.media.anime(anime.id)
            const startDate = new Date()
            startDate.setFullYear(details.startDate.year!, details.startDate.month!, details.startDate.day!)
            const endDate = new Date()
            endDate.setFullYear(details.endDate.year!, details.endDate.month!, details.endDate.day!)
            
            const anilistEmbed = embeds.createEmbed()
            .setAuthor({name: "anilist", iconURL: "https://kisaragi.moe/assets/embed/anilist.png", url: "https://anilist.co/home"})
            .setTitle(`**Anilist Search** ${discord.getEmoji("raphi")}`)
            .setURL(details.siteUrl)
            .setImage(details.bannerImage || null)
            .setThumbnail(details.coverImage.large || null)
            .setDescription(
                `${discord.getEmoji("star")}_Anime:_ **${anime.title.english}**\n` +
                `${discord.getEmoji("star")}_Japanese Title:_ **${anime.title.native}**\n` +
                `${discord.getEmoji("star")}_Episodes:_ **${details.episodes}**\n` +
                `${discord.getEmoji("star")}_Start Date:_ **${Functions.formatDate(startDate)}**\n` +
                `${discord.getEmoji("star")}_End Date:_ **${Functions.formatDate(endDate)}**\n` +
                `${discord.getEmoji("star")}_Season:_ **${details.season} ${details.seasonYear}**\n` +
                `${discord.getEmoji("star")}_Popularity:_ **#${details.popularity}**\n` +
                `${discord.getEmoji("star")}_Favourites:_ **${details.favourites}**\n` +
                `${discord.getEmoji("star")}_Score:_ **${details.averageScore}**\n` +
                `${discord.getEmoji("star")}_Studios:_ ${details.studios.map((s) => s.name).join(", ")}\n` +
                `${discord.getEmoji("star")}_Tags:_ ${details.tags.map((s) => s.name).join(", ")}\n` +
                `${discord.getEmoji("star")}_Description:_ ${Functions.checkChar(Functions.cleanHTML(details.description || "None"), 1700, ".")}\n`
            )
            anilistArray.push(anilistEmbed)
        }
        return embeds.createReactionEmbed(anilistArray, true, true)
    }
}
