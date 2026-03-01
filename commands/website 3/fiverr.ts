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

export default class Fiverr extends Command {
    private readonly headers = {
        "cookie": "u_guid=1739385757000-e307bd15b381ace120214960294ae574f4949a5d; logged_out_currency=USD; redirect_url=%2Fsearch%2Fgigs%3Fquery%3Danime%26source%3Dtop-bar%26search_in%3Deverywhere%26search-autocomplete-original-term%3Danime; _pxhd=Xab1Zi/BwTASLxvKeJnuKjMDHJ9ayYusDsTakdhOZBsIkvaMYYgpOI8xGnPaGJLOSSuiOv2qMQpXmgxY11D1Fg==:8fiWSLRkzfaEIBZgHLa7hVsdJT0IRCtp/ZD2VTdZGaxnbPII1p6MSu8gvrwiM196JHB7EwzZ0Qpwr6WdIZW78ATXwlyMkhi4wryF1I4bCcg=; _cfuvid=G_aUFI4VGTIlxUAbJ9yvjZmaLlE1NxxsFgDU4qJY1V4-1739385757178-0.0.1.1-604800000; forterToken=f2f3f74cf7af4fef95cf5b6ead6e216e_1739385757455_111_UAS9_17ck; page_views=1; g_state={\"i_p\":1739392961743,\"i_l\":1}",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"
    }
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for gigs on fiverr.",
            help:
            `
            \`fiverr query\` - Searches for gigs
            `,
            examples:
            `
            \`=>fiverr anime\`
            `,
            aliases: [],
            random: "none",
            cooldown: 10,
            unlist: true,
            subcommandEnabled: false
        })
        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("can be a query.")
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
        let query = Functions.combineArgs(args, 1).trim()
        if (!query) query = "anime"
        const h = {path: `/search/gigs?query=${query}&source=top-bar&search_in=everywhere&search-autocomplete-original-term=${query}`, referer: "https://www.fiverr.com/?source=top_nav"}
        const searchURL = `https://www.fiverr.com/search/gigs?query=${query}&source=top-bar&search_in=everywhere&search-autocomplete-original-term=${query}`
        const html = await axios.get(searchURL, {headers: {...this.headers, ...h}}).then((r) => r.data)
        const json = JSON.parse(html.match(/(?<=<script type="application\/json" id="perseus-initial-props">)(.|\n)*(?=<\/script>)/gm)?.[0])
        console.log(json)
        const gigs = json.listings.gigs
        const max = gigs.length > 10 ? 10 : gigs.length

        const fiverrArray: EmbedBuilder[] = []
        for (let i = 0; i < max; i++) {
            const gig = gigs[i]
            const url = `https://www.fiverr.com${gig.gig_url}`
            const h = {path: gig.gig_url, referer: searchURL}
            const html2 = await axios.get(url, {headers: {...this.headers, ...h}}).then((r) => r.data)
            const match = html2.match(/({"loggerOptions":)((.|\n)*?)(?=\);)/gm)?.[0]
            if (!match) continue
            const json2 = JSON.parse(match)
            const country = json2.sellerCard.country
            const specialty = json2.sellerCard.oneLiner
            const sellerDesc = Functions.checkChar(json2.sellerCard.description, 300, " ")
            const desc = Functions.checkChar(Functions.decodeEntities(Functions.cleanHTML(json2.description.content)), 1000, " ")
            const fiverrEmbed = embeds.createEmbed()
            fiverrEmbed
            .setAuthor({name: "fiverr", iconURL: "https://fiverr-res.cloudinary.com/t_profile_original,q_auto,f_auto/profile/photos/41433645/original/fiverr-logo.png", url: "https://www.fiverr.com/"})
            .setTitle(`**Fiverr Search** ${discord.getEmoji("tohruThink")}`)
            .setURL(url)
            .setThumbnail(gig.seller_img)
            .setImage(gig.assets?.[0]?.cloud_img_main_gig ?? "")
            .setDescription(
                `${discord.getEmoji("star")}_Gig:_ **I will ${gig.title}**\n` +
                `${discord.getEmoji("star")}_Seller:_ [**${gig.seller_name}**](https://www.fiverr.com${gig.seller_url})\n` +
                `${discord.getEmoji("star")}_Country:_ **${country}**\n` +
                `${discord.getEmoji("star")}_Specialty:_ **${specialty}**\n` +
                `${discord.getEmoji("star")}_Reviews:_ **${gig.buying_review_rating_count}**\n` +
                `${discord.getEmoji("star")}_Rating:_ **${gig.buying_review_rating.toFixed(2)}**\n` +
                `${discord.getEmoji("star")}_Price:_ **$${gig.price_i}**\n` +
                `${discord.getEmoji("star")}_Seller Desc:_ ${sellerDesc}\n` +
                `${discord.getEmoji("star")}_About This Gig:_ ${desc}\n`
            )
            fiverrArray.push(fiverrEmbed)
        }
        if (fiverrArray.length === 1) {
            await this.reply(fiverrArray[0])
        } else {
            embeds.createReactionEmbed(fiverrArray)
        }
        return
    }
}