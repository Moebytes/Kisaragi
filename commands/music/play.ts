import {Message, EmbedBuilder} from "discord.js"
import {getVoiceConnection, joinVoiceChannel} from "@discordjs/voice"
import {SlashCommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import * as defaults from "./../../assets/json/defaultSongs.json"
import {Audio} from "./../../structures/Audio"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "./../../structures/Permission"

export default class Play extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Plays a song from soundcloud or an attachment.",
            help:
            `
            _Note: You must be in a voice channel._
            \`play\` - Plays the default songs.
            \`play song\` - Searches for songs on soundcloud and plays the one that you pick.
            \`play first song\` - Plays the first result automatically.
            \`play reverse song\` - Starts playback in reverse mode.
            \`play loop song\` - Starts playback in loop mode.
            `,
            examples:
            `
            \`=>play\`
            \`=>play reverse first synthion comet\`
            `,
            guildOnly: true,
            aliases: ["pl", "stream"],
            cooldown: 15,
            defer: true,
            slashEnabled: true
        })
        const thirdOption = new SlashCommandOption()
            .setType("string")
            .setName("song3")
            .setDescription("This is the final option for song input if you have yet to specify it.")

        const secondOption = new SlashCommandOption()
            .setType("string")
            .setName("song2")
            .setDescription("This can be the song to search for or any of the first/reverse/loop options.")

        const firstOption = new SlashCommandOption()
            .setType("string")
            .setName("song")
            .setDescription("This can be the song to search for or any of the first/reverse/loop options.")

        this.slash = new SlashCommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(firstOption)
            .addOption(secondOption)
            .addOption(thirdOption)
            .toJSON()
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const audio = new Audio(discord, message)
        const perms = new Permission(discord, message)
        if (!message.channel.isSendable()) return
        if (!message.guild) return
        if (!audio.checkMusicPermissions()) return

        let voiceChannel = message.member?.voice.channel
        let connection = getVoiceConnection(message.guild!.id)

        if (!connection && voiceChannel) {
            try {
                connection = joinVoiceChannel({channelId: voiceChannel.id, guildId: message.guild.id, adapterCreator: message.guild.voiceAdapterCreator, selfDeaf: false})
            } catch {
                return this.reply(`I need the **Connect** permission to connect to this channel. ${discord.getEmoji("kannaFacepalm")}`)
            }
        } else if (!message.member?.voice.channel) {
            return this.reply(`You must join a voice channel first. How will you listen to the song ${discord.getEmoji("kannaFacepalm")}`)
        }

        const loading = message.channel.lastMessage

        let queue = audio.getQueue()
        let setYT = false
        let song = Functions.combineArgs(args, 1).trim()
        let file: string
        let queueEmbed: EmbedBuilder
        let setReverse = false
        let setLoop = false
        if (song.match(/yt/)) {
            if (perms.checkBotDev()) setYT = true
            song = song.replace("yt", "")
        } else if (song.match(/sc/)) {
            song = song.replace("sc", "")
        } else if (song?.match(/reverse/)) {
            song = song.replace("reverse", "")
            setReverse = true
        } else if (song?.match(/loop/)) {
            song = song.replace("loop", "")
            setLoop = true
        }
        if (!song) {
            const regex = new RegExp(/.(mp3|wav|flac|ogg|aiff)/)
            const filepath = await discord.fetchLastAttachment(message, false, regex)
            if (!filepath) {
                song = defaults.songs[Math.floor(Math.random()*defaults.songs.length)]
                file = await audio.download(song)
                queueEmbed = await audio.queueAdd(song, file)
            } else {
                file = await audio.download(filepath)
                queueEmbed = await audio.queueAdd(filepath, file)
            }
        } else if (song?.match(/youtube.com|youtu.be/)) {
            file = await audio.download(song)
            queueEmbed = await audio.queueAdd(song, file)
        } else if (song?.match(/soundcloud.com/)) {
            file = await audio.download(song)
            queueEmbed = await audio.queueAdd(song, file)
        } else if (song?.match(/.(mp3|wav|ogg|webm)/) || song?.includes("http")) {
                file = await audio.download(song)
                queueEmbed = await audio.queueAdd(song, file)
        } else {
            let setFirst = false
            if (song?.match(/first/)) {
                song = song.replace("first", "")
                setFirst = true
            }
            if (setYT) {
                const link = await audio.songPickerYT(song, setFirst)
                if (!link) return this.reply("No results were found for your query!")
                song = link
                file = await audio.download(link)
                queueEmbed = await audio.queueAdd(link, file)
            } else {
                const link = await audio.songPickerSC(song, setFirst)
                if (!link) return this.reply("No results were found for your query!")
                song = link
                file = await audio.download(link, song)
                queueEmbed = await audio.queueAdd(link, file)
            }
        }
        await this.reply(queueEmbed)
        queue = audio.getQueue()
        const settings = audio.getSettings()
        if (setLoop) settings[0].looping = true
        if (message instanceof Message) if (loading) await loading?.delete()
        if (queue.length === 1 && !queue[0].playing) {
            const next = audio.next()!
            if (setReverse) {
                await audio.reverse(next)
            } else {
                await audio.play(next)
            }
            const nowPlaying = await audio.nowPlaying()
            if (nowPlaying) await this.send(nowPlaying)
        }
    }
}
