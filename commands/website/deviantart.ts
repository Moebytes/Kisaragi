import DeviantArt, {DeviantArtSearchResults, DeviationRSS, DeviationRSSExtended} from "deviantart.ts"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import type {Message, EmbedBuilder} from "discord.js"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "./../../structures/Permission"

let deviantArray: EmbedBuilder[] = []

export default class Deviantart extends Command {
    private user = null as any
    private deviation = null as any
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for deviantart deviations and users.",
            help:
            `
            \`deviantart\` - Gets popular deviations by default.
            \`deviantart link\` - Gets the deviation from the link.
            \`deviantart query\` - Gets deviations from the query.
            \`deviantart user\` - Gets the profile of a user.
            \`deviantart gallery user\` - Gets the deviations from the user.
            \`deviantart daily date?\` - Gets daily deviations, optional date in yyyy-mm-dd format.
            \`deviantart hot category?\` - Gets hot deviations, optional category.
            \`deviantart new query?\` - Gets new deviations, optional query.
            \`deviantart popular query?\` - Gets popular deviations, optional query.
            `,
            examples:
            `
            \`=>deviantart anime\`
            \`=>deviantart user name\`
            \`=>deviantart daily 2019-07-03\`
            \`=>deviantart popular konosuba\`
            \`=>deviantart hot manga\`
            `,
            aliases: ["da", "deviant"],
            random: "none",
            cooldown: 30,
            voteLocked: true,
            defer: true,
            subcommandEnabled: true
        })
        const query2Option = new SlashCommandOption()
            .setType("string")
            .setName("query2")
            .setDescription("Can be a query/user/date.")

        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("Can be a query/user/gallery/daily/hot/new/popular.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(queryOption)
            .addOption(query2Option)
    }

    public createDeviantEmbed = async (deviantArt: DeviantArt, discord: Kisaragi, embeds: Embeds, result: DeviantArtSearchResults) => {
        const perms = new Permission(discord, this.message)
        if (!result.results[0]) {
            const badDeviantEmbed = embeds.createEmbed()
            .setAuthor({name: "deviantart", iconURL: "https://kisaragi.moe/assets/embed/deviantart.png", url: "https://www.deviantart.com/"})
            .setTitle(`**DeviantArt Search** ${discord.getEmoji("aquaUp")}`)
            this.invalidQuery(badDeviantEmbed, "Try searching for another tag or looking at the [**DeviantArt Website**](https://www.deviantart.com/)")
            return true
        }
        const extendedResults = await deviantArt.extendDeviations(result.results)
        for (let i = 0; i < extendedResults.length; i++) {
            const deviation = extendedResults[i]
            if (deviation.is_mature) {
                if (!perms.checkNSFW(true)) continue
                if (!perms.checkBotDev(true)) continue
            }
            if (!deviation.content) continue
            const deviantEmbed = embeds.createEmbed()
            deviantEmbed
            .setAuthor({name: "deviantart", iconURL: "https://kisaragi.moe/assets/embed/deviantart.png", url: "https://www.deviantart.com/"})
            .setTitle(`**DeviantArt Search** ${discord.getEmoji("aquaUp")}`)
            .setURL(deviation.url!)
            .setImage(deviation.content.src)
            .setThumbnail(deviation.author!.usericon)
            .setDescription(
                `${discord.getEmoji("star")}_Title:_ **${deviation.title}**\n` +
                `${discord.getEmoji("star")}_Author:_ **${deviation.author!.username}**\n` +
                `${discord.getEmoji("star")}_Category:_ **${deviation.category}**\n` +
                `${discord.getEmoji("star")}_Creation Date:_ **${Functions.formatDate(new Date((Number(deviation.published_time)) * 1000))}**\n` +
                `${discord.getEmoji("star")}_Comments:_ **${deviation.stats!.comments}**\n` +
                `${discord.getEmoji("star")}_Favorites:_ **${deviation.stats!.favourites ? deviation.stats!.favourites : 0}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${deviation.description ? Functions.checkChar(deviation.description, 700, ".") : "None"}\n`
            )
            deviantArray.push(deviantEmbed)
        }
        return false
    }

    public createRSSDeviantEmbed = (discord: Kisaragi, embeds: Embeds, result: DeviationRSSExtended[]) => {
        const perms = new Permission(discord, this.message)
        if (!result[0]) {
            const badDeviantEmbed = embeds.createEmbed()
            .setAuthor({name: "deviantart", iconURL: "https://kisaragi.moe/assets/embed/deviantart.png", url: "https://www.deviantart.com/"})
            .setTitle(`**DeviantArt Search** ${discord.getEmoji("aquaUp")}`)
            this.invalidQuery(badDeviantEmbed, "Try searching for another tag or looking at the [**DeviantArt Website**](https://www.deviantart.com/)")
            return true
        }
        for (let i = 0; i < result.length; i++) {
            const deviation = result[i]
            if (deviation.rating !== "nonadult") {
                if (!perms.checkNSFW(true)) continue
                if (!perms.checkBotDev(true)) continue
            }
            if (!deviation.content) continue
            const deviantEmbed = embeds.createEmbed()
            deviantEmbed
            .setAuthor({name: "deviantart", iconURL: "https://kisaragi.moe/assets/embed/deviantart.png", url: "https://www.deviantart.com/"})
            .setTitle(`**DeviantArt Search** ${discord.getEmoji("aquaUp")}`)
            .setURL(deviation.url!)
            .setImage(deviation.content[0].url)
            .setThumbnail(deviation?.author?.user?.usericon)
            .setDescription(
                `${discord.getEmoji("star")}_Title:_ **${deviation.title}**\n` +
                `${discord.getEmoji("star")}_Author:_ **${deviation?.author?.user?.username}**\n` +
                `${discord.getEmoji("star")}_Category:_ **${deviation.category}**\n` +
                `${discord.getEmoji("star")}_Creation Date:_ **${Functions.formatDate(new Date((Number(deviation.date)) * 1000))}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${deviation.description ? Functions.checkChar(deviation.description, 1900, ".") : "None"}\n`
            )
            deviantArray.push(deviantEmbed)
        }

    }

    public deviantQuery = async (deviantArt: DeviantArt, embeds: Embeds, query: string) => {
        const discord = this.discord
        let rssDeviations: DeviationRSS[]
        if (query.includes(".com")) {
            rssDeviations = [await deviantArt.rss.get(query)]
        } else {
            rssDeviations = await deviantArt.rss.search(query, 20)
        }
        if (!rssDeviations[0]) {
            const deviantEmbed = embeds.createEmbed()
            .setAuthor({name: "deviantart", iconURL: "https://kisaragi.moe/assets/embed/deviantart.png", url: "https://www.deviantart.com/"})
            .setTitle(`**DeviantArt Search** ${this.discord.getEmoji("aquaUp")}`)
            this.invalidQuery(deviantEmbed, "The url is invalid.")
            return false
        }
        const perms = new Permission(this.discord, this.message)
        const deviations = await deviantArt.extendRSSDeviations(rssDeviations)
        for (let i = 0; i < deviations.length; i++) {
            const deviation = deviations[i]
            if (deviation.rating !== "nonadult") {
                if (!perms.checkNSFW(true)) continue
                if (!perms.checkBotDev(true)) continue
            }
            const deviantEmbed = embeds.createEmbed()
                .setAuthor({name: "deviantart", iconURL: "https://kisaragi.moe/assets/embed/deviantart.png", url: "https://www.deviantart.com/"})
                .setTitle(`**DeviantArt Search** ${this.discord.getEmoji("aquaUp")}`)
                .setURL(deviation.url)
                .setImage(deviation.content[0].url)
                .setDescription(
                    `${discord.getEmoji("star")}_Title:_ **${deviation.title}**\n` +
                    `${discord.getEmoji("star")}_Author:_ **${deviation.author.user.username}**\n` +
                    `${discord.getEmoji("star")}_Category:_ **${deviation.category}**\n` +
                    `${discord.getEmoji("star")}_Creation Date:_ **${Functions.formatDate(new Date(deviation.date))}**\n` +
                    `${discord.getEmoji("star")}_Description:_ ${deviation.description ? Functions.checkChar(deviation.description, 1900, ".") : "None"}\n`
                )
            deviantArray.push(deviantEmbed)
        }
        if (deviantArray.length === 1) {
            return this.reply(deviantArray[0])
        } else {
            return embeds.createReactionEmbed(deviantArray, true, true)
        }
    }

    public run = async (args: string[]) => {
        deviantArray = []
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const deviantArt = await DeviantArt.login(process.env.DEVIANTART_CLIENT_ID!, process.env.DEVIANTART_CLIENT_SECRET!)
        if (!args[1]) args[1] = "popular"
        if (!perms.checkNSFW()) return

        if (args[1].match(/deviantart.com/)) {
            const matches = args[1].replace("www.", "").replace("https://deviantart.com", "").match(/(?<=\/)(.*?)(?=$|\/)/g)
            if (matches?.[1] === "art") {
                this.deviation = args[1]
            } else {
                this.user = matches?.[0]
            }
        }
        if (args[1] === "daily") {
            const result = (args[2]) ? await deviantArt.browse.daily({date: args[2]}) as DeviantArtSearchResults
            : await deviantArt.browse.daily() as DeviantArtSearchResults
            const invalid = await this.createDeviantEmbed(deviantArt, discord, embeds, result)
            if (invalid) return
            if (deviantArray.length === 1) {
                return this.reply(deviantArray[0])
            } else {
                return embeds.createReactionEmbed(deviantArray, true, true)
            }
        }

        if (args[1] === "hot") {
            const result = (args[2]) ? await deviantArt.browse.hot({category_path: args[2], limit: 24})
            : await deviantArt.browse.hot()

            const invalid = await this.createDeviantEmbed(deviantArt, discord, embeds, result)
            if (invalid) return
            if (deviantArray.length === 1) {
                return this.reply(deviantArray[0])
            } else {
                return embeds.createReactionEmbed(deviantArray, true, true)
            }
        }

        if (args[1] === "new") {
            const query = Functions.combineArgs(args, 2)
            const result = (query) ? await deviantArt.browse.newest({q: query, limit: 24})
            : await deviantArt.browse.newest()

            const invalid = await this.createDeviantEmbed(deviantArt, discord, embeds, result)
            if (invalid) return
            if (deviantArray.length === 1) {
                return this.reply(deviantArray[0])
            } else {
                return embeds.createReactionEmbed(deviantArray, true, true)
            }
        }

        if (args[1] === "popular") {
            const query = Functions.combineArgs(args, 2)
            const result = (query) ? await deviantArt.browse.popular({q: query, limit: 24})
            : await deviantArt.browse.popular()

            const invalid = await this.createDeviantEmbed(deviantArt, discord, embeds, result)
            if (invalid) return
            if (deviantArray.length === 1) {
                return this.reply(deviantArray[0])
            } else {
                return embeds.createReactionEmbed(deviantArray, true, true)
            }
        }

        if (this.user || args[1] === "user") {
            const deviantEmbed = embeds.createEmbed()
            deviantEmbed
            .setAuthor({name: "deviantart", iconURL: "https://kisaragi.moe/assets/embed/deviantart.png", url: "https://www.deviantart.com/"})
            .setTitle(`**DeviantArt User** ${discord.getEmoji("aquaUp")}`)
            if (!this.user && !args[2]) return this.noQuery(deviantEmbed, "You must provide a username.")
            const result = await deviantArt.user.profile({username: this.user || args[2]})
            deviantEmbed
            .setURL(result.profile_url)
            .setThumbnail(result.user.usericon)
            .setImage(result.cover_photo ? result.cover_photo : result.user.usericon)
            .setDescription(
                `${discord.getEmoji("star")}_User:_ **${result.user.username}**\n` +
                `${discord.getEmoji("star")}_Specialty:_ **${result.artist_specialty}**\n` +
                `${discord.getEmoji("star")}_Country:_ **${result.country}**\n` +
                `${discord.getEmoji("star")}_Website:_ **${result.website ? result.website : "None"}**\n` +
                `${discord.getEmoji("star")}_Deviations:_ **${result.stats.user_deviations}**\n` +
                `${discord.getEmoji("star")}_User Favorites:_ **${result.stats.user_favourites}**\n` +
                `${discord.getEmoji("star")}_User Comments:_ **${result.stats.user_comments}**\n` +
                `${discord.getEmoji("star")}_Page Views:_ **${result.stats.profile_pageviews}**\n` +
                `${discord.getEmoji("star")}_Profile Comments:_ **${result.stats.profile_comments}**\n` +
                `${discord.getEmoji("star")}_Tag Line:_ ${result.tagline ? result.tagline : "None"}\n` +
                `${discord.getEmoji("star")}_Description:_ ${Functions.checkChar(result.bio, 1800, ".")}\n`
            )
            return this.reply(deviantEmbed)
        }

        if (args[1] === "gallery") {
            const deviantEmbed = embeds.createEmbed()
            deviantEmbed
            .setAuthor({name: "deviantart", iconURL: "https://kisaragi.moe/assets/embed/deviantart.png", url: "https://www.deviantart.com/"})
            .setTitle(`**DeviantArt User** ${discord.getEmoji("aquaUp")}`)
            if (!args[2]) return this.noQuery(deviantEmbed, "You must provide a username.")
            const result = await deviantArt.gallery.all({username: args[2], limit: 24})
            const invalid = await this.createDeviantEmbed(deviantArt, discord, embeds, result)
            if (invalid) return
            if (deviantArray.length === 1) {
                return this.reply(deviantArray[0])
            } else {
                return embeds.createReactionEmbed(deviantArray, true, true)
            }
        }

        const query = Functions.combineArgs(args, 1).trim()
        const urlEmbed = await this.deviantQuery(deviantArt, embeds, query)
        if (urlEmbed) return
        const result = await deviantArt.rss.search(query, 50, "popular")
        const extended = await deviantArt.extendRSSDeviations(result)
        const invalid = this.createRSSDeviantEmbed(discord, embeds, extended)
        if (invalid) return
        if (deviantArray.length === 1) {
            return this.reply(deviantArray[0])
        } else {
            return embeds.createReactionEmbed(deviantArray, true, true)
        }
    }
}
