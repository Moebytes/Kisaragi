import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {CommandFunctions} from "./../../structures/CommandFunctions"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

interface CrunchyrollSeason {
    search_metadata: { 
        score: number 
    },
    description: string
    images: { 
        poster_tall: [[{height: number, source: string, type: string, width: number}]], 
        poster_wide: [[{height: number, source: string, type: string, width: number}]]
    },
    series_metadata: {
        audio_locales: any[],
        availability_notes: string
        content_descriptors: string[]
        episode_count: number
        extended_description: string
        extended_maturity_rating: any[]
        is_dubbed: boolean
        is_mature: boolean
        is_simulcast: boolean
        is_subbed: boolean
        mature_blocked: boolean
        maturity_ratings: any[]
        season_count: number
        series_launch_year: 2023,
        subtitle_locales: any[]
        tenant_categories: any[]
    },
    slug_title: string
    type: string
    new: boolean
    promo_title: string
    channel_id: string
    promo_description: string
    id: string
    slug: '',
    external_id: string
    linked_resource_key: string
    title: string
}

export default class Crunchyroll extends Command {
    private readonly headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for an anime on crunchyroll.",
            help:
            `
            \`crunchyroll url/query\` - Searches crunchyroll for the url/query.
            `,
            examples:
            `
            \`=>crunchyroll konosuba\`
            `,
            aliases: ["cr", "crunchy"],
            random: "string",
            cooldown: 10,
            defer: true,
            unlist: true,
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

    public getEmbed = async (season: CrunchyrollSeason) => {
        const discord = this.discord
        const embeds = new Embeds(discord, this.message)
        const crunchyEmbed = embeds.createEmbed()
        crunchyEmbed
        .setAuthor({name: "crunchyroll", iconURL: "https://kisaragi.moe/assets/embed/crunchyroll.png", url: "https://www.crunchyroll.com/"})
        .setTitle(`**Crunchyroll Search** ${discord.getEmoji("himeHappy")}`)
        .setImage(season.images.poster_wide[0][season.images.poster_wide[0].length - 1].source)
        .setThumbnail(season.images.poster_tall[0][season.images.poster_tall[0].length - 1].source)
        .setURL(`https://www.crunchyroll.com/series/${season.id}/${season.slug}`)
        .setDescription(
            `${discord.getEmoji("star")}_Anime:_ **${season.title}**\n` +
            `${discord.getEmoji("star")}_Year:_ **${season.series_metadata.series_launch_year}**\n` +
            `${discord.getEmoji("star")}_Episodes:_ **${season.series_metadata.episode_count}**\n` +
            `${discord.getEmoji("star")}_Genres:_ ${season.series_metadata.tenant_categories.join(", ")}\n` +
            `${discord.getEmoji("star")}_Description:_ ${Functions.checkChar(season.description, 1300, " ")}\n`
        )
        return crunchyEmbed
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const cmd = new CommandFunctions(discord, message)
        const perms = new Permission(discord, message)
        const query = Functions.combineArgs(args, 1).trim()

        if (!query) {
            return this.noQuery(embeds.createEmbed())
        }

        const results = await fetch(`https://www.crunchyroll.com/content/v2/discover/search?q=${query}`, {headers: {Authorization: `Bearer ${process.env.CRUNCHYROLL_TOKEN}`}}).then((r) => r.json())
        const shows = results.data?.[0].items

        if (!shows?.length) {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "crunchyroll", iconURL: "https://kisaragi.moe/assets/embed/crunchyroll.png", url: "https://www.crunchyroll.com/"})
            .setTitle(`**Crunchyroll Search** ${discord.getEmoji("himeHappy")}`))
        }

        const crunchyArray: EmbedBuilder[] = []
        for (let i = 0; i < shows.length; i++) {
            const crunchyEmbed = await this.getEmbed(shows[i])
            crunchyArray.push(crunchyEmbed)
        }
        return embeds.createReactionEmbed(crunchyArray, false, true)
    }
}
