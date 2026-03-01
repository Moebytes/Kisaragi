 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

const xkcd = require("xkcd")

const monthNames = [
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
]

export default class Xkcd extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for an xkcd comic.",
            help:
            `
            \`xkcd\` - Posts the most recent comic
            \`xkcd id/url\` - Gets a comic by id or url
            \`xkcd today\` - Posts today's comic
            `,
            examples:
            `
            \`=>xkcd\`
            \`=>xkcd 42\`
            `,
            aliases: [],
            random: "none",
            cooldown: 5,
            defer: true,
            subcommandEnabled: true
        })
        const idOption = new SlashCommandOption()
            .setType("string")
            .setName("id")
            .setDescription("Can be an id/url/today.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(idOption)
    }

    public getComic = async (id?: number) => {
        let comic = "" as any
        await new Promise<void>((resolve) => {
            if (id) {
                xkcd(id, (c: any) => {
                    comic = c
                    resolve()
                })
            } else {
                xkcd((c: any) => {
                    comic = c
                    resolve()
                })
            }
        })
        return comic
    }

    public getEmbed = (comic: any) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const xkcdEmbed = embeds.createEmbed()
        const cleanText = comic.transcript.replace(/\[\[/g, "**").replace(/\]\]/g, "**").replace(/{{/g, "_").replace(/}}/g, "_")
        const checkedText = Functions.checkChar(cleanText, 2000, ",")
        xkcdEmbed
        .setAuthor({name: "xkcd", iconURL: "https://kisaragi.moe/assets/embed/xkcd.png", url: "https://xkcd.com/"})
        .setURL(`https://xkcd.com/${comic.num}/`)
        .setTitle(`**xkcd Comic** ${discord.getEmoji("kannaSpook")}`)
        .setDescription(
        `${discord.getEmoji("star")}_Title:_ **${comic.title}**\n` +
        `${discord.getEmoji("star")}_ID:_ **${comic.num}**\n` +
        `${discord.getEmoji("star")}_Date:_ **${monthNames[comic.month]} ${comic.day}, ${comic.year}**\n` +
        `${discord.getEmoji("star")}_Transcript_: ${checkedText ? checkedText : "None"}\n`
        )
        .setThumbnail(message.author!.displayAvatarURL())
        .setImage(comic.img)
        return xkcdEmbed
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)

        if (args[1] === "today") {
            const comic = await this.getComic()
            const xkcdEmbed = this.getEmbed(comic)
            return this.reply(xkcdEmbed)
        } else if (args[1]) {
            let id = args[1]
            if (args[1].match(/xkcd.com/)) {
                id = args[1].match(/\d+/)![0]
            }
            if (Number.isNaN(Number(id))) return message.reply(`Looks like the id is invalid...`)
            const comic = await this.getComic(Number(id))
            const xkcdEmbed = this.getEmbed(comic)
            return this.reply(xkcdEmbed)
        } else {
            const c = await this.getComic()
            const random = Math.floor(Math.random() * c.num)
            const comic = await this.getComic(random)
            const xkcdEmbed = this.getEmbed(comic)
            return this.reply(xkcdEmbed)
        }
    }
}
