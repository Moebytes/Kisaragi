import {Message, AttachmentBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import fs from "fs"
import gifFrames from "gif-frames"
import path from "path"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {CommandFunctions} from "./../../structures/CommandFunctions"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Images} from "./../../structures/Images"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Video} from "./../../structures/Video"

export default class Video2MP3 extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Converts a video file or link to mp3.",
            help:
            `
            _Note: Passing in youtube links is an alias for the \`youtube download mp3\` command._
            \`video2mp3\` - Convert the last posted video
            \`video2mp3 url\` - Convert the linked video
            `,
            examples:
            `
            \`=>video2mp3\`
            `,
            aliases: ["vid2mp3", "yt2mp3"],
            cooldown: 20,
            defer: true,
            unlist: true,
            subcommandEnabled: false
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
        const cmd = new CommandFunctions(discord, message)
        const perms = new Permission(discord, message)
        if (discord.checkMuted(message)) if (!perms.checkNSFW()) return
        const regex = new RegExp(/.(mp4|avi|mov|mkv|flv|swf|wmv)/)
        let url: string | undefined
        if (args[1]) {
            url = args[1]
        } else {
            url = await discord.fetchLastAttachment(message, false, regex)
        }
        if (!url) return this.reply(`Could not find a video file ${discord.getEmoji("kannaCurious")}`)
        if (/youtube.com/.test(url) || /youtu.be/.test(url)) {
            if (discord.checkMuted(message)) return this.reply(`Sorry, you need to provide a discord attachment link. Downloading YouTube videos is against their TOS.`)
            return cmd.runCommand(message, ["youtube", "download", "mp3", url])
        }

        if (!fs.existsSync(path.join(__dirname, `../../videos`))) fs.mkdirSync(path.join(__dirname, `../../videos`), {recursive: true})
        const src = path.join(__dirname, `../../videos/${path.basename(url)}`)
        const dest = path.join(__dirname, `../../tracks/${path.basename(url).slice(0, -4)}.mp3`)
        await images.download(url, src)
        await video.extractAudio(src, dest)
        const videoEmbed = embeds.createEmbed()
        videoEmbed
        .setAuthor({name: "ffmpeg", iconURL: "https://kisaragi.moe/assets/embed/video2mp3.png", url: "https://www.ffmpeg.org/"})
        .setTitle(`**Video to mp3** ${discord.getEmoji("karenSugoi")}`)
        .setDescription(`${discord.getEmoji("star")}Converted this video to an mp3 file! ${discord.getEmoji("chinoSmug")}`)

        const stats = fs.statSync(dest)
        if (stats.size > Functions.getMBBytes(10)) {
            let link = await images.upload(dest)
            link = encodeURI(link)
            videoEmbed
            .setURL(link)
            .setDescription(
                `${discord.getEmoji("star")}Converted this video to an mp3 file! ${discord.getEmoji("chinoSmug")}\n` +
                `This file is too large for attachments. Download the file [**here**](${link}).`
            )
            return this.reply(videoEmbed)
        }
        const attachment = new AttachmentBuilder(dest)
        await this.reply(videoEmbed, attachment)
    }
}
