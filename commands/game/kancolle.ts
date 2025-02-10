import axios from "axios"
import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"
import fs from "fs"

export default class Kancolle extends Command {
    private readonly defaults = [
        "Fubuki", "Yuudachi", "Hibiki", "Shimakaze", "Akagi", "Kisaragi",
        "Kongou", "Kashima", "Ikazuchi", "Akatsuki", "Inazuma", "Yayoi",
        "Uzuki", "Urakaze", "Amatsukaze", "Kawakaze", "Tokitsukaze", "Harusame",
        "Etorofu", "Matsuwa", "Tsushima"
    ]
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Gets information on a kancolle ship girl.",
            help:
            `
            \`kancolle\` - Gets some handpicked girls
            \`kancolle shipgirl\` - Gets information on the shipgirl.
            `,
            examples:
            `
            \`=>kancolle fubuki\`
            \`=>kancolle hibiki\`
            `,
            aliases: ["kc", "kantai", "kantaicollection"],
            random: "none",
            cooldown: 10,
            subcommandEnabled: true
        })
        const girlOption = new SlashCommandOption()
            .setType("string")
            .setName("shipgirl")
            .setDescription("Shipgirl to search for.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(girlOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        if (discord.checkMuted(message)) if (!perms.checkNSFW()) return
        const headers = {
            "referer": "https://kancolle.fandom.com/",
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:135.0) Gecko/20100101 Firefox/135.0"
        }

        let query = Functions.combineArgs(args, 1)
        if (!query) {
            query = this.defaults[Math.floor(Math.random()*this.defaults.length)]
        }
        if (query.match(/kancolle.fandom.com/)) {
            query = query.replace("https://kancolle.fandom.com/wiki/", "")
        }
        const response = await axios.get(`https://kancolle.fandom.com/wiki/${query}`, {headers}).catch(() => null)
        if (!response) {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "kancolle", iconURL: "https://kisaragi.moe/assets/embed/kancolle.png"})
            .setTitle(`**Kancolle Search** ${discord.getEmoji("poiHug")}`))
        }
        const res = response.data
        const thumb = res.match(/(?<=<div class="infobox-ship-card"><a href=")(.*?)(?=")/gm)?.[0]
        const girl = res.match(/(?<=<title>)(\w+)(?=\s*\|)/gm)?.[0]
        const rawGallery = await axios.get(`https://kancolle.fandom.com/wiki/${girl}/Gallery`, {headers}).then((r) => r.data)
        const matches = rawGallery.match(/(https:\/\/static.wikia.nocookie.net\/kancolle\/images\/)(.*?)(.png)/g)
        let filtered = matches.filter((m: any)=> m.includes(girl))
        filtered = Functions.removeDuplicates(filtered)
        let rawDescription = res.match(/(?<=<span class="mw-headline" id="Trivia">Trivia)[\s\S]*?(?=<div class="ship-page-gallery">)/gm)?.[0]
        let description = rawDescription ? Functions.cleanHTML(rawDescription).replace("[]", "").trim() : ""

        const kancolleArray: EmbedBuilder[] = []
        for (let i = 0; i < filtered.length; i++) {
            const kancolleEmbed = embeds.createEmbed()
            kancolleEmbed
            .setAuthor({name: "kancolle", iconURL: "https://kisaragi.moe/assets/embed/kancolle.png"})
            .setTitle(`**Kancolle Search** ${discord.getEmoji("poiHug")}`)
            .setURL(`https://kancolle.fandom.com/wiki/${girl}`)
            .setThumbnail(thumb)
            .setImage(filtered[i])
            .setDescription(`${discord.getEmoji("star")}_Ship Girl:_ **${girl}**\n` + description)
            kancolleArray.push(kancolleEmbed)
        }
        if (kancolleArray.length === 1) {
            this.reply(kancolleArray[0])
        } else {
            embeds.createReactionEmbed(kancolleArray, true, true)
        }
    }
}
