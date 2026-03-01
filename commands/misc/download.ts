/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, AttachmentBuilder, TextChannel} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import fs from "fs"
import path from "path"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Images} from "./../../structures/Images"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Download extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Downloads images and gifs from a text channel.",
            help:
            `
            _Note:_ Gifs are excluded by default, but you can include them by adding "gif".
            The number must be between 1 and 1000, default is 300.
            \`download num?\` - Downloads the number of images in the text channel
            \`download gif num?\` - Includes gifs
            \`download id num?\` - Starts downloading from the message id
            \`download id gif num?\` - Includes gifs
            `,
            examples:
            `
            \`=>download 100\`
            \`=>download gif\`
            \`=>download gif 100\`
            `,
            aliases: ["dl"],
            cooldown: 10,
            premium: true,
            voteLocked: true,
            defer: true,
            subcommandEnabled: true
        })
        const num3Option = new SlashCommandOption()
            .setType("string")
            .setName("num3")
            .setDescription("The last chance to enter number of images.")

        const num2Option = new SlashCommandOption()
            .setType("string")
            .setName("num2")
            .setDescription("Can be the number of images or gif.")

        const numOption = new SlashCommandOption()
            .setType("string")
            .setName("num")
            .setDescription("Can be the number of images or gif/a message id.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(numOption)
            .addOption(num2Option)
            .addOption(num3Option)
    }

    public sendDownload = async (name: string, images: string[], last?: string | null) => {
        name = name.trim().replace(/ +/g, "_")
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const i = new Images(discord, message)
        if (!images[0]) {
            const downloadEmbed = embeds.createEmbed()
            downloadEmbed
            .setAuthor({name: "download", iconURL: "https://cdn.discordapp.com/emojis/685894156647661579.gif"})
            .setTitle(`**Image Downloader** ${discord.getEmoji("tohruSmug")}`)
            .setDescription(`${discord.getEmoji("star")}Could not find any images. By default I only search the last **300** messages from the current message, or from a message id if provided. ${last ? `To continue from where this search left off, run the command \`download ${last}\`.` : "There are no more messages left in this channel!"}`)
            return this.reply(downloadEmbed)
        }
        const rand = Math.floor(Math.random()*10000)
        const src = path.join(__dirname, `../../assets/misc/images/dump/${rand}/`)
        if (!fs.existsSync(src)) fs.mkdirSync(src, {recursive: true})
        const dest = path.join(__dirname, `../../assets/misc/images/dump/${rand}/${name}.zip`)
        await i.downloadImages(images, src)
        const downloads = fs.readdirSync(src).map((m) => src + m)
        await Functions.createZip(downloads, dest)
        const stats = fs.statSync(dest)
        if (stats.size > Functions.getMBBytes(10)) {
            const link = await i.upload([dest]).then((l) => l[0])
            const downloadEmbed = embeds.createEmbed()
            downloadEmbed
            .setAuthor({name: "download", iconURL: "https://cdn.discordapp.com/emojis/685894156647661579.gif"})
            .setTitle(`**Image Downloader** ${discord.getEmoji("tohruSmug")}`)
            .setDescription(
                `${discord.getEmoji("star")}Downloaded **${images.length}** images from this text channel!\n` +
                `${discord.getEmoji("star")}This file is too large for attachments. Download it [**here**](${link}).\n`
            )
            await this.reply(downloadEmbed)
        } else {
            const attachment = new AttachmentBuilder(dest, {name: `${name}.zip`})
            const lastText = last ? `There are still more messages left in this text channel. To continue from where this search left off, run the command \`download ${last}\`.` : `There are no more images left after this. Congrats!`
            const downloadEmbed = embeds.createEmbed()
            downloadEmbed
            .setAuthor({name: "download", iconURL: "https://cdn.discordapp.com/emojis/685894156647661579.gif"})
            .setTitle(`**Image Downloader** ${discord.getEmoji("tohruSmug")}`)
            .setDescription(
                `${discord.getEmoji("star")}Downloaded **${images.length}** images from this text channel!\n` +
                lastText
            )
            await this.reply(downloadEmbed, attachment)
        }
        Functions.removeDirectory(src)
        return
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const images = new Images(discord, message)
        const name = message.channel instanceof TextChannel ? message.channel.name : message.author.username + "_dm"
        if (!message.channel.isSendable()) return
        let attachments: string[] = []
        let last: string | null = null
        let amount = 300

        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)
        const rep = await this.reply(`**Searching the messages in this channel, please wait** ${discord.getEmoji("kisaragiCircle")}`)

        if (args[1] === "gif") {
            if (Number(args[2]) && Number(args[2]) > 0 && Number(args[2]) <= 1000) amount = Number(args[2])
            const result = await images.fetchChannelAttachments(message.channel, amount+1, true)
            attachments = result.attachments
            last = result.last!
        } else if (args[1]?.match(/\d{15,}/)) {
            const id = args[1]?.match(/\d{15,}/)?.[0]
            if (args[2] === "gif") {
                if (Number(args[3]) && Number(args[3]) > 0 && Number(args[3]) <= 1000) amount = Number(args[3])
                const result = await images.fetchChannelAttachments(message.channel, amount+1, true, id)
                attachments = result.attachments
                last = result.last!
            } else {
                if (Number(args[2]) && Number(args[2]) > 0 && Number(args[2]) <= 1000) amount = Number(args[2])
                const result = await images.fetchChannelAttachments(message.channel, amount+1, false, id)
                attachments = result.attachments
                last = result.last!
            }
        } else {
            if (Number(args[1]) && Number(args[1]) > 0 && Number(args[1]) <= 1000) amount = Number(args[1])
            const result = await images.fetchChannelAttachments(message.channel, amount+1)
            attachments = result.attachments
            last = result.last!
        }
        if (rep) Functions.deferDelete(rep, 0)
        const rep2 = await this.reply(`**Downloading the images, please wait** ${discord.getEmoji("kisaragiCircle")}`)
        await this.sendDownload(name, attachments, last)
        if (rep2) Functions.deferDelete(rep2, 0)
    }
}
