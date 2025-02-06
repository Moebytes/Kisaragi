import axios from "axios"
import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Steam extends Command {
    private readonly headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches the steam store.",
            help:
            `
            \`steam query\` - Searches steam.
            `,
            examples:
            `
            \`=>steam anime\`
            `,
            aliases: [],
            random: "none",
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

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        let term = Functions.combineArgs(args, 1)
        if (!term) term = "anime"
        const data = await axios.get(`https://store.steampowered.com/api/storesearch/?term=${term}&l=english&cc=US`, {headers: this.headers}).then((r) => r.data)
        if (!data.items?.[0]) {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "steam", iconURL: "https://kisaragi.moe/assets/embed/steam.png", url: "https://store.steampowered.com/"})
            .setTitle(`**Steam Store Search** ${discord.getEmoji("gabYes")}`))
        }
        const ids = data.items.map((i: any) => i.id)
        const steamArray: EmbedBuilder[] = []
        for (let i = 0; i < ids.length; i++) {
            const details = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${ids[i]}`, {headers: this.headers}).then((r) => r.data[ids[i]].data)
            const price = details.price_overview ? details.price_overview.final_formatted : "$0"
            const desc = Functions.checkChar(Functions.decodeEntities(Functions.cleanHTML(details.about_the_game)), 1000, " ")
            const steamEmbed = embeds.createEmbed()
            steamEmbed
            .setAuthor({name: "steam", iconURL: "https://kisaragi.moe/assets/embed/steam.png", url: "https://store.steampowered.com/"})
            .setTitle(`**Steam Store Search** ${discord.getEmoji("gabYes")}`)
            .setURL(`https://store.steampowered.com/app/${details.steam_appid}/`)
            .setImage(details.header_image)
            .setDescription(
                `${discord.getEmoji("star")}_Game:_ **${details.name}**\n` +
                `${discord.getEmoji("star")}_Mini Desc:_ ${details.short_description}\n` +
                `${discord.getEmoji("star")}_Release Date:_ **${details.release_date.date ? details.release_date.date : "Coming Soon"}**\n` +
                `${discord.getEmoji("star")}_Price:_ **${price}**\n` +
                `${discord.getEmoji("star")}_Publishers:_ **${details.publishers.join(", ")}**\n` +
                `${discord.getEmoji("star")}_Developers:_ **${details.developers.join(", ")}**\n` +
                `${discord.getEmoji("star")}_Genres:_ **${details.genres.map((g: any) => g.description).join(", ")}**\n` +
                `${discord.getEmoji("star")}_Achievements:_ **${details.achievements?.total ?? 0}**\n` +
                `${discord.getEmoji("star")}_Movie:_ ${details.movies?.[0]?.webm?.max ? `[**Link**](${details.movies[0].webm.max})` : "**None**"}\n` +
                `${discord.getEmoji("star")}_Website:_ **${details.website ? details.website : "None"}**\n` +
                `${discord.getEmoji("star")}_Support:_ **${details.support_info?.url ? details.support_info?.url : (details.support_info?.email ?? "None")}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${desc}\n`
            )
            steamArray.push(steamEmbed)
        }
        if (steamArray.length === 1) {
            return this.reply(steamArray[0])
        } else {
            return embeds.createReactionEmbed(steamArray, true, true)
        }
    }
}
