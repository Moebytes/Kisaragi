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

export default class Trace extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for the exact scene of an anime picture using trace.moe.",
            help:
            `
            \`trace url?\` - Searches the last posted image, or the image from the url
            `,
            examples:
            `
            \`=>trace\`
            `,
            aliases: ["animescene"],
            random: "string",
            cooldown: 10,
            voteLocked: true,
            subcommandEnabled: true
        })
        const urlOption = new SlashCommandOption()
            .setType("string")
            .setName("url")
            .setDescription("Optional url to search for, or will use last posted image.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(urlOption)
    }

    public getSeason = (season: string) => {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        const args = season.split("-")
        return `${months[Number(args[1]) - 1]} ${args[0]}`
    }

    public getTime = (time: number) => {
        return `${(time/60).toFixed(2)}`.replace(".", ":")
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        let url = Functions.combineArgs(args, 1)
        if (!url) url = await discord.fetchLastAttachment(message, false, /.(png|jpg)/) as string
        if (!url) return this.reply(`What image do you want to trace ${discord.getEmoji("kannaFacepalm")}`)
        const headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36"}

        const json = await axios.get(`https://api.trace.moe/search?url=${url}`, {headers}).then((r) => r.data)
        if (!json?.result) return this.reply(`No search results found ${discord.getEmoji("aquaCry")}`)

        const traceArray: EmbedBuilder[] = []
        for (let i = 0; i < json.result.length; i++) {
            const trace = json.result[i]
            if (trace.is_adult) {
                if (!perms.checkNSFW(true)) continue
            }
            const image = trace.image
            const video = trace.video
            const videoMuted = trace.video + `&mute`
            const traceEmbed = embeds.createEmbed()
            traceEmbed
            .setURL(video)
            .setAuthor({name: "trace.moe", iconURL: "https://kisaragi.moe/assets/embed/trace.png", url: "https://trace.moe/"})
            .setTitle(`Anime Scene Search ${discord.getEmoji("vigneXD")}`)
            .setImage(image)
            .setDescription(
                `${discord.getEmoji("star")}_Name:_ **${trace.filename}**\n` +
                `${discord.getEmoji("star")}_Episode:_ **${trace.episode}**\n` +
                `${discord.getEmoji("star")}_Similarity:_ **${(trace.similarity * 100).toFixed(2)}%**\n` +
                `${discord.getEmoji("star")}_Scene:_ \`${this.getTime(trace.from)} - ${this.getTime(trace.to)}\`\n` +
                `[**Video**](${video})\n` +
                `[**Video Muted**](${videoMuted})\n` +
                `[**AniList**](https://anilist.co/anime/${trace.anilist})\n`
            )
            traceArray.push(traceEmbed)
        }

        if (!traceArray[0]) {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "trace.moe", iconURL: "https://kisaragi.moe/assets/embed/trace.png", url: "https://trace.moe/"})
            .setTitle(`Anime Scene Search ${discord.getEmoji("vigneXD")}`))
        }
        if (traceArray.length === 1) {
            return this.reply(traceArray[0])
        } else {
            return embeds.createReactionEmbed(traceArray, true, true)
        }
    }
}
