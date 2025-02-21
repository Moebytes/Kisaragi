import type {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import axios from "axios"

export default class Mal extends Command {
    private anime = null as any
    private character = null as any
    private user = null as any
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for anime, characters, and users on myanimelist.",
            help:
            `
            \`mal\` - Gets the top anime
            \`mal query\` - Searches for anime matching the query
            \`mal character query\` - Searches for characters with the query
            \`mal user query\` - Searches for users matching the query
            `,
            examples:
            `
            \`=>mal gabriel dropout\`
            \`=>mal satania\`
            `,
            aliases: ["myanimelist"],
            random: "none",
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const query2Option = new SlashCommandOption()
            .setType("string")
            .setName("query2")
            .setDescription("Query for character/user.")

        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("Can be a query/character/user.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(queryOption)
            .addOption(query2Option)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)

        if (args[1]?.match(/myanimelist.net/)) {
            this.character = args[1].match(/myanimelist.net\/character/) && args[1].match(/(?<=\/)(?:.(?!\/))+$/) ? args[1].match(/(?<=\/)(?:.(?!\/))+$/)?.[0].replace(/_/g, " ") : null
            this.user = args[1].match(/myanimelist.net\/profile/) ? args[1].replace("https://myanimelist.net/profile/", "") : null
            this.anime = args[1].match(/myanimelist.net\/anime/) && args[1].match(/(?<=\/)(?:.(?!\/))+$/) ? args[1].match(/(?<=\/)(?:.(?!\/))+$/)?.[0].replace(/_/g, " ") : null
        }

        if (this.character || args[1] === "character") {
            const query = this.character || Functions.combineArgs(args, 2)
            if (!query) {
                return this.noQuery(embeds.createEmbed()
                .setAuthor({name: "my anime list", iconURL: "https://kisaragi.moe/assets/embed/mal.png", url: "https://myanimelist.net/"})
                .setTitle(`**My Anime List Character** ${discord.getEmoji("raphi")}`)
                )
            }
            const result = await axios.get(`https://api.jikan.moe/v4/characters?q=${query.trim()}`).then((r) => r.data.data)
            const malArray: EmbedBuilder[] = []
            for (let i = 0; i < Math.min(10, result.length); i++) {
                const char = result[i]
                const detailed = await axios.get(`https://api.jikan.moe/v4/characters/${char.mal_id}/full`).then((r) => r.data.data)
                const info = detailed.anime.length ? detailed.anime.map((n: any) => n.anime.title) : detailed.manga.map((n: any) => n.manga.title)
                const malEmbed = embeds.createEmbed()
                malEmbed
                .setAuthor({name: "my anime list", iconURL: "https://kisaragi.moe/assets/embed/mal.png", url: "https://myanimelist.net/"})
                .setTitle(`**My Anime List Character** ${discord.getEmoji("raphi")}`)
                .setURL(char.url)
                .setImage(char.images.jpg.image_url)
                .setThumbnail("https://kisaragi.moe/assets/embed/mal.png")
                .setDescription(
                    `${discord.getEmoji("star")}_Character:_ **${char.name}**\n` +
                    `${discord.getEmoji("star")}_Kanji:_ **${char.name_kanji ? char.name_kanji : "None"}**\n` +
                    `${discord.getEmoji("star")}_Nicknames:_ **${char.nicknames?.length ? char.nicknames.join(", ") : "None"}**\n` +
                    `${discord.getEmoji("star")}_Series:_ ${info.join(", ")}\n` +
                    `${discord.getEmoji("star")}_Favorites:_ **${char.favorites}**\n` +
                    `${discord.getEmoji("star")}_Description:_ ${detailed.about}\n`
                )
                malArray.push(malEmbed)
            }
            return embeds.createReactionEmbed(malArray, true, true)
        }

        if (this.user || args[1] === "user") {
            const user = this.user || args[2]
            const malEmbed = embeds.createEmbed()
            .setAuthor({name: "my anime list", iconURL: "https://kisaragi.moe/assets/embed/mal.png", url: "https://myanimelist.net/"})
            .setTitle(`**My Anime List User** ${discord.getEmoji("raphi")}`)
            if (!user) return this.noQuery(malEmbed)
            const result = await axios.get(`https://api.jikan.moe/v4/users/${user}/full`).then((r) => r.data.data)
            const favorites = await axios.get(`https://api.jikan.moe/v4/users/${user}/favorites`).then((r) => r.data.data)
            const about = await axios.get(`https://api.jikan.moe/v4/users/${user}/about`).then((r) => r.data.data[0]?.about)
            const anime = favorites.anime.map((a: any) => a.title)
            const characters = favorites.characters.map((c: any) => c.name)
            const cleanText = about?.replace(/<\/?[^>]+(>|$)/g, "") || ""
            malEmbed
            .setURL(result.url)
            .setImage(result.images.jpg.image_url)
            .setThumbnail("https://kisaragi.moe/assets/embed/mal.png")
            .setDescription(
                `${discord.getEmoji("star")}_User:_ **${result.username}**\n` +
                `${discord.getEmoji("star")}_Last Online:_ **${Functions.formatDate(result.last_online)}**\n` +
                `${discord.getEmoji("star")}_Join Date:_ **${Functions.formatDate(result.joined)}**\n` +
                `${discord.getEmoji("star")}_Birthday:_ **${Functions.formatDate(result.birthday)}**\n` +
                `${discord.getEmoji("star")}_Location:_ **${result.location}**\n` +
                `${discord.getEmoji("star")}_Days Watched:_ **${result.statistics.anime.days_watched}**\n` +
                `${discord.getEmoji("star")}_Episodes Watched:_ **${result.statistics.anime.episodes_watched}**\n` +
                `${discord.getEmoji("star")}_Entries:_ **${result.statistics.anime.total_entries}**\n` +
                `${discord.getEmoji("star")}_Favorite Anime:_ ${Functions.checkChar(anime.join(", "), 100, " ")}\n` +
                `${discord.getEmoji("star")}_Favorite Characters:_ ${Functions.checkChar(characters.join(", "), 100, " ")}\n` +
                `${discord.getEmoji("star")}_Description:_ ${Functions.checkChar(cleanText, 1500, " ")}\n`
            )
            return this.reply(malEmbed)

        }

        let result: any
        let query = this.anime || Functions.combineArgs(args, 1)
        if (!query) {
            result = await axios.get(`https://api.jikan.moe/v4/top/anime`).then((r) => r.data.data)
        } else {
            if (query.match(/myanimelist.net/)) {
                query = query.match(/(?<=\/)(?:.(?!\/))+$/)[0].replace(/_/g, " ")
            }
            result = await axios.get(`https://api.jikan.moe/v4/anime?q=${query.trim()}`).then((r) => r.data.data)
        }

        const malArray: any = []
        for (let i = 0; i < Math.min(10, result.length); i++) {
            const malEmbed = embeds.createEmbed()
            const anime = result[i]
            malEmbed
            .setAuthor({name: "my anime list", iconURL: "https://kisaragi.moe/assets/embed/mal.png", url: "https://myanimelist.net/"})
            .setTitle(`**My Anime List Search** ${discord.getEmoji("raphi")}`)
            .setURL(anime.url)
            .setImage(anime.images.jpg.image_url)
            .setThumbnail("https://kisaragi.moe/assets/embed/mal.png")
            .setDescription(
                `${discord.getEmoji("star")}_Anime:_ **${anime.title}**\n` +
                `${discord.getEmoji("star")}_Episodes:_ **${anime.episodes}**\n` +
                `${discord.getEmoji("star")}_Start Date:_ **${Functions.formatDate(anime.aired.from)}**\n` +
                `${discord.getEmoji("star")}_End Date:_ **${Functions.formatDate(anime.aired.to)}**\n` +
                `${discord.getEmoji("star")}_Members:_ **${anime.members}**\n` +
                `${discord.getEmoji("star")}_Score:_ **${anime.score}**\n` +
                `${discord.getEmoji("star")}_Rank:_ **${anime.rank}**\n` +
                `${discord.getEmoji("star")}_Popularity:_ **${anime.popularity}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${Functions.checkChar(anime.synopsis, 1700, ".")}\n`
            )
            malArray.push(malEmbed)
        }
        return embeds.createReactionEmbed(malArray, true, true)
    }
}
