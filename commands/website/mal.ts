import type {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import Jikan from "jikan-node"

export default class Mal extends Command {
    private anime = null as any
    private character = null as any
    private user = null as any
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for anime, characters, and users on my anime list.",
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
            unlist: true,
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
        const mal = new Jikan()

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
            const result = await mal.search("character", query.trim())
            const malArray: EmbedBuilder[] = []
            for (let i = 0; i < result.results.length; i++) {
                const char = result.results[i]
                const detailed = await mal.findCharacter(char.mal_id)
                const info = char.anime.join("") ? char.anime.map((n: any) => n.name) : char.manga.map((n: any) => n.name)
                const malEmbed = embeds.createEmbed()
                malEmbed
                .setAuthor({name: "my anime list", iconURL: "https://kisaragi.moe/assets/embed/mal.png", url: "https://myanimelist.net/"})
                .setTitle(`**My Anime List Character** ${discord.getEmoji("raphi")}`)
                .setURL(char.url)
                .setImage(char.image_url)
                .setThumbnail("https://kisaragi.moe/assets/embed/mal.png")
                .setDescription(
                    `${discord.getEmoji("star")}_Character:_ **${char.name}**\n` +
                    `${discord.getEmoji("star")}_Kanji:_ **${detailed.name_kanji ? detailed.name_kanji : "None"}**\n` +
                    `${discord.getEmoji("star")}_Alternate Names:_ **${char.alternate_names ? char.alternate_names.join(", ") : "None"}**\n` +
                    `${discord.getEmoji("star")}_Series:_ ${info.join(", ")}\n` +
                    `${discord.getEmoji("star")}_Favorites:_ **${detailed.member_favorites}**\n` +
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
            const result = await mal.findUser(user)
            const anime = result.favorites.anime.map((a: any) => a.name)
            const characters = result.favorites.characters.map((c: any) => c.name)
            const cleanText = result.about.replace(/<\/?[^>]+(>|$)/g, "")
            malEmbed
            .setURL(result.url)
            .setImage(result.image_url)
            .setThumbnail("https://kisaragi.moe/assets/embed/mal.png")
            .setDescription(
                `${discord.getEmoji("star")}_User:_ **${result.username}**\n` +
                `${discord.getEmoji("star")}_Last Online:_ **${Functions.formatDate(result.last_online)}**\n` +
                `${discord.getEmoji("star")}_Join Date:_ **${Functions.formatDate(result.joined)}**\n` +
                `${discord.getEmoji("star")}_Birthday:_ **${Functions.formatDate(result.birthday)}**\n` +
                `${discord.getEmoji("star")}_Location:_ **${result.location}**\n` +
                `${discord.getEmoji("star")}_Days Watched:_ **${result.anime_stats.days_watched}**\n` +
                `${discord.getEmoji("star")}_Episodes Watched:_ **${result.anime_stats.episodes_watched}**\n` +
                `${discord.getEmoji("star")}_Entries:_ **${result.anime_stats.total_entries}**\n` +
                `${discord.getEmoji("star")}_Favorite Anime:_ ${Functions.checkChar(anime.join(", "), 100, " ")}\n` +
                `${discord.getEmoji("star")}_Favorite Characters:_ ${Functions.checkChar(characters.join(", "), 100, " ")}\n` +
                `${discord.getEmoji("star")}_Description:_ ${Functions.checkChar(cleanText, 1500, " ")}\n`
            )
            return this.reply(malEmbed)

        }

        let result: any
        let query = this.anime || Functions.combineArgs(args, 1)
        if (!query) {
            const raw = await mal.findTop("anime")
            result = raw.top
        } else {
            if (query.match(/myanimelist.net/)) {
                query = query.match(/(?<=\/)(?:.(?!\/))+$/)[0].replace(/_/g, " ")
            }
            const raw = await mal.search("anime", query.trim())
            result = raw.results
        }

        const malArray: any = []
        let max = result.length
        if (max > 20) max = 20
        for (let i = 0; i < max; i++) {
            const malEmbed = embeds.createEmbed()
            const anime = result[i]
            const detailed = await mal.findAnime(anime.mal_id)
            malEmbed
            .setAuthor({name: "my anime list", iconURL: "https://kisaragi.moe/assets/embed/mal.png", url: "https://myanimelist.net/"})
            .setTitle(`**My Anime List Search** ${discord.getEmoji("raphi")}`)
            .setURL(anime.url)
            .setImage(anime.image_url)
            .setThumbnail("https://kisaragi.moe/assets/embed/mal.png")
            .setDescription(
                `${discord.getEmoji("star")}_Anime:_ **${anime.title}**\n` +
                `${discord.getEmoji("star")}_Episodes:_ **${anime.episodes}**\n` +
                `${discord.getEmoji("star")}_Start Date:_ **${Functions.formatDate(anime.start_date)}**\n` +
                `${discord.getEmoji("star")}_End Date:_ **${Functions.formatDate(anime.end_date)}**\n` +
                `${discord.getEmoji("star")}_Members:_ **${anime.members}**\n` +
                `${discord.getEmoji("star")}_Score:_ **${anime.score}**\n` +
                `${discord.getEmoji("star")}_Rank:_ **${detailed.rank}**\n` +
                `${discord.getEmoji("star")}_Popularity:_ **${detailed.popularity}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${Functions.checkChar(detailed.synopsis, 1700, ".")}\n`
            )
            malArray.push(malEmbed)
        }
        return embeds.createReactionEmbed(malArray, true, true)
    }
}
