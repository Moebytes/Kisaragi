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

export default class Itunes extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches the itunes store for tracks.",
            help:
            `
            \`itunes query\` - Searches itunes with the query.
            `,
            examples:
            `
            \`=>itunes anime\`
            `,
            aliases: [],
            random: "string",
            cooldown: 15,
            defer: true,
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
        const headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
        const query = Functions.combineArgs(args, 1).trim()

        if (!query) {
            return this.noQuery(embeds.createEmbed()
            .setAuthor({name: "itunes", iconURL: "https://kisaragi.moe/assets/embed/itunes.png", url: "https://fnd.io/"})
            .setTitle(`**Itunes Search** ${discord.getEmoji("raphiSmile")}`))
        }

        const url = `https://itunes.apple.com/search?country=US&entity=song&explicit=no&lang=en&media=music&term=${query}`
        const response = await axios.get(url, {headers}).then((r) => r.data)
        const itunesArray: EmbedBuilder[] = []
        for (let i = 0; i < response.results.length; i++) {
            const track = response.results[i]
            const minutes = Math.floor(track.trackTimeMillis / 60000)
            const seconds = Math.floor((track.trackTimeMillis % (minutes*60000)) / 1000)
            const itunesEmbed = embeds.createEmbed()
            itunesEmbed
            .setAuthor({name: "itunes", iconURL: "https://kisaragi.moe/assets/embed/itunes.png", url: "https://fnd.io/"})
            .setTitle(`**Itunes Search** ${discord.getEmoji("raphiSmile")}`)
            .setImage(track.artworkUrl100)
            .setURL(track.trackViewUrl)
            .setDescription(
                `${discord.getEmoji("star")}_Track:_ **[${track.trackName}](${track.trackViewUrl})**\n` +
                `${discord.getEmoji("star")}_Artist:_ **[${track.artistName}](${track.artistViewUrl})**\n` +
                `${discord.getEmoji("star")}_Collection:_ **[${track.collectionName}](${track.collectionViewUrl})**\n` +
                `${discord.getEmoji("star")}_Genre:_ **${track.primaryGenreName}**\n` +
                `${discord.getEmoji("star")}_Release Date:_ **${Functions.formatDate(track.releaseDate)}**\n` +
                `${discord.getEmoji("star")}_Price:_ **$${track.trackPrice}**\n` +
                `${discord.getEmoji("star")}_Length:_ **${minutes}m ${seconds}s**\n` +
                `[**Preview**](${track.previewUrl})`
            )
            itunesArray.push(itunesEmbed)
        }

        if (!itunesArray[0]) {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "itunes", iconURL: "https://kisaragi.moe/assets/embed/itunes.png", url: "https://fnd.io/"})
            .setTitle(`**Itunes Search** ${discord.getEmoji("raphiSmile")}`))
        }

        if (itunesArray.length === 1) {
            return this.reply(itunesArray[0])
        } else {
            return embeds.createReactionEmbed(itunesArray)
        }
    }
}
