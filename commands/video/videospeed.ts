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

export default class VideoSpeed extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Changes the speed of a video.",
            help:
            `
            \`videospeed factor\` - Changes the speed of the last posted video
            \`videospeed factor url\` - Changes the speed of the linked video
            `,
            examples:
            `
            \`=>videospeed 1.5\`
            `,
            aliases: ["vspeed"],
            cooldown: 20,
            defer: true,
            unlist: true,
            subcommandEnabled: false
        })
        const urlOption = new SlashCommandOption()
            .setType("string")
            .setName("url")
            .setDescription("Optional url, or will use last posted video.")

        const factorOption = new SlashCommandOption()
            .setType("number")
            .setName("factor")
            .setDescription("Speed factor.")
            .setRequired(true)

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(factorOption)
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
        if (discord.checkMuted(message)) if (!perms.checkNSFW()) return
        const youtube = new Youtube(process.env.GOOGLE_API_KEY!)
        const regex = new RegExp(/.(mp4|avi|mov|mkv|flv|swf|wmv)/)
        let url: string | undefined
        const factor = Number(args[1])
        if (Number.isNaN(factor)) return this.reply("You must provide a valid speed factor.")
        if (args[2]) {
            url = args[2]
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
            console.log(seconds)
            if ((Number(seconds) / factor) > 600) return this.reply(`Sorry, this video will be too long... Keep it under 10 minutes.`)
            const title = video.snippet.title
            src = path.join(__dirname, `../../videos/`)
            dest = path.join(__dirname, `../../videos/transform/${title}_speed.mp4`)
            src = await youtube.util.downloadVideo(url, src)*/
        } else {
            const ext = url.slice(-4)
            src = path.join(__dirname, `../../videos/${path.basename(url)}`)
            dest = path.join(__dirname, `../../videos/transform/${path.basename(url).slice(0, -4)}_speed${ext}`)
            await images.download(url, src)
        }
        await video.videoSpeed(factor, src, dest)
        const videoEmbed = embeds.createEmbed()
        videoEmbed
        .setAuthor({name: "ffmpeg", iconURL: "https://kisaragi.moe/assets/embed/videospeed.png", url: "https://www.ffmpeg.org/"})
        .setTitle(`**Video Speed** ${discord.getEmoji("karenSugoi")}`)
        .setDescription(`${discord.getEmoji("star")}Changed the video speed by a factor of **${factor}x**! ${discord.getEmoji("chinoSmug")}`)

        const stats = fs.statSync(dest)
        if (stats.size > Functions.getMBBytes(10)) {
            let link = await images.upload(dest)
            link = encodeURI(link)
            videoEmbed
            .setURL(link)
            .setDescription(
                `${discord.getEmoji("star")}Changed the video speed by a factor of **${factor}x**! ${discord.getEmoji("chinoSmug")}\n` +
                `This file is too large for attachments. Download the file [**here**](${link}).`
            )
            return this.reply(videoEmbed)
        }
        const attachment = new AttachmentBuilder(dest)
        await this.reply(videoEmbed, attachment)
    }
}