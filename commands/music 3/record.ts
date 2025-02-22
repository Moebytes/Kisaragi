import {Message, AttachmentBuilder, TextChannel} from "discord.js"
import {getVoiceConnection, joinVoiceChannel, EndBehaviorType} from "@discordjs/voice"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import fs from "fs"
import path from "path"
import {Command} from "../../structures/Command"
import {Audio} from "./../../structures/Audio"
import {AudioEffects} from "./../../structures/AudioEffects"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Images} from "./../../structures/Images"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Record extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Records your voice and uploads the recording.",
            help:
            `
            _Note: Recording is stopped when there is no more voice activity._
            \`record name?\` - Starts recording, the name is the filename.
            `,
            examples:
            `
            \`=>record\`
            `,
            aliases: [],
            guildOnly: true,
            cachedGuildOnly: true,
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const nameOption = new SlashCommandOption()
            .setType("string")
            .setName("name")
            .setDescription("Filename of the recording.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(nameOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const audio = new Audio(discord, message)
        const fx = new AudioEffects(discord, message)
        const images = new Images(discord, message)
        const perms = new Permission(discord, message)
        if (!message.channel.isSendable()) return
        if (!message.guild) return
        const name = Functions.combineArgs(args, 1) ? Functions.combineArgs(args, 1) : message.author.username
        if (!(message.channel as TextChannel).permissionsFor(message.guild?.members.me!)?.has(["Connect", "Speak"])) {
            return this.reply(`The bot needs the permissions **Connect** and **Speak** in order to use this command. ${this.discord.getEmoji("kannaFacepalm")}`)
        }

        let voiceChannel = message.member?.voice.channel
        let connection = getVoiceConnection(message.guild.id)!

        if (!connection && voiceChannel) {
            connection = joinVoiceChannel({channelId: voiceChannel.id, guildId: message.guild.id, adapterCreator: message.guild.voiceAdapterCreator, selfDeaf: false})
        } else if (!message.member?.voice.channel) {
            return this.reply(`You must join a voice channel first. What am I going to record ${discord.getEmoji("kannaFacepalm")}`)
        }
        const loading = message.channel.lastMessage
        if (message instanceof Message) loading?.delete()
        const recording = connection.receiver.subscribe(message.author.id, {end: {behavior: EndBehaviorType.AfterSilence, duration: 1000}})
        const pcm = path.join(__dirname, `../../assets/misc/tracks/${name}.pcm`)
        await this.reply(`Recording started! Please use **push to talk**, the recording will stop once the push button is released.`)
        await new Promise<void>((resolve) => {
            recording.pipe(fs.createWriteStream(pcm) as unknown as NodeJS.WritableStream).on("finish", () => resolve())
        })
        let mp3Dest: string
        try {
            mp3Dest = await fx.convertToFormat(pcm, "mp3")
        } catch {
            return this.reply(`Nothing was recorded ${discord.getEmoji("kannaFacepalm")}`)
        }
        const stats = fs.statSync(mp3Dest)

        if (stats.size > Functions.getMBBytes(10)) {
            const link = await images.upload(mp3Dest)
            const recordingEmbed = embeds.createEmbed()
            recordingEmbed
            .setAuthor({name: "recording", iconURL: "https://kisaragi.moe/assets/embed/record.png"})
            .setTitle(`**Voice Recording** ${discord.getEmoji("chinoSmug")}`)
            .setDescription(
                `${discord.getEmoji("star")}Recorded your voice! This file is too large for attachments, download it [**here**](${link}).`
            )
            await this.reply(recordingEmbed)
        } else {
            const attachment = new AttachmentBuilder(mp3Dest)
            const recordingEmbed = embeds.createEmbed()
            recordingEmbed
            .setAuthor({name: "recording", iconURL: "https://kisaragi.moe/assets/embed/record.png"})
            .setTitle(`**Voice Recording** ${discord.getEmoji("chinoSmug")}`)
            .setDescription(
                `${discord.getEmoji("star")}Here is your voice recording!`
            )
            await this.reply(recordingEmbed, attachment)
        }
    }
}
