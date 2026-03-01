 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import axios from "axios"
import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Permission} from "../../structures/Permission"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Patreon extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for a patreon creator.",
            help:
            `
            \`patreon creator\` - Searches for the creator page of the creator.
            `,
            examples:
            `
            \`=>patreon creator\`
            `,
            aliases: [],
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const creatorOption = new SlashCommandOption()
            .setType("string")
            .setName("creator")
            .setDescription("The creator to search.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(creatorOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
        if (!perms.checkNSFW()) return

        let query = Functions.combineArgs(args, 1).trim()
        if (!query) {
            return this.noQuery(embeds.createEmbed()
            .setAuthor({name: "patreon", iconURL: "https://kisaragi.moe/assets/embed/patreon.png", url: "https://www.patreon.com/"})
            .setTitle(`**Patreon Search** ${discord.getEmoji("raphi")}`), "You must provide a creator name.")
        }
        if (query.match(/patreon.com/)) {
            query = query.match(/(?<=\/)(?:.(?!\/))+$/)![0]
        }
        const response = await axios.get(`https://www.patreon.com/${query}`, {headers})
        if (!response.data.match(/(?<=https:\/\/www.patreon.com\/api\/campaigns\/)(.*?)(?=")/)) {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "patreon", iconURL: "https://kisaragi.moe/assets/embed/patreon.png", url: "https://www.patreon.com/"})
            .setTitle(`**Patreon Search** ${discord.getEmoji("raphi")}`))
        }
        const id = response.data.match(/(?<=https:\/\/www.patreon.com\/api\/campaigns\/)(.*?)(?=")/)[0]
        const json = await axios.get(`https://www.patreon.com/api/campaigns/${id}`, {headers})
        const details = json.data.data.attributes
        const avatar = details.avatar_photo_url
        const cover = details.cover_photo_url
        const created = Functions.formatDate(details.created_at)
        const posts = details.creation_count
        const creating = details.creation_name
        const patrons = details.patron_count
        const sum = details.earnings_visibility	=== "private" ? "Private" : "$" + (details.pledge_sum / 100.0).toFixed(2)
        const description = Functions.cleanHTML(Functions.decodeEntities(details.summary)).replace(/\n+/, "\n")
        const url = details.url
        const fb = json.data?.included[0]?.attributes?.facebook
        const tw = json.data?.included[0]?.attributes?.twitter
        const tc = json.data?.included[0]?.attributes?.twitch
        const yt = json.data?.included[0]?.attributes?.youtube
        const patreonEmbed = embeds.createEmbed()
        patreonEmbed
        .setAuthor({name: "patreon", iconURL: "https://kisaragi.moe/assets/embed/patreon.png", url: "https://www.patreon.com/"})
        .setTitle(`**Patreon Search** ${discord.getEmoji("raphi")}`)
        .setURL(url)
        .setImage(cover)
        .setThumbnail(avatar)
        .setDescription(
            `${discord.getEmoji("star")}_Creator:_ **${details.name}**\n` +
            `${discord.getEmoji("star")}_Is Creating:_ **${creating}**\n` +
            `${discord.getEmoji("star")}_Creation Date:_ **${created}**\n` +
            `${discord.getEmoji("star")}_Posts:_ **${posts}**\n` +
            `${discord.getEmoji("star")}_Patrons:_ **${patrons}**\n` +
            `${discord.getEmoji("star")}_Monthly Earnings:_ **${sum}**\n` +
            `${discord.getEmoji("star")}_Youtube:_ ${yt ? yt : "None"}\n` +
            `${discord.getEmoji("star")}_Twitter:_ ${tw ? `https://www.twitter.com/${tw}` : "None"}\n` +
            `${discord.getEmoji("star")}_Twitch:_ ${tc ? tc : "None"}\n` +
            `${discord.getEmoji("star")}_Facebook:_ ${fb ? fb : "None"}\n` +
            `${discord.getEmoji("star")}_Description:_ ${Functions.checkChar(description, 1700, " ")}`
        )
        return this.reply(patreonEmbed)
    }
}
