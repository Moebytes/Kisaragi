 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import axios from "axios"
import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Yelp extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for businesses on yelp.",
            help:
            `
            _Note: Put the location in brackets. Default is New York City._
            \`yelp query [location?]\` - Search for businesses in the location
            `,
            examples:
            `
            \`=>yelp mcdonalds\`
            `,
            aliases: [],
            random: "none",
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("Can be a query and [location].")

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
        const text = Functions.combineArgs(args, 1)
        const location = text?.match(/(?<=\[)(.*?)(?=\])/)?.[0] ?? "New York City"
        const term = text?.replace(/(\[)(.*?)(\])/, "").trim() ?? ""

        const headers = {
            "authorization": `Bearer ${process.env.YELP_API_KEY}`,
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"
        }

        const json = await axios.get(`https://api.yelp.com/v3/businesses/search?term=${term}&location=${location}&sort_by=review_count`, {headers}).then((r) => r.data)

        const yelpArray: EmbedBuilder[] = []
        for (let i = 0; i < json.businesses.length; i++) {
            const business = json.businesses[i]
            const reviewJSON = await axios.get(`https://api.yelp.com/v3/businesses/${business.id}/reviews`, {headers}).then((r) => r.data.reviews)
            let reviews = `${discord.getEmoji("star")}_Reviews:_\n`
            for (let j = 0; j < reviewJSON.length; j++) {
                const review = reviewJSON[j]
                reviews += `**${review.user.name}** - ${review.text}\n`
            }
            const yelpEmbed = embeds.createEmbed()
            .setAuthor({name: "yelp", iconURL: "https://kisaragi.moe/assets/embed/yelp.png", url: "https://www.yelp.com/"})
            .setTitle(`**Yelp Search** ${discord.getEmoji("aquaUp")}`)
            .setThumbnail(business.image_url)
            .setURL(business.url)
            .setDescription(
                `${discord.getEmoji("star")}_Name:_ **${business.name}**\n` +
                `${discord.getEmoji("star")}_Address:_ \`${business.location.display_address.join(" ")}\`\n` +
                `${discord.getEmoji("star")}_Coordinates:_ \`${business.coordinates.latitude.toFixed(2)}, ${business.coordinates.longitude.toFixed(2)}\`\n` +
                `${discord.getEmoji("star")}_Phone Number:_ \`${business.display_phone}\`\n` +
                `${discord.getEmoji("star")}_Price:_ **${business.price}**\n` +
                `${discord.getEmoji("star")}_Ratings:_ **${business.rating}**\n` +
                `${discord.getEmoji("star")}_Review Count:_ **${business.review_count}**\n` +
                `${discord.getEmoji("star")}_Transactions:_ ${business.transactions?.[0] ? business.transactions.join(", ") : "N/A"}\n` +
                Functions.checkChar(reviews, 1000, "")
            )
            yelpArray.push(yelpEmbed)
        }

        if (!yelpArray[0]) {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "yelp", iconURL: "https://kisaragi.moe/assets/embed/yelp.png", url: "https://www.yelp.com/"})
            .setTitle(`**Yelp Search** ${discord.getEmoji("aquaUp")}`))
        }
        if (yelpArray.length === 1) {
            return this.reply(yelpArray[0])
        } else {
            return embeds.createReactionEmbed(yelpArray)
        }
    }
}
