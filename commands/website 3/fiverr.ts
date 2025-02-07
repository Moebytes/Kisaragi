import axios from "axios"
import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"

export default class Fiverr extends Command {
    private readonly headers = {
        "authority": "www.fiverr.com",
        "method": "GET",
        "scheme": "https",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "cookie": "__cfduid=d58fa79ad9a90c1a570ea20203df712041588807562; _pxhd=cfaaf18e9117d5f5b61514ce42c39c8e5a1cb5b4c3efc31f85f2cd192dc4af1d:f3851691-8ff0-11ea-9be9-e1100a0583b0; logged_out_currency=USD; u_guid=ceea14e9-47f2-4a09-84fb-456c5a5487d6; pv_monthly=1%3B1%3B1; last_content_pages_=users%7C%7C%7Cshow%7C%7C%7Cimtenpi%3B; visited_fiverr=true; _fiverr_session_key=9255eac29bd344d02c8b00ec4ff40dd3; __cfruid=58fb95774b4b7b8af4c916cc29bfbd77a246d01e-1588807563; _gcl_au=1.1.253808082.1588807569; _pxvid=f3851691-8ff0-11ea-9be9-e1100a0583b0; _ga=GA1.2.510703574.1588807573; _gid=GA1.2.1362746301.1588807573; _pxde=3c678a76e2b344e93f070497cbf1d7a1eba36e8894f8fb59fc09db149e5126c4:eyJ0aW1lc3RhbXAiOjE1ODg4MDc1NzIxMjIsImZfa2IiOjAsImlwY19pZCI6W119; _dc_gtm_UA-12078752-1=1",
        "accept-language": "en-US,en;q=0.9",
        "if-none-match": "W/\"1e8930d9e33e15d19f1aea765f958bb5\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
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
        const json = JSON.parse(html.match(/({"loggerOptions":)((.|\n)*?)(}}}})/gm)?.[0])
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