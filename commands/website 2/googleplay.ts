import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class GooglePlay extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for apps on the google play store.",
            help:
            `
            \`googleplay query\` - Searches google play with the query.
            `,
            examples:
            `
            \`=>googleplay discord\`
            `,
            aliases: ["gplay", "playstore"],
            random: "string",
            cooldown: 15,
            defer: true,
            unlist: true,
            subcommandEnabled: false
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
        const perms = new Permission(discord, message)
        const term = Functions.combineArgs(args, 1).trim()

        if (!term) {
            return this.noQuery(embeds.createEmbed()
            .setAuthor({name: "google play", iconURL: "https://kisaragi.moe/assets/embed/googleplay.png", url: "https://play.google.com/store?hl=en_US"})
            .setTitle(`**Google Play Search** ${discord.getEmoji("poiHug")}`))
        }

        const playstore = require("google-play-scraper")

        const res = await playstore.search({term, num: 50, fullDetail: true})
        const playArray: EmbedBuilder[] = []
        for (let i = 0; i < res.length; i++) {
            const app = res[i]
            const playEmbed = embeds.createEmbed()
            playEmbed
            .setAuthor({name: "google play", iconURL: "https://kisaragi.moe/assets/embed/googleplay.png", url: "https://play.google.com/store?hl=en_US"})
            .setTitle(`**Google Play Search** ${discord.getEmoji("poiHug")}`)
            .setURL(app.url)
            .setThumbnail(app.icon)
            .setImage(app.headerImage)
            .setDescription(
                `${discord.getEmoji("star")}_App:_ **${app.title}**\n` +
                `${discord.getEmoji("star")}_Developer:_ **${app.developer}**\n` +
                `${discord.getEmoji("star")}_Summary:_ **${app?.summary?.replace(/&lt;/g, "<")?.replace(/&gt;/g, ">") ?? "None"}**\n` +
                `${discord.getEmoji("star")}_Release Date:_ **${app.released}**\n` +
                `${discord.getEmoji("star")}_Installs:_ **${app.installs}**\n` +
                `${discord.getEmoji("star")}_Ratings:_ **${app.ratings}**\n` +
                `${discord.getEmoji("star")}_Reviews:_ **${app.reviews}**\n` +
                `${discord.getEmoji("star")}_Price:_ **$${app.price}**\n` +
                `${discord.getEmoji("star")}_Developer Website:_ ${app.developerWebsite}\n` +
                `${discord.getEmoji("star")}_Description:_ ${Functions.checkChar(app.description ?? "None", 600, " ")}\n` +
                `${discord.getEmoji("star")}_Recent Changes:_ ${Functions.checkChar(Functions.cleanHTML(app.recentChanges ?? "None"), 300, " ")}\n` +
                `${discord.getEmoji("star")}_Comments:_ ${Functions.checkChar(app.comments?.join(" ") ?? "None", 100, " ")}`
            )
            playArray.push(playEmbed)
        }

        if (!playArray[0]) {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "google play", iconURL: "https://kisaragi.moe/assets/embed/googleplay.png", url: "https://play.google.com/store?hl=en_US"})
            .setTitle(`**Google Play Search** ${discord.getEmoji("poiHug")}`))
        }

        if (playArray.length === 1) {
            return this.reply(playArray[0])
        } else {
            return embeds.createReactionEmbed(playArray, true, true)
        }
    }
}
