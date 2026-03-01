/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, AttachmentBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import fs from "fs"
import gifFrames from "gif-frames"
import path from "path"
import Youtube from "youtube.ts"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Audio} from "./../../structures/Audio"
import {CommandFunctions} from "./../../structures/CommandFunctions"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Images} from "./../../structures/Images"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Video} from "./../../structures/Video"

export default class ReverseVideo extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Reverses a video.",
            help:
            `
            \`reversevideo\` - Reverses the last posted video
            \`reversevideo url\` - Reverses the linked video
            `,
            examples:
            `
            \`=>reversevideo\`
            `,
            aliases: ["vreverse", "reversevid"],
            cooldown: 20,
            premium: true,
            defer: true,
            subcommandEnabled: true
        })
        const urlOption = new SlashCommandOption()
            .setType("string")
            .setName("url")
            .setDescription("Optional url, or will use last posted video.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(urlOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const images = new Images(discord, message)
        const video = new Video(discord, message)
        const audio = new Audio(discord, message)
        const cmd = new CommandFunctions(discord, message)
        const perms = new Permission(discord, message)
        const youtube = new Youtube(process.env.GOOGLE_API_KEY!)
        const regex = new RegExp(/.(mp4|avi|mov|mkv|flv|swf|wmv)/)
        let url: string | undefined
        if (args[1]) {
            url = args[1]
        } else {
            url = await discord.fetchLastAttachment(message, false, regex)
        }
        if (!url) return this.reply(`Could not find a video file ${discord.getEmoji("kannaCurious")}`)

        if (!fs.existsSync(path.join(__dirname, `../../videos`))) fs.mkdirSync(path.join(__dirname, `../../videos`), {recursive: true})
        let src = ""
        let dest = ""
        if (/youtube.com/.test(url) || /youtu.be/.test(url)) {
            return this.reply(`Sorry, you need to provide a discord attachment link. Downloading YouTube videos is against their TOS.`)
            /*
            const video = await youtube.videos.get(url)
            const seconds = audio.parseYTDuration(video.contentDetails.duration, true)
            if (Number(seconds) > 600) return message.reply(`Sorry, this video is too long... Keep it under 10 minutes.`)
            const title = video.snippet.title
            src = path.join(__dirname, `../../videos/`)
            dest = path.join(__dirname, `../../videos/transform/${title}_reverse.mp4`)
            src = await youtube.util.downloadVideo(url, src)*/
        } else {
            src = path.join(__dirname, `../../videos/${path.basename(url)}`)
            dest = path.join(__dirname, `../../videos/transform/${path.basename(url).slice(0, -4)}_reverse.mp4`)
            await images.download(url, src)
        }
        await video.reverseVideo(src, dest)
        const videoEmbed = embeds.createEmbed()
        videoEmbed
        .setAuthor({name: "ffmpeg", iconURL: "https://kisaragi.moe/assets/embed/reversevideo.png", url: "https://www.ffmpeg.org/"})
        .setTitle(`**Reverse Video** ${discord.getEmoji("karenSugoi")}`)
        .setDescription(`${discord.getEmoji("star")}Reversed this video! ${discord.getEmoji("chinoSmug")}`)

        const stats = fs.statSync(dest)
        if (stats.size > Functions.getMBBytes(10)) {
            let link = await images.upload(dest)
            link = encodeURI(link)
            videoEmbed
            .setURL(link)
            .setDescription(
                `${discord.getEmoji("star")}Reversed this video! ${discord.getEmoji("chinoSmug")}\n` +
                `This file is too large for attachments. Download the file [**here**](${link}).\n`
            )
            return this.reply(videoEmbed)
        }
        const attachment = new AttachmentBuilder(dest)
        await this.reply(videoEmbed, attachment)
    }
}
