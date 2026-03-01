/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import axios from "axios"
import {Collection, Message, AttachmentBuilder, EmbedBuilder, MessageReaction, TextChannel, User} from "discord.js"
import {getVoiceConnection, createAudioPlayer, createAudioResource, AudioPlayerStatus, AudioPlayer, VoiceConnectionStatus, AudioResource, AudioPlayerState} from "@discordjs/voice"
import fs from "fs"
import path from "path"
import Soundcloud from "soundcloud.ts"
import Youtube from "youtube.ts"
import defaults from "../assets/json/defaultSongs.json"
import {AudioEffects} from "./AudioEffects"
import {Embeds} from "./Embeds"
import {Functions} from "./Functions"
import {Kisaragi} from "./Kisaragi"
import {Permission} from "./Permission"
import {Video} from "./Video"
import prism from "prism-media"

const createAudioResourceAndSeek = (input: string, options?: {seekTo?: number, inlineVolume?: boolean, metadata?: string, silencePaddingFrames?: number}) => {
    if (!options) options = {}
    let ffmpegArguments = ["-analyzeduration", "0", "-loglevel", "0", "-f", "s16le", "-ar", "48000", "-ac", "2"]
    
    if (options.seekTo) {
        ffmpegArguments = ["-ss", String(options.seekTo), ...ffmpegArguments]
    }

    const edgeArbitraryToRaw = {
        type: "ffmpeg pcm with seek",
        to: null,
        cost: 2,
        transformer: (input: string) =>
            new prism.FFmpeg({
                args: ["-i", input, ...ffmpegArguments],
            })
    } as any

    const volumeTransformer = {
        type: "volume transformer",
        to: null,
        cost: 0.5,
        transformer: () => new prism.VolumeTransformer({type: "s16le"}),
    } as any

    const edgeRawToOpus = {
        type: "opus encoder",
        to: null,
        cost: 1.5,
        transformer: () => new prism.opus.Encoder({rate: 48000, channels: 2, frameSize: 960})
    } as any

    const transformerPipeline = [edgeArbitraryToRaw]
    if (options.inlineVolume) transformerPipeline.push(volumeTransformer)
    transformerPipeline.push(edgeRawToOpus)
    const streams = transformerPipeline.map((edge) => edge.transformer(input))

    return new AudioResource(
        transformerPipeline,
        streams,
        options.metadata ?? null,
        options.silencePaddingFrames ?? 5,
    )
}

const numMap = {
    1: [0, 3, 6, 9, 12, 15],
    2: [1, 4, 7, 10, 13, 16],
    3: [2, 5, 8, 11, 14, 17]
}

type QueueItem = {
    title: string
    artist: string
    url: string
    image: string
    duration: string
    requester: string
    requesterID: string
    details: string
    file: string
    originalFile: string
    playing: boolean
    message: Message | null
    kind: string
}

type SettingsItem = {
    seekOffset: number
    reverse: boolean
    looping: boolean
    ablooping: boolean
    autoplay: boolean
    speed: number
    pitch: number
    volume: number
    filters: string[]
    effects: string[]
    filterParams: {[key: string]: (string | number | number[])[]},
    effectParams: {[key: string]: (string | number | number[])[]},
    speedParam: boolean
}

const queues = new Collection<string, QueueItem[]>()
const musicSettings = new Collection<string, SettingsItem>()
const procBlock = new Collection<string, boolean>()

export class Audio {
    private readonly headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
    private readonly fx: AudioEffects
    private readonly video: Video
    private readonly youtube: Youtube
    private readonly soundcloud: Soundcloud
    private readonly embeds: Embeds
    private readonly perms: Permission
    constructor(private readonly discord: Kisaragi, private readonly message: Message) {
        this.embeds = new Embeds(this.discord, this.message)
        this.perms = new Permission(this.discord, this.message)
        this.soundcloud = new Soundcloud()
        this.youtube = new Youtube(process.env.GOOGLE_API_KEY!)
        this.video = new Video(this.discord, this.message)
        this.fx = new AudioEffects(this.discord, this.message)
    }

    public checkMusicPermissions = () => {
        const message = this.message
        if (!(message.channel as TextChannel).permissionsFor(message.guild?.members.me!)?.has(["Connect", "Speak"])) {
            this.discord.reply(this.message, `The bot needs the permissions **Connect** and **Speak** for all music commands. ${this.discord.getEmoji("kannaFacepalm")}`)
            return false
        } else {
            return true
        }
    }

    public checkEffectPermissions = async (user: User) => {
        const queue = this.getQueue()
        const requesterID = queue[0]?.requesterID
        const hasPermission = await this.perms.checkAudioPermission(user, requesterID)
        if (!hasPermission) {
            this.discord.reply(this.message, `Only the requester and moderators can edit effects. Wait until it's your turn! ${this.discord.getEmoji("kannaSad")}`)
            return false
        } else {
            return true
        }
    }

    public checkMusicPlaying = () => {
        const connection = getVoiceConnection(this.message.guild!.id)
        const queue = this.getQueue()
        if (!connection || !queue?.[0]) {
            this.discord.reply(this.message, `You must be playing music in order to use this command ${this.discord.getEmoji("kannaFacepalm")}`)
            return false
        } else {
            return true
        }
    }

    public compression = async (filepath: string, amount?: number, dl?: boolean) => {
        if (!amount) amount = 80
        if (amount < 0) amount = 0
        if (amount > 100) amount = 100
        const queue = this.getQueue()
        const settings = this.getSettings()
        settings.effectParams.compression = [amount]
        const filename = path.basename(filepath.replace("-compress", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-compress`)
        let mp3File: string
        try {
            mp3File = await this.fx.compress(amount, filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (dl) {
            return this.fx.downloadEffect("compress", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public tremolo = async (filepath: string, speed?: number, depth?: number, dl?: boolean) => {
        if (!speed) speed = 10
        if (!depth) depth = 70
        if (depth < 0) depth = 0
        if (depth > 100) depth = 100
        const queue = this.getQueue()
        const settings = this.getSettings()
        settings.effectParams.tremolo = [speed, depth]
        const filename = path.basename(filepath.replace("-tremolo", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-tremolo`)
        let mp3File: string
        try {
            mp3File = await this.fx.tremolo(speed, depth, filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (dl) {
            return this.fx.downloadEffect("tremolo", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public lowpass = async (filepath: string, freq?: number, width?: number, dl?: boolean) => {
        if (!freq) freq = 1000
        if (!width) width = 200
        const queue = this.getQueue()
        const settings = this.getSettings()
        settings.filterParams.lowpass = [freq, width]
        const filename = path.basename(filepath.replace("-lowpass", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-lowpass`)
        let mp3File: string
        try {
            mp3File = await this.fx.lowpass(freq, width, filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (dl) {
            return this.fx.downloadEffect("lowpass", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public highpass = async (filepath: string, freq?: number, width?: number, dl?: boolean) => {
        if (!freq) freq = 600
        if (!width) width = 200
        const queue = this.getQueue()
        const settings = this.getSettings()
        settings.filterParams.highpass = [freq, width]
        const filename = path.basename(filepath.replace("-highpass", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-highpass`)
        let mp3File: string
        try {
            mp3File = await this.fx.highpass(freq, width, filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (dl) {
            return this.fx.downloadEffect("highpass", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public peak = async (filepath: string, freq?: number, resonance?: number, gain?: number, dl?: boolean) => {
        if (!freq) freq = 1000
        if (!resonance) resonance = 2
        if (!gain) gain = -3
        const queue = this.getQueue()
        const settings = this.getSettings()
        settings.filterParams.peak = [freq, resonance, gain]
        const filename = path.basename(filepath.replace("-peak", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-peak`)
        let mp3File: string
        try {
            mp3File = await this.fx.peak(freq, resonance, gain, filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (dl) {
            return this.fx.downloadEffect("peak", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public lowshelf = async (filepath: string, gain?: number, freq?: number, width?: number, dl?: boolean) => {
        if (!gain) gain = 3
        if (!freq) freq = 1000
        if (!width) width = 200
        const queue = this.getQueue()
        const settings = this.getSettings()
        settings.filterParams.lowshelf = [gain, freq, width]
        const filename = path.basename(filepath.replace("-lowshelf", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-lowshelf`)
        let mp3File: string
        try {
            mp3File = await this.fx.lowshelf(gain, freq, width, filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (dl) {
            return this.fx.downloadEffect("lowshelf", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public highshelf = async (filepath: string, gain?: number, freq?: number, width?: number, dl?: boolean) => {
        if (!gain) gain = 3
        if (!freq) freq = 1000
        if (!width) width = 200
        const queue = this.getQueue()
        const settings = this.getSettings()
        settings.filterParams.highshelf = [gain, freq, width]
        const filename = path.basename(filepath.replace("-highshelf", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-highshelf`)
        let mp3File: string
        try {
            mp3File = await this.fx.highshelf(gain, freq, width, filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (dl) {
            return this.fx.downloadEffect("highshelf", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public bandpass = async (filepath: string, freq?: number, width?: number, dl?: boolean) => {
        if (!freq) freq = 700
        if (!width) width = 200
        const queue = this.getQueue()
        const settings = this.getSettings()
        settings.filterParams.bandpass = [freq, width]
        const filename = path.basename(filepath.replace("-bandpass", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-bandpass`)
        let mp3File: string
        try {
            mp3File = await this.fx.bandpass(freq, width, filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (dl) {
            return this.fx.downloadEffect("bandpass", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public bandreject = async (filepath: string, freq?: number, width?: number, dl?: boolean) => {
        if (!freq) freq = 500
        if (!width) width = 200
        const queue = this.getQueue()
        const settings = this.getSettings()
        settings.filterParams.bandreject = [freq, width]
        const filename = path.basename(filepath.replace("-bandreject", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-bandreject`)
        let mp3File: string
        try {
            mp3File = await this.fx.bandreject(freq, width, filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (dl) {
            return this.fx.downloadEffect("bandreject", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public upsample = async (filepath: string, factor?: number, dl?: boolean) => {
        if (!factor) factor = 2
        if (factor > 5) factor = 5
        const queue = this.getQueue()
        const settings = this.getSettings()
        settings.effectParams.upsample = [factor]
        const filename = path.basename(filepath.replace("-upsample", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-upsample`)
        let mp3File: string
        try {
            mp3File = await this.fx.upsample(factor, filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (dl) {
            return this.fx.downloadEffect("upsample", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public bitcrush = async (filepath: string, factor?: number, dl?: boolean) => {
        if (!factor) factor = 2
        if (factor > 5) factor = 5
        const queue = this.getQueue()
        const settings = this.getSettings()
        settings.effectParams.bitcrush = [factor]
        const filename = path.basename(filepath.replace("-bitcrush", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-bitcrush`)
        let mp3File: string
        try {
            mp3File = await this.fx.bitcrush(factor, filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (dl) {
            return this.fx.downloadEffect("bitcrush", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public distortion = async (filepath: string, gain?: number, color?: number, dl?: boolean) => {
        if (!gain) gain = 20
        if (!color) color = 20
        const queue = this.getQueue()
        const settings = this.getSettings()
        settings.effectParams.distortion = [gain, color]
        const filename = path.basename(filepath.replace("-distortion", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-distortion`)
        let mp3File: string
        try {
            mp3File = await this.fx.distortion(gain, color, filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (dl) {
            return this.fx.downloadEffect("distortion", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public chorus = async (filepath: string, delay?: number, decay?: number, speed?: number, depth?: number, dl?: boolean) => {
        if (!delay) delay = 50
        if (!decay) decay = 0.3
        if (!speed) speed = 2
        if (!depth) depth = 2
        if (speed > 5) speed = 5
        const queue = this.getQueue()
        const settings = this.getSettings()
        settings.effectParams.chorus = [delay, decay, speed, depth]
        const filename = path.basename(filepath.replace("-chorus", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-chorus`)
        let mp3File: string
        try {
            mp3File = await this.fx.chorus(delay, decay, speed, depth, filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (dl) {
            return this.fx.downloadEffect("chorus", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public phaser = async (filepath: string, delay?: number, decay?: number, speed?: number, dl?: boolean) => {
        if (!delay) delay = 3
        if (!decay) decay = 0.5
        if (!speed) speed = 0.5
        if (speed > 5) speed = 5
        const queue = this.getQueue()
        const settings = this.getSettings()
        settings.effectParams.phaser = [delay, decay, speed]
        const filename = path.basename(filepath.replace("-phaser", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-phaser`)
        let mp3File: string
        try {
            mp3File = await this.fx.phaser(delay, decay, speed, filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (dl) {
            return this.fx.downloadEffect("phaser", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public flanger = async (filepath: string, delay?: number, depth?: number, regen?: number, width?: number, speed?: number, shape?: "sin" | "tri", phase?: number, interp?: "lin" | "quad", dl?: boolean) => {
        if (!delay) delay = 0
        if (!depth) depth = 2
        if (!regen) regen = 0
        if (!width) width = 71
        if (!speed) speed = 0.5
        if (!shape) shape = "sin"
        if (!phase) phase = 25
        if (!interp) interp = "lin"
        if (delay > 30) delay = 30
        if (depth > 10) depth = 10
        if (regen < -95) regen = -95
        if (regen > 95) regen = 95
        if (width < 0) width = 0
        if (width > 100) width = 100
        if (speed < 0.1) speed = 0.1
        if (speed > 10) speed = 10
        if (shape !== "sin" && shape !== "tri") shape = "sin"
        if (phase < 0) phase = 0
        if (phase > 100) phase = 100
        if (interp !== "lin" && interp !== "quad") interp = "lin"
        const queue = this.getQueue()
        const settings = this.getSettings()
        settings.effectParams.flanger = [delay, depth, regen, width, speed, shape, phase, interp]
        const filename = path.basename(filepath.replace("-flanger", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-flanger`)
        let mp3File: string
        try {
            mp3File = await this.fx.flanger(delay, depth, regen, width, speed, shape, phase, interp, filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (dl) {
            return this.fx.downloadEffect("flanger", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public delay = async (filepath: string, delaysDecays?: number[], dl?: boolean) => {
        if (!delaysDecays) delaysDecays = [60, 0.4]
        const queue = this.getQueue()
        const settings = this.getSettings()
        settings.effectParams.delay = [delaysDecays]
        const filename = path.basename(filepath.replace("-delay", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-delay`)
        let mp3File: string
        try {
            mp3File = await this.fx.delay(delaysDecays, filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (dl) {
            return this.fx.downloadEffect("delay", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public speed = async (filepath: string, factor?: number, pitch?: boolean, dl?: boolean, skipAdd?: boolean) => {
        if (!factor) factor = 1
        if (factor < 0.1) factor = 0.1
        if (factor > 100) factor = 100
        const queue = this.getQueue()
        const settings = this.getSettings()
        if (!pitch) pitch = false
        const filename = path.basename(filepath.replace("-speed", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-speed`)
        let mp3File: string
        try {
            mp3File = await this.fx.speed(factor, pitch, filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (!skipAdd) {
            if (factor < 0) {
                settings.speed /= factor
            } else {
                settings.speed *= factor
            }
            if (pitch) settings.speedParam = pitch
        }
        if (dl) {
            return this.fx.downloadEffect("speed", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public pitch = async (filepath: string, semitones?: number, dl?: boolean, skipAdd?: boolean) => {
        if (!semitones) semitones = 0
        const queue = this.getQueue()
        const settings = this.getSettings()
        const filename = path.basename(filepath.replace("-pitch", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-pitch`)
        let mp3File: string
        try {
            mp3File = await this.fx.pitch(semitones, filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (!skipAdd) settings.pitch += semitones
        if (dl) {
            return this.fx.downloadEffect("pitch", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public reverse = async (filepath: string, dl?: boolean, skipAdd?: boolean) => {
        const queue = this.getQueue()
        const settings = this.getSettings()
        const filename = path.basename(filepath.replace("-reverse", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-reverse`)
        let mp3File: string
        try {
            mp3File = await this.fx.reverse(filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (!skipAdd) settings.reverse = settings.reverse === true ? false : true
        if (dl) {
            return this.fx.downloadEffect("reverse", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public reverb = async (filepath: string, reverb?: number, damping?: number, room?: number, stereo?: number, preDelay?: number, wetGain?: number, reverse?: boolean, dl?: boolean) => {
        if (!reverb) reverb = 50
        if (!damping) damping = 50
        if (!room) room = 100
        if (!stereo) stereo = 100
        if (!preDelay) preDelay = 0
        if (!wetGain) wetGain = 0
        if (!reverse) reverse = false
        if (stereo < 0) stereo = 0
        if (stereo > 100) stereo = 100
        const queue = this.getQueue()
        const settings = this.getSettings()
        settings.effectParams.reverb = [reverb, damping, room, stereo, preDelay, wetGain]
        const filename = path.basename(filepath.replace("-reverb", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-reverb`)
        let mp3File: string
        try {
            mp3File = await this.fx.reverb(reverb, damping, room, stereo, preDelay, wetGain, reverse, filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (dl) {
            return this.fx.downloadEffect("reverb", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public allPass = async (filepath: string, freq?: number, width?: number, dl?: boolean) => {
        if (!freq) freq = 600
        if (!width) width = 100
        const queue = this.getQueue()
        const settings = this.getSettings()
        settings.effectParams.allpass = [freq, width]
        const filename = path.basename(filepath.replace("-allpass", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-allpass`)
        let mp3File: string
        try {
            mp3File = await this.fx.allPass(freq, width, filepath, fileDest)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        if (queue[0]) queue[0].file = mp3File
        if (dl) {
            return this.fx.downloadEffect("allpass", mp3File)
        } else {
            return this.play(mp3File, this.time())
        }
    }

    public combFilter = async (filepath: string, delay?: number, decay?: number) => {
        if (!delay) delay = 80
        if (!decay) decay = 0.5
        const filename = path.basename(filepath.replace("-comb", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-comb.wav`)
        const mp3File = await this.fx.combFilter(delay, decay, filepath, fileDest) as string
        return this.play(mp3File, this.time())
    }

    public time = () => {
        const settings = this.getSettings()
        let offset = settings.seekOffset
        const connection = getVoiceConnection(this.message.guild!.id)
        if (connection?.state.status !== VoiceConnectionStatus.Ready) return offset
        const player = connection?.state.subscription?.player
        if (!player || player?.state.status === AudioPlayerStatus.Idle) return offset
        let time = Math.floor(player.state.resource.playbackDuration / 1000.0)
        if (Number.isNaN(time)) return offset
        return time + offset
    }

    public rewind = (input: string) => {
        const seconds = this.parseSeconds(input)
        const time = this.time()
        const queue = this.getQueue()
        let rewind = time - seconds
        if (rewind < 0) rewind = 0
        return this.play(queue[0].file, rewind)
    }

    public fastforward = (input: string) => {
        const seconds = this.parseSeconds(input)
        const time = this.time()
        const queue = this.getQueue()
        return this.play(queue[0].file, time + seconds)
    }

    public getQueue = () => {
        if (queues.has(this.message.guild!.id)) {
            return queues.get(this.message.guild!.id)!
        } else {
            queues.set(this.message.guild!.id, [])
            return []
        }
    }

    public getSettings = () => {
        if (musicSettings.has(this.message.guild!.id)) {
            return musicSettings.get(this.message.guild!.id)!
        } else {
            const settings = {
                seekOffset: 0,
                reverse: false,
                looping: false,
                ablooping: false,
                autoplay: false,
                speed: 1.0,
                pitch: 0,
                volume: 1.0,
                filters: [],
                effects: [],
                filterParams: {},
                effectParams: {},
                speedParam: false
            }
            musicSettings.set(this.message.guild!.id, settings)
            return settings as SettingsItem
        }
    }

    public getProcBlock = () => {
        if (procBlock.has(this.message.guild!.id)) {
            return true
        } else {
            return false
        }
    }

    public setProcBlock = (remove?: boolean) => {
        if (remove) {
            procBlock.delete(this.message.guild!.id)
        } else {
            procBlock.set(this.message.guild!.id, true)
        }
    }

    public deleteQueue = (pos?: number, end?: number) => {
        if (pos) {
            if (!end) end = 1
            let queue = this.getQueue()
            queue = queue.splice(pos-1, end)
            queues.set(this.message.guild!.id, queue)
        } else {
            queues.set(this.message.guild!.id, [])
            musicSettings.delete(this.message.guild!.id)
        }
    }

    public shuffle = () => {
        let queue = this.getQueue()
        queue = Functions.shuffleArray(queue)
        queues.set(this.message.guild!.id, queue)
    }

    public queueAdd = async (link: string, file: string) => {
        const discord = this.discord
        let kind: "youtube" | "soundcloud" | "link"
        const queueObj = {
            title: "None",
            artist: "None",
            url: "None",
            image: "",
            duration: "None",
            requester: "None",
            requesterID: "",
            details: "None",
            file: "None",
            originalFile: "None",
            kind: "None",
            playing: false,
            message: null
        }
        if (link?.match(/youtube.com|youtu.be/)) {
            const info = await this.youtube.videos.get(link)
            const image = info.snippet.thumbnails.maxres?.url ?? info.snippet.thumbnails.high.url
            const title = info.snippet.title
            const channel = info.snippet.channelTitle
            const duration = this.parseYTDuration(info.contentDetails.duration)
            const url = `https://www.youtube.com/watch?v=${info.id}`
            kind = "youtube"
            queueObj.title = title
            queueObj.artist = channel
            queueObj.url = url
            queueObj.image = image
            queueObj.duration = duration as string
        } else if (link?.match(/soundcloud.com/)) {
            const info = await this.soundcloud.tracks.get(link)
            const image = info.artwork_url
            const title = info.title
            const artist = info.user.username
            const duration = this.parseSCDuration(info.duration)
            const url = info.permalink_url
            kind = "soundcloud"
            queueObj.title = title
            queueObj.artist = artist
            queueObj.url = url
            queueObj.image = image
            queueObj.duration = String(duration)
        } else {
            kind = "link"
            queueObj.title = link
            queueObj.url = link
        }
        queueObj.file = file
        queueObj.originalFile = file
        queueObj.requester = this.message.author.username
        queueObj.requesterID = this.message.author.id
        queueObj.kind = kind
        if (kind === "link") {
            queueObj.details =
            `${discord.getEmoji("star")}_Link:_ ${link}\n` +
            `_Added by ${this.message.author.username}_`
        } else {
            queueObj.details =
            `${discord.getEmoji("star")}_Title:_ [**${queueObj.title}**](${queueObj.url})\n` +
            `${discord.getEmoji("star")}_Artist:_ **${queueObj.artist}**\n` +
            `${discord.getEmoji("star")}_Duration:_ \`${queueObj.duration}\`\n` +
            `_Added by ${this.message.author.username}_`
        }
        const queue = this.getQueue()
        const pos = queue.push(queueObj)
        const topImg = kind === "youtube" ? "https://cdn4.iconfinder.com/data/icons/social-media-2210/24/Youtube-512.png" :
        (kind === "soundcloud" ? "https://icons.iconarchive.com/icons/danleech/simple/256/soundcloud-icon.png" : "https://clipartmag.com/images/musical-notes-png-11.png")
        const queueEmbed = this.embeds.createEmbed()
        queueEmbed
        .setAuthor({name: `${kind}`, iconURL: topImg})
        .setTitle(`**Song Request** ${discord.getEmoji("aquaUp")}`)
        .setURL(queueObj.url)
        .setThumbnail(queueObj?.image || null)
        .setDescription(`Added a new song to position **${pos}** in the queue!\n${queueObj.details}`)
        return queueEmbed
    }

    public next = () => {
        const queue = this.getQueue()
        const file = queue[0]?.file
        if (!file) return null
        return file
    }

    public loop = () => {
        const settings = this.getSettings()
        const looping = settings.looping
        if (looping) {
            settings.looping = false
        } else {
            settings.looping = true
        }
    }

    public autoplay = () => {
        const settings = this.getSettings()
        const autoplay = settings.autoplay
        if (autoplay) {
            settings.autoplay = false
        } else {
            settings.autoplay = true
        }
    }

    public pause = () => {
        const connection = getVoiceConnection(this.message.guild!.id)
        if (connection?.state.status !== VoiceConnectionStatus.Ready) return
        const player = connection.state.subscription?.player
        player?.pause(true)
        return true
    }

    public resume = () => {
        const connection = getVoiceConnection(this.message.guild!.id)
        if (connection?.state.status !== VoiceConnectionStatus.Ready) return
        const player = connection.state.subscription?.player
        player?.unpause()
        return true
    }

    public volume = async (num: number) => {
        if (num < 0 || num > 2) return this.discord.send(this.message, "The volume must be between 0 and 2.")
        const settings = this.getSettings()
        if (num) settings.volume = num
        const queue = this.getQueue()
        const filepath = queue[0].file
        this.play(filepath, this.time())
        /*
        const connection = getVoiceConnection(this.message.guild!.id)
        if (connection?.state.status !== VoiceConnectionStatus.Ready) return
        const player = connection.state.subscription?.player
        if (player?.state.status !== AudioPlayerStatus.Playing) return 
        const resource = player.state.resource
        resource.volume!.setVolumeLogarithmic(num)*/
        /*
        const queue = this.getQueue()
        const filepath = queue[0].file
        const filename = path.basename(filepath.replace("-vol", "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-vol`)
        let mp3File: string
        try {
            mp3File = await this.fx.volume(queue[0].file, num)
        } catch {
            mp3File = `${fileDest}.mp3`
        }
        const settings = this.getSettings()
        if (num) settings.volume = num
        return this.play(mp3File, this.time())*/
    }

    public nowPlaying = async () => {
        const discord = this.discord
        const queue = this.getQueue()
        const settings = this.getSettings()
        if (!queue) return "It looks like you aren't playing anything..."
        const now = queue[0]
        const nowEmbed = await this.updateNowPlaying()
        const msg = await this.discord.reply(this.message, nowEmbed) as Message
        now.message = msg
        const reactions = ["resume", "pause", "scrub", "reverse", "speed", "pitch", "loop", "abloop", "skip", "volume", "eq", "fx", "clear"]
        if (now.requesterID === process.env.OWNER_ID) reactions.push("mp3")
        for (let i = 0; i < reactions.length; i++) await msg.react(discord.getEmoji(reactions[i]))
        const resumeCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("resume").id && user.bot === false
        const pauseCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("pause").id && user.bot === false
        const scrubCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("scrub").id && user.bot === false
        const skipCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("skip").id && user.bot === false
        const loopCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("loop").id && user.bot === false
        const abLoopCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("abloop").id && user.bot === false
        const reverseCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("reverse").id && user.bot === false
        const speedCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("speed").id && user.bot === false
        const pitchCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("pitch").id && user.bot === false
        const volumeCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("volume").id && user.bot === false
        const eqCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("eq").id && user.bot === false
        const fxCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("fx").id && user.bot === false
        const clearCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("clear").id && user.bot === false
        const mp3Check = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("mp3").id && user.bot === false

        const resume = msg.createReactionCollector({filter: resumeCheck})
        const pause = msg.createReactionCollector({filter: pauseCheck})
        const scrub = msg.createReactionCollector({filter: scrubCheck})
        const skip = msg.createReactionCollector({filter: skipCheck})
        const loop = msg.createReactionCollector({filter: loopCheck})
        const abloop = msg.createReactionCollector({filter: abLoopCheck})
        const reverse = msg.createReactionCollector({filter: reverseCheck})
        const speed = msg.createReactionCollector({filter: speedCheck})
        const pitch = msg.createReactionCollector({filter: pitchCheck})
        const volume = msg.createReactionCollector({filter: volumeCheck})
        const eq = msg.createReactionCollector({filter: eqCheck})
        const fx = msg.createReactionCollector({filter: fxCheck})
        const clear = msg.createReactionCollector({filter: clearCheck})
        const mp3 = msg.createReactionCollector({filter: mp3Check})
        const reactors = [resume, pause, scrub, reverse, speed, pitch, loop, abloop, skip, volume, eq, fx, clear, mp3]
        for (let i = 0; i < reactors.length; i++) {
            reactors[i].on("collect", async (reaction, user) => {
                if (reaction.emoji.name !== "loop") if (!(await this.checkEffectPermissions(user))) return
                let canceled = false
                let premium = ["abloop", "reverse", "speed", "pitch", "eq", "fx", "volume"]
                if (premium.includes(reaction.emoji.name || "")) {
                    if (!await this.perms.checkPremiumFeature()) return
                }
                let needsProc = ["reverse", "speed", "pitch", "eq", "fx"]
                let test = needsProc.includes(reaction.emoji.name || "")
                if (this.getProcBlock() && test) {
                    await reaction.users.remove(user)
                    const proc = await this.discord.send(this.message, `<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                    Functions.deferDelete(proc, 3000)
                    return
                }
                this.setProcBlock()
                await msg.edit({embeds: [await this.updateNowPlaying()]})
                if (reaction.emoji.name === "reverse") {
                    await reaction.users.remove(user)
                    const rep = await this.discord.send(this.message, `<@${user.id}>, _Please wait, reversing the file..._`)
                    await this.reverse(now.file)
                    Functions.deferDelete(rep, 0)
                    await msg.edit({embeds: [await this.updateNowPlaying()]})
                    this.setProcBlock(true)
                    return
                } else if (reaction.emoji.name === "volume") {
                    let vol = 1
                    await reaction.users.remove(user)
                    async function getVolumeChange(response: Message) {
                        if (response.content.trim().toLowerCase() === "cancel") {
                            canceled = true
                            return Functions.deferDelete(response, 0)
                        }
                        if (Number.isNaN(Number(response.content)) || Number(response.content) < 0 || Number(response.content) > 2) {
                            const rep = await response.reply("You must pass a number between 0 and 2.")
                            Functions.deferDelete(rep, 3000)
                        } else {
                            vol = Number(response.content)
                        }
                        await Functions.deferDelete(response, 0)
                    }
                    const rep = await this.discord.send(this.message, `<@${user.id}>, Enter a volume scaling factor \`0-2\`. _(Or cancel to quit)._`)
                    await this.embeds.createPrompt(getVolumeChange)
                    Functions.deferDelete(rep, 0)
                    if (canceled) return this.setProcBlock(true)
                    await this.volume(vol)
                    await msg.edit({embeds: [await this.updateNowPlaying()]})
                    this.setProcBlock(true)
                } else if (reaction.emoji.name === "speed") {
                    let factor = 1.0
                    let setPitch = false
                    await reaction.users.remove(user)
                    async function getSpeedChange(response: Message) {
                        if (response.content.trim().toLowerCase() === "cancel") {
                            canceled = true
                            return Functions.deferDelete(response, 0)
                        }
                        response.content = response.content.replace("x", "")
                        if (response.content.includes("pitch")) {
                            setPitch = true
                            response.content = response.content.replace("pitch", "")
                        }
                        if (response.content?.trim() && Number.isNaN(Number(response.content))) {
                            const rep = await response.reply("You must pass a valid speed factor, eg. \`1.5x\` or \`0.5x\`.")
                            Functions.deferDelete(rep, 3000)
                        } else {
                            factor = Number(response.content)
                        }
                        await Functions.deferDelete(response, 0)
                    }
                    const rep = await this.discord.send(this.message, `<@${user.id}>, Enter the new speed, eg \`1.5x\`. Add \`pitch\` to also change the pitch along with the speed. _(Or cancel to quit)._`)
                    await this.embeds.createPrompt(getSpeedChange)
                    Functions.deferDelete(rep, 0)
                    if (canceled) return this.setProcBlock(true)
                    const rep2 = await this.discord.send(this.message, `<@${user.id}>, _Please wait, changing the speed of the file..._`)
                    await this.speed(now.file, factor, setPitch)
                    Functions.deferDelete(rep2, 0)
                    await msg.edit({embeds: [await this.updateNowPlaying()]})
                    this.setProcBlock(true)
                    return
                } else if (reaction.emoji.name === "loop") {
                    await reaction.users.remove(user)
                    const loopText = settings.looping === true ? "Disabled looping!" : "Enabled looping!"
                    const rep = await this.discord.send(this.message, `<@${user.id}>, ${loopText}`)
                    this.loop()
                    await msg.edit({embeds: [await this.updateNowPlaying()]})
                    Functions.deferDelete(rep, 1000)
                    this.setProcBlock(true)
                    return
                } else if (reaction.emoji.name === "skip") {
                    await reaction.users.remove(user)
                    const rep = await this.discord.send(this.message, `<@${user.id}>, Skipping this track! **If you added effects, be patient because they need to be re-applied.**`)
                    Functions.deferDelete(rep, 5000)
                    await this.skip()
                    this.setProcBlock(true)
                    return
                } else if (reaction.emoji.name === "pitch") {
                    let semitones = 0
                    await reaction.users.remove(user)
                    async function getPitchChange(response: Message) {
                        if (response.content.trim().toLowerCase() === "cancel") {
                            canceled = true
                            return Functions.deferDelete(response, 0)
                        }
                        if (response.content?.trim() && Number.isNaN(Number(response.content))) {
                            const rep = await response.reply("You must pass in the amount of semitones, eg. \`12\` or \`-12\`.")
                            Functions.deferDelete(rep, 3000)
                        } else {
                            semitones = Number(response.content)
                        }
                        await Functions.deferDelete(response, 0)
                    }
                    const rep = await this.discord.send(this.message, `<@${user.id}>, Enter the new pitch in semitones. 12 semitones = 1 octave. _(Or cancel to quit)._`)
                    await this.embeds.createPrompt(getPitchChange)
                    Functions.deferDelete(rep, 0)
                    if (canceled) return this.setProcBlock(true)
                    const rep2 = await this.discord.send(this.message, `<@${user.id}>, _Please wait, changing the pitch of the file..._`)
                    await this.pitch(now.file, semitones)
                    Functions.deferDelete(rep2, 0)
                    await msg.edit({embeds: [await this.updateNowPlaying()]})
                    this.setProcBlock(true)
                    return
                } else if (reaction.emoji.name === "scrub") {
                    let position = "0"
                    await reaction.users.remove(user)
                    async function getPositionChange(response: Message) {
                        if (response.content.trim().toLowerCase() === "cancel") {
                            canceled = true
                            return Functions.deferDelete(response, 0)
                        }
                        position = response.content
                        await Functions.deferDelete(response, 0)
                    }
                    const rep = await this.discord.send(this.message, `<@${user.id}>, Enter the new song position, eg. \`1:00\`. You can also fastforward or rewind, eg. \`+10\` and \`-10\`. _(Or cancel to quit)._`)
                    await this.embeds.createPrompt(getPositionChange)
                    Functions.deferDelete(rep, 0)
                    if (canceled) return this.setProcBlock(true)
                    await this.scrub(position)
                    await msg.edit({embeds: [await this.updateNowPlaying()]})
                    this.setProcBlock(true)
                    return
                } else if (reaction.emoji.name === "abloop") {
                    await reaction.users.remove(user)
                    if (settings.ablooping === true) {
                        settings.ablooping = false
                        await this.play(queue[0].file)
                        await msg.edit({embeds: [await this.updateNowPlaying()]})
                        const rep = await this.discord.send(this.message, `<@${user.id}>, Disabled A-B looping!`)
                        Functions.deferDelete(rep, 3000)
                        return
                    }
                    let start = "0"
                    let end = now.duration
                    async function getABLoop(response: Message) {
                        if (response.content.trim().toLowerCase() === "cancel") {
                            canceled = true
                            return Functions.deferDelete(response, 0)
                        }
                        const repArgs = response.content.split(" ")
                        start = repArgs[0]
                        end = repArgs[1]
                        await Functions.deferDelete(response, 0)
                    }
                    const rep = await this.discord.send(this.message, `<@${user.id}>, Enter the starting time and the ending time for the A-B loop. eg \`1:00 1:30\`. _(Or cancel to quit)._`)
                    await this.embeds.createPrompt(getABLoop)
                    Functions.deferDelete(rep, 0)
                    if (canceled) return this.setProcBlock(true)
                    const rep2 = await this.discord.send(this.message, `<@${user.id}>, Enabled A-B Looping!`)
                    Functions.deferDelete(rep2, 3000)
                    settings.ablooping = true
                    await msg.edit({embeds: [await this.updateNowPlaying()]})
                    this.setProcBlock(true)
                    await this.abloop(start, end)
                    return
                } else if (reaction.emoji.name === "clear") {
                    await reaction.users.remove(user)
                    await this.clear()
                    const rep = await this.discord.send(this.message, `<@${user.id}>, Cleared all effects that were applied to this song!`)
                    Functions.deferDelete(rep, 3000)
                    await msg.edit({embeds: [await this.updateNowPlaying()]})
                    this.setProcBlock(true)
                    return
                } else if (reaction.emoji.name === "mp3") {
                    await reaction.users.remove(user)
                    await this.mp3Download(user.id)
                    this.setProcBlock(true)
                    return
                } else if (reaction.emoji.name === "eq") {
                    await reaction.users.remove(user)
                    const m = await this.equalizerMenu(true)
                    await msg.edit({embeds: [await this.updateNowPlaying()]})
                    Functions.deferDelete(m, 0)
                    this.setProcBlock(true)
                    return
                } else if (reaction.emoji.name === "fx") {
                    await reaction.users.remove(user)
                    const m = await this.fxMenu(true)
                    await msg.edit({embeds: [await this.updateNowPlaying()]})
                    Functions.deferDelete(m, 0)
                    this.setProcBlock(true)
                    return
                }
                await reaction.users.remove(user)
                await this[reactions[i]]()
                this.setProcBlock(true)
            })
        }
    }

    public updateNowPlaying = async (position?: number) => {
        if (!position) position = 0
        const duration = await this.getDuration()
        const durationStr = this.parseSCDuration(duration*1000)
        const discord = this.discord
        const queue = this.getQueue()
        const settings = this.getSettings()
        const now = queue[position]
        let details = ""
        if (now?.kind === "link") {
            details =
            `${settings.autoplay ? `${discord.getEmoji("autoplay")}Autoplay is **on**! ${discord.getEmoji("tohruSmug")}\n` : ""}` +
            `${settings.looping || settings.ablooping ? `${settings.ablooping ? discord.getEmoji("abloop") : discord.getEmoji("loop")}Loop mode is **on**! ${discord.getEmoji("aquaUp")}\n` : ""}` +
            `${settings.reverse ? `${discord.getEmoji("reverse")}Reverse mode is **on**! ${discord.getEmoji("gabYes")}\n` : ""}` +
            `${discord.getEmoji("star")}_Duration:_ \`${durationStr}\`\n` +
            `${discord.getEmoji("star")}_Link:_ ${now.url.length < 1000 ? now.url : "Link is too long"}\n` +
            `${discord.getEmoji("speed")}_Speed:_ **${settings.speed}x**  ` +
            `${discord.getEmoji("pitch")}_Freq:_ **${Number(settings.pitch) > -1 ? `+${settings.pitch}` : settings.pitch}** ${discord.getEmoji("volume")}_Volume:_ **${settings.volume}**\n` +
            `${discord.getEmoji("highpass")}_Filters:_ _${settings.filters[0] ? settings.filters.map((f: string) => Functions.toProperCase(f)).join(", ") : "None"}_  ` +
            `${discord.getEmoji("delay")}_Effects:_ _${settings.effects[0] ? settings.effects.map((e: string) => Functions.toProperCase(e)).join(", ") : "None"}_\n` +
            `${discord.getEmoji("position")}_Song position:_ \`${this.parseSCDuration(Number(this.time()*1000))}\`\n` +
            `_Added by ${now.requester}_`
        } else {
            details =
            `${settings.autoplay ? `${discord.getEmoji("autoplay")}Autoplay is **on**! ${discord.getEmoji("tohruSmug")}\n` : ""}` +
            `${settings.looping || settings.ablooping ? `${settings.ablooping ? discord.getEmoji("abloop") : discord.getEmoji("loop")}Loop mode is **on**! ${discord.getEmoji("aquaUp")}\n` : ""}` +
            `${settings.reverse ? `${discord.getEmoji("reverse")}Reverse mode is **on**! ${discord.getEmoji("gabYes")}\n` : ""}` +
            `${discord.getEmoji("star")}_Title:_ [**${now?.title ?? "Unknown"}**](${now.url})\n` +
            `${discord.getEmoji("star")}_Artist:_ **${now.artist}**\n` +
            `${discord.getEmoji("star")}_Duration:_ \`${durationStr}\`\n` +
            `${discord.getEmoji("speed")}_Speed:_ **${settings.speed}x**  ` +
            `${discord.getEmoji("pitch")}_Freq:_ **${Number(settings.pitch) > -1 ? `+${settings.pitch}` : settings.pitch}** ${discord.getEmoji("volume")}_Volume:_ **${settings.volume}**\n` +
            `${discord.getEmoji("highpass")}_Filters:_ _${settings.filters[0] ? settings.filters.map((f: string) => Functions.toProperCase(f)).join(", ") : "None"}_  ` +
            `${discord.getEmoji("delay")}_Effects:_ _${settings.effects[0] ? settings.effects.map((e: string) => Functions.toProperCase(e)).join(", ") : "None"}_\n` +
            `${discord.getEmoji("position")}_Song position:_ \`${this.parseSCDuration(Number(this.time()*1000))}\`\n` +
            `_Added by ${now.requester}_`
        }
        const nowEmbed = this.embeds.createEmbed()
        nowEmbed
        .setAuthor({name: "playing", iconURL: "https://clipartmag.com/images/musical-notes-png-11.png"})
        .setTitle(`**Now Playing** ${this.discord.getEmoji("chinoSmug")}`)
        .setURL(now.url)
        .setThumbnail(now.image || null)
        .setDescription(details)
        return nowEmbed
    }

    public getDuration = async () => {
        const queue = this.getQueue()
        let duration = await this.fx.duration(queue[0].originalFile)
        return Math.round(duration)
    }

    public download = async (song: string, query?: string) => {
        let file = ""
        if (song?.match(/youtube.com|youtu.be/)) {
            const title = await this.youtube.util.getTitle(song)
            file = await this.youtube.util.downloadMP3(song, path.join(__dirname, `../assets/misc/tracks/${this.message.guild?.id}-${title}.mp3`))
        } else if (song?.match(/soundcloud.com/)) {
            const track = await this.soundcloud.tracks.get(song)
            file = await this.soundcloud.util.downloadTrack(track, path.join(__dirname, `../assets/misc/tracks/${this.message.guild?.id}-${track.title}.mp3`))
        } else {
            let name = song.split("#").shift()?.split("?").shift()?.split("/").pop()
            name = name?.match(/.(mp3|wav|ogg|webm)/) ? name : name + ".mp3"
            if (name === ".mp3") name = "noname.mp3"
            const data = await axios.get(song, {responseType: "arraybuffer", headers: this.headers}).then((r) => r.data)
            const dest = path.join(__dirname, `../assets/misc/tracks/${this.message.guild?.id} ${name}`)
            if (!fs.existsSync(path.dirname(dest))) fs.mkdirSync(path.dirname(dest), {recursive: true})
            fs.writeFileSync(dest, Buffer.from(data, "binary"))
            file = dest
        }
        return file
    }

    public applyEffects = async (newFile: string) => {
        const settings = this.getSettings()
        if (settings.reverse) {
            await this.reverse(newFile, false, true)
            newFile = this.getQueue()[0].file
        }
        if (Number(settings.pitch) !== 0) {
            await this.pitch(newFile, Number(settings.pitch), false, true)
            newFile = this.getQueue()[0].file
        }
        if (Number(settings.speed) !== 1) {
            await this.speed(newFile, Number(settings.speed), Boolean(settings.speedParam), false, true)
            newFile = this.getQueue()[0].file
        }
        if (settings.filters[0]) {
            for (let i = 0; i < settings.filters.length; i++) {
                const params = Functions.removeDuplicates(settings.filterParams[settings.filters[i]])
                await this[settings.filters[i]]?.(newFile, ...params)
            }
            newFile = this.getQueue()[0].file
        }
        if (settings.effects[0]) {
            for (let i = 0; i < settings.effects.length; i++) {
                const params = Functions.removeDuplicates(settings.effectParams[settings.effects[i]])
                await this[settings.effects[i]]?.(newFile, ...params)
            }
            newFile = this.getQueue()[0].file
        }
        return newFile
    }

    public hasEffects = () => {
        const settings = this.getSettings()
        if (settings.reverse) {
            return true
        }
        if (Number(settings.pitch) !== 0) {
            return true
        }
        if (Number(settings.speed) !== 1) {
            return true
        }
        if (settings.filters[0]) {
            return true
        }
        if (settings.effects[0]) {
            return true
        }
        return false
    }

    public deleteCurrent = (onlyEffect?: boolean) => {
        const queue = this.getQueue()
        if (!onlyEffect) {
            fs.unlink(queue[0].originalFile, () => null)
        }
        if (queue[0].file !== queue[0].originalFile) {
            fs.unlink(queue[0].file, () => null)
        }
    }

    public playerFinished = async (newState: AudioPlayerState, player: AudioPlayer, file: string) => {
        if (this.getProcBlock()) return
        const finished = (newState.status === AudioPlayerStatus.Idle)
        if (!finished) return
        const queue = this.getQueue()
        const settings = this.getSettings()
        let next: string | null
        let skipPlaying = false
        if (settings.looping) {
            next = file
            if (settings.seekOffset > 0) {
                next = queue[0].originalFile
                settings.seekOffset = 0
            }
            skipPlaying = true
        } else {
            this.deleteCurrent()
            queue.shift()
            next = this.next()
        }
        if (next) {
            const nextFX = await this.applyEffects(next)
            await this.play(nextFX)
            let nowPlaying: string | undefined
            if (!skipPlaying) nowPlaying = await this.nowPlaying()
            if (nowPlaying) await this.discord.send(this.message, nowPlaying)
        } else {
            if (settings.autoplay) {
                settings.seekOffset = 0
                const defSong = defaults.songs[Math.floor(Math.random()*defaults.songs.length)]
                const file = await this.download(defSong)
                await this.queueAdd(defSong, file)
                const nextFX = await this.applyEffects(file)
                await this.play(nextFX)
                const nowPlaying = await this.nowPlaying()
                if (nowPlaying) await this.discord.send(this.message, nowPlaying)
            } else {
                player.stop()
                const connection = getVoiceConnection(this.message.guild!.id)
                connection?.disconnect()
                connection?.destroy()
                this.deleteQueue()
                return this.discord.send(this.message, `There are no more songs left in the queue, left the voice channel.`)
            }
        }
    }

    public play = async (file: string, start = 0) => {
        const settings = this.getSettings()
        const connection = getVoiceConnection(this.message.guild!.id)
        if (!connection) return
        if (connection.state.status !== VoiceConnectionStatus.Ready) return

        let player = connection.state.subscription?.player!
        if (!player) {
            player = createAudioPlayer()
            connection.subscribe(player)
            player.on("stateChange", async (oldState, newState) => this.playerFinished(newState, player, file))
        }

        let stream = createAudioResourceAndSeek(file, {seekTo: start, inlineVolume: true})
        stream.volume?.setVolumeLogarithmic(settings.volume)
        player.play(stream)
        if (player.state.status === AudioPlayerStatus.Paused) player.unpause()
        const queue = this.getQueue()
        if (!queue[0]) await this.queueAdd(file, file)
        queue[0].playing = true
    }

    public skip = async (num?: number) => {
        let amount = num ? num : 1
        const queue = this.getQueue()
        const settings = this.getSettings()
        settings.ablooping = false
        if (amount > queue.length) amount = queue.length
        this.deleteCurrent()
        let i = 0
        do {
            queue.shift()
            i++
        } while (i < amount - 1)
        const next = this.next()
        if (next) {
            const nextFX = await this.applyEffects(next)
            await this.play(nextFX)
            const nowPlaying = await this.nowPlaying()
            if (nowPlaying) await this.discord.send(this.message, nowPlaying)
        } else {
            if (settings.autoplay) {
                settings.seekOffset = 0
                const defSong = defaults.songs[Math.floor(Math.random()*defaults.songs.length)]
                const file = await this.download(defSong)
                await this.queueAdd(defSong, file)
                const nextFX = await this.applyEffects(file)
                await this.play(nextFX)
                const nowPlaying = await this.nowPlaying()
                if (nowPlaying) await this.discord.send(this.message, nowPlaying)
            } else {
                const connection = getVoiceConnection(this.message.guild!.id)
                if (connection?.state.status === VoiceConnectionStatus.Ready) connection.state.subscription?.player.stop()
                connection?.disconnect()
                connection?.destroy()
                return this.discord.send(this.message, `There are no more songs in the queue, stopped playback.`)
            }
        }
    }

    public scrub = (position: string) => {
        if (position.startsWith("+")) {
            position = position.replace("+", "")
            return this.fastforward(position)
        } else if (position.startsWith("-")) {
            position = position.replace("-", "")
            return this.rewind(position)
        }
        const connection = getVoiceConnection(this.message.guild!.id)
        if (!connection) return
        const seconds = this.parseSeconds(position)
        if (Number.isNaN(seconds)) return this.discord.reply(this.message, "Provide the time in \`00:00\` format...").then((m) => Functions.deferDelete(m, 3000))
        const queue = this.getQueue()
        return this.play(queue[0].file, seconds)
    }

    public abloop = async (start: string, end: string) => {
        const queue = this.getQueue()
        const settings = this.getSettings()
        const startSec = this.parseSeconds(start)
        const endSec = this.parseSeconds(end)
        if (Number.isNaN(startSec) || Number.isNaN(endSec)) {
            const rep = await this.discord.reply(this.message, "Provide the time in \`00:00\` format...")
            Functions.deferDelete(rep, 3000)
            return
        }
        const diff = endSec - startSec
        while (settings.ablooping) {
            this.play(queue[0].file, startSec)
            await Functions.timeout(diff * 1000)
        }
    }

    public clear = () => {
        const queue = this.getQueue()
        const settings = this.getSettings()
        settings.speed = 1.0
        settings.pitch = 0
        settings.filters = []
        settings.effects = []
        settings.filterParams = {}
        settings.effectParams = {}
        settings.reverse = false
        settings.ablooping = false
        this.deleteCurrent(true)
        this.setProcBlock(true)
        queue[0].file = queue[0].originalFile
        return this.play(queue[0].originalFile)
    }

    public mp3Download = async (userID: string) => {
        const queue = this.getQueue()
        const file = queue[0].file
        const attachment = new AttachmentBuilder(file, {name: `${path.basename(file)}`})
        await this.discord.send(this.message, `<@${userID}>, Here is the download for this file!`, attachment)
        return
    }

    public parseSeconds = (input: string) => {
        let seconds = 0
        if (input?.match(/:/g)?.length === 2) {
            const arr = input.split(":")
            seconds += Number(arr[0]) * 60 * 60
            seconds += Number(arr[1]) * 60
            seconds += Number(arr[2])
        } else if (input?.match(/:/g)?.length === 1) {
            const arr = input.split(":")
            seconds += Number(arr[0]) * 60
            seconds += Number(arr[1])
        } else {
            seconds = Number(input)
        }
        return seconds
    }

    public songPickerYT = async (query: string, first?: boolean) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const results = await this.youtube.videos.search({q: query, maxResults: 15}).then((r) => r.items)
        const links = results.map((r) => `https://www.youtube.com/watch?v=${r.id.videoId}`)
        if (first) return links[0]
        const titles = results.map((r) => r.snippet.title)
        // @ts-ignore
        const images = results.map((r) => r.snippet.thumbnails?.maxres?.url ?? r.snippet.thumbnails.high.url)
        const songArray: EmbedBuilder[] = []
        for (let i = 0; i < links.length; i+=3) {
            let description = ""
            for (let j = 0; j < 3; j++) {
                if (!titles[i+j]) break
                description += `${discord.getEmoji(`${j+1}n`)} => [**${titles[i+j]}**](${links[i+j]})\n`
            }
            const songEmbed = embeds.createEmbed()
            songEmbed
            .setAuthor({name: "youtube", iconURL: "https://cdn4.iconfinder.com/data/icons/social-media-2210/24/Youtube-512.png", url: "https://www.youtube.com/"})
            .setTitle(`**Youtube Search** ${discord.getEmoji("vigneXD")}`)
            .setThumbnail(images[i] || null)
            .setDescription(description)
            .setFooter({text: `Page ${Math.floor(i/3) + 1}/${Math.ceil(links.length / 3)}`, iconURL: this.discord.displayAvatar(message)})
            songArray.push(songEmbed)
        }
        return this.playReactionEmbed(songArray, links, "youtube", query)
    }

    public songPickerSC = async (query: string, first?: boolean) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const results = await this.soundcloud.tracks.search({q: query}).then((t) => t.collection)
        const links = results.map((r) => r.permalink_url)
        if (first) return links[0]
        const titles = results.map((r) => r.title)
        const images = results.map((r) => r.artwork_url)
        const songArray: EmbedBuilder[] = []
        for (let i = 0; i < links.length; i+=3) {
            let description = ""
            for (let j = 0; j < 3; j++) {
                if (!titles[i+j]) break
                description += `${discord.getEmoji(`${j+1}n`)} => [**${titles[i+j]}**](${links[i+j]})\n`
            }
            const songEmbed = embeds.createEmbed()
            songEmbed
            .setAuthor({name: "soundcloud", iconURL: "https://icons.iconarchive.com/icons/danleech/simple/256/soundcloud-icon.png", url: "https://www.soundcloud.com/"})
            .setTitle(`**Soundcloud Search** ${discord.getEmoji("vigneXD")}`)
            .setThumbnail(images[i] || null)
            .setDescription(description)
            .setFooter({text: `Page ${Math.floor(i/3) + 1}/${Math.ceil(links.length / 3)}`, iconURL: this.discord.displayAvatar(message)})
            songArray.push(songEmbed)
        }
        return this.playReactionEmbed(songArray, links, "soundcloud", query)
    }

    public playReactionEmbed = async (songArray: EmbedBuilder[], links: string[], kind: string, query: string) => {
        const message = this.message
        const discord = this.discord
        if (!songArray[0]) return null
        const msg = await this.discord.send(this.message, songArray[0])
        const reactions = ["right", "left", "1n", "2n", "3n", "random"]
        await msg.react(discord.getEmoji(reactions[0]))
        await msg.react(discord.getEmoji(reactions[1]))
        await msg.react(discord.getEmoji(reactions[2]))
        if (links[1]) await msg.react(discord.getEmoji(reactions[3]))
        if (links[2]) await msg.react(discord.getEmoji(reactions[4]))
        await msg.react(discord.getEmoji(reactions[5]))
        if (kind === "soundcloud") await msg.react(discord.getEmoji("youtube"))
        if (kind === "youtube") await msg.react(discord.getEmoji("soundcloud"))
        const rightCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("right").id && user.bot === false
        const leftCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("left").id && user.bot === false
        const oneCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("1n").id && user.bot === false
        const twoCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("2n").id && user.bot === false
        const threeCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("3n").id && user.bot === false
        const randomCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("random").id && user.bot === false
        const soundcloudCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("soundcloud").id && user.bot === false
        const youtubeCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("youtube").id && user.bot === false
        const right = msg.createReactionCollector({filter: rightCheck})
        const left = msg.createReactionCollector({filter: leftCheck})
        const one = msg.createReactionCollector({filter: oneCheck})
        const two = msg.createReactionCollector({filter: twoCheck})
        const three = msg.createReactionCollector({filter: threeCheck})
        const random = msg.createReactionCollector({filter: randomCheck})
        const soundcloud = msg.createReactionCollector({filter: soundcloudCheck})
        const youtube = msg.createReactionCollector({filter: youtubeCheck})
        const numCollectors = [one, two, three]

        let page = 0
        left.on("collect", async (reaction: MessageReaction, user: User) => {
            if (page === 0) {
                page = songArray.length - 1
            } else {
                page--
            }
            msg.edit({embeds: [songArray[page]]})
            await reaction.users.remove(user)
        })
        right.on("collect", async (reaction: MessageReaction, user: User) => {
            if (page === songArray.length - 1) {
                page = 0
            } else {
                page++
            }
            msg.edit({embeds: [songArray[page]]})
            await reaction.users.remove(user)
        })
        soundcloud.on("collect", async (reaction, user) => {
            soundcloud.stop()
            await reaction.users.remove(user)
            await this.songPickerSC(query)
        })
        youtube.on("collect", async (reaction, user) => {
            youtube.stop()
            await reaction.users.remove(user)
            await this.songPickerYT(query)
        })
        let finalLink = ""
        await new Promise<void>((resolve) => {
            for (let i = 0; i < numCollectors.length; i++) {
                numCollectors[i].on("collect", async (reaction: MessageReaction, user: User) => {
                    const link = links[numMap[i+1][page]]
                    numCollectors.forEach((c) => c.stop())
                    await reaction.users.remove(user)
                    finalLink = link
                    resolve()
                })
            }
            random.on("collect", async (reaction: MessageReaction, user: User) => {
                const rand = Math.floor(Math.random()*links.length)
                random.stop()
                await reaction.users.remove(user)
                finalLink = links[rand]
                resolve()
            })
        })
        return finalLink
    }

    public parseYTDuration = (duration: string, returnSeconds?: boolean) => {
        const matches = duration?.match(/[0-9]+[HMS]/g)
        if (!matches) return "0:00"
        let hours = "0"
        let minutes = "00"
        let seconds = "00"
        matches.forEach(function(part) {
            const unit = part.charAt(part.length-1)
            const amount = String(parseInt(part.slice(0, -1), 10))
            switch (unit) {
                case "H":
                    hours = amount
                    break
                case "M":
                    minutes = amount
                    break
                case "S":
                    seconds = Number(amount) < 10 ? `0${amount}` : amount
                    break
                default:
            }
        })
        if (returnSeconds) {
            let s = 0
            s += Number(hours) * 60 * 60
            s += Number(minutes) * 60
            s+= Number(seconds)
            return s
        }
        const text = `${hours === "0" ? "" : `${hours}:`}${minutes}:${seconds}`
        return text
    }

    public parseSCDuration = (duration: number) => {
        duration = Number(duration)
        let seconds = Math.floor((duration / 1000) % 60) as any
        let minutes = Math.floor((duration / (1000 * 60)) % 60) as any
        let hours = Math.floor((duration / (1000 * 60 * 60)) % 24) as any

        hours = (hours === 0) ? "" : ((hours < 10) ? "0" + hours + ":" : hours + ":")
        minutes = (minutes < 10) ? "0" + minutes : minutes
        seconds = (seconds < 10) ? "0" + seconds : seconds
        return `${hours}${minutes}:${seconds}`
    }

    public equalizerMenu = async (clearProc?: boolean) => {
        if (clearProc) this.setProcBlock(true)
        const discord = this.discord
        const eqEmbed = this.embeds.createEmbed()
        eqEmbed
        .setAuthor({name: "equalizer", iconURL: "https://clipartmag.com/images/musical-notes-png-11.png"})
        .setTitle(`**Audio Equalizer** ${discord.getEmoji("raphiSmile")}`)
        .setDescription(
            `_Here are the different filter types that you can choose from:_\n` +
            `${discord.getEmoji("highpass")}_Highpass Filter_ -> _Removes low frequencies._\n` +
            `${discord.getEmoji("highshelf")}_Highshelf Filter_ -> _Boosts/attenuates all frequencies above the cutoff frequency._\n` +
            `${discord.getEmoji("bandpass")}_Bandpass Filter_ -> _Removes both low frequencies and high frequencies._\n` +
            `${discord.getEmoji("peak")}_Peak Filter_ -> _Carves boosts/cuts in a certain frequency range._\n` +
            `${discord.getEmoji("bandreject")}_Bandreject Filter_ -> _An inverted bandpass filter, use a high Q factor to get a notch filter._\n` +
            `${discord.getEmoji("lowshelf")}_Lowshelf Filter_ -> _Boosts/attenuates all frequencies below the cutoff frequency._\n` +
            `${discord.getEmoji("lowpass")}_Lowpass Filter_ -> _Removes high frequencies._\n` +
            `_Frequency and width are in Hz. If applicable, resonance is a Q factor and gain is in decibels._`
        )
        const msg = await this.discord.reply(this.message, eqEmbed)
        const reactions = ["highpass", "highshelf", "bandpass", "peak", "bandreject", "lowshelf", "lowpass", "cancel"]
        for (let i = 0; i < reactions.length; i++) await msg.react(discord.getEmoji(reactions[i]))

        const highpassCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("highpass").id && user.bot === false
        const highshelfCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("highshelf").id && user.bot === false
        const bandpassCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("bandpass").id && user.bot === false
        const peakCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("peak").id && user.bot === false
        const bandrejectCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("bandreject").id && user.bot === false
        const lowshelfCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("lowshelf").id && user.bot === false
        const lowpassCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("lowpass").id && user.bot === false
        const cancelCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("cancel").id && user.bot === false
        const highpass = msg.createReactionCollector({filter: highpassCheck})
        const highshelf = msg.createReactionCollector({filter: highshelfCheck})
        const bandpass = msg.createReactionCollector({filter: bandpassCheck})
        const peak = msg.createReactionCollector({filter: peakCheck})
        const bandreject = msg.createReactionCollector({filter: bandrejectCheck})
        const lowshelf = msg.createReactionCollector({filter: lowshelfCheck})
        const lowpass = msg.createReactionCollector({filter: lowpassCheck})
        const cancel = msg.createReactionCollector({filter: cancelCheck})

        const pass = ["highpass", "bandpass", "bandreject", "lowpass"]
        const passCol = [highpass, bandpass, bandreject, lowpass]
        const shelf = ["highshelf", "lowshelf"]
        const shelfCol = [highshelf, lowshelf]

        await new Promise<void>((resolve) => {
        let canceled = false
        for (let i = 0; i < pass.length; i++) {
            passCol[i].on("collect", async (reaction, user) => {
                if (!(await this.checkEffectPermissions(user))) return
                if (this.getProcBlock()) {
                    await reaction.users.remove(user)
                    const proc = await this.discord.send(this.message, `<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                    Functions.deferDelete(proc, 3000)
                    return
                }
                this.setProcBlock()
                await reaction.users.remove(user)
                let freq = 600
                let width = 100
                async function getParams(response: Message) {
                    if (response.content.trim().toLowerCase() === "cancel") {
                        canceled = true
                        return Functions.deferDelete(response, 0)
                    }
                    const rArgs = response.content.split(" ")
                    freq = Number(rArgs[0])
                    width = Number(rArgs[1])
                    await Functions.deferDelete(response, 0)
                }
                const rep = await this.discord.send(this.message, `<@${user.id}>, Enter the cutoff frequency and filter width (in Hz). _(Or cancel to quit)._`)
                await this.embeds.createPrompt(getParams)
                Functions.deferDelete(rep, 0)
                if (canceled) return this.setProcBlock(true)
                const settings = this.getSettings()
                const queue = this.getQueue()
                settings.filters.push(pass[i])
                const rep3 = await this.discord.send(this.message, `<@${user.id}>, Adding a ${pass[i]} filter, please wait...`)
                await this[pass[i]](queue[0].file, freq, width, false)
                this.setProcBlock(true)
                Functions.deferDelete(rep3, 0)
                const rep2 = await this.discord.send(this.message, `<@${user.id}>, Added a ${pass[i]} filter!`)
                Functions.deferDelete(rep2, 3000)
                resolve()
            })
        }

        for (let i = 0; i < shelf.length; i++) {
            shelfCol[i].on("collect", async (reaction, user) => {
                if (!(await this.checkEffectPermissions(user))) return
                if (this.getProcBlock()) {
                    await reaction.users.remove(user)
                    const proc = await this.discord.send(this.message, `<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                    Functions.deferDelete(proc, 3000)
                    return
                }
                this.setProcBlock()
                await reaction.users.remove(user)
                let gain = 3
                let freq = 600
                let width = 100
                async function getParams(response: Message) {
                    if (response.content.trim().toLowerCase() === "cancel") {
                        canceled = true
                        return Functions.deferDelete(response, 0)
                    }
                    const rArgs = response.content.split(" ")
                    gain = Number(rArgs[0])
                    freq = Number(rArgs[1])
                    width = Number(rArgs[2])
                    await Functions.deferDelete(response, 0)
                }
                const rep = await this.discord.send(this.message, `<@${user.id}>, Enter the gain (in decibels), the cutoff frequency, and the filter width (in Hz). _(Or cancel to quit)._`)
                await this.embeds.createPrompt(getParams)
                Functions.deferDelete(rep, 0)
                if (canceled) return this.setProcBlock(true)
                const settings = this.getSettings()
                const queue = this.getQueue()
                settings.filters.push(shelf[i])
                const rep3 = await this.discord.send(this.message, `<@${user.id}>, Adding a ${shelf[i]} filter, please wait...`)
                await this[pass[i]](queue[0].file, gain, freq, width, false)
                this.setProcBlock(true)
                Functions.deferDelete(rep3, 0)
                const rep2 = await this.discord.send(this.message, `<@${user.id}>, Added a ${shelf[i]} filter!`)
                Functions.deferDelete(rep2, 3000)
                resolve()
            })
        }

        peak.on("collect", async (reaction, user) => {
            if (!(await this.checkEffectPermissions(user))) return
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.discord.send(this.message, `<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user)
            let freq = 1000
            let resonance = 2
            let gain = 3
            async function getParams(response: Message) {
                if (response.content.trim().toLowerCase() === "cancel") {
                    canceled = true
                    return Functions.deferDelete(response, 0)
                }
                const rArgs = response.content.split(" ")
                gain= Number(rArgs[0])
                freq = Number(rArgs[1])
                resonance = Number(rArgs[2])
                await Functions.deferDelete(response, 0)
            }
            const rep = await this.discord.send(this.message, `<@${user.id}>, Enter the gain (in decibels), the cutoff frequency (in Hz), and the resonance (Q Factor). _(Or cancel to quit)._`)
            await this.embeds.createPrompt(getParams)
            Functions.deferDelete(rep, 0)
            if (canceled) return this.setProcBlock(true)
            const settings = this.getSettings()
            const queue = this.getQueue()
            settings.filters.push("peak")
            const rep3 = await this.discord.send(this.message, `<@${user.id}>, Adding a peak filter, please wait...`)
            await this.peak(queue[0].file, freq, resonance, gain)
            this.setProcBlock(true)
            Functions.deferDelete(rep3, 0)
            const rep2 = await this.discord.send(this.message, `<@${user.id}>, Added a peak filter!`)
            Functions.deferDelete(rep2, 3000)
            resolve()
        })
        cancel.on("collect", async (reaction, user) => {
            if (!(await this.checkEffectPermissions(user))) return
            this.setProcBlock(true)
            resolve()
        })
        })
        return msg
    }

    public fxMenu = async (clearProc?: boolean) => {
        if (clearProc) this.setProcBlock(true)
        const discord = this.discord
        const fxEmbed = this.embeds.createEmbed()
        .setAuthor({name: "effects", iconURL: "https://clipartmag.com/images/musical-notes-png-11.png"})
        .setTitle(`**Special Effects** ${discord.getEmoji("raphiSmile")}`)
        .setDescription(
            `_Here are the different audio effects that you can add:_\n` +
            `${discord.getEmoji("reverb")}_Reverb_ -> _Emulates room reflections._\n` +
            `${discord.getEmoji("delay")}_Delay_ -> _Repeatedly replays the signal after a certain delay._\n` +
            `${discord.getEmoji("chorus")}_Chorus_ -> _Mixes the signal with delayed, pitch modulated copies._\n` +
            `${discord.getEmoji("phaser")}_Phaser_ -> _Modulates allpass filters for a phase cancellation effect._\n` +
            `${discord.getEmoji("flanger")}_Flanger_ -> _Modulates comb filters with a very short delay time._\n` +
            `${discord.getEmoji("bitcrush")}_Bitcrush_ -> _Decreases the sample rate._\n` +
            `${discord.getEmoji("upsample")}_Upsample_ -> _Increases the sample rate._\n` +
            `${discord.getEmoji("distortion")}_Distortion_ -> _Soft clips the audio._\n` +
            `${discord.getEmoji("compression")}_Compression_ -> _Reduces the dynamic range._\n` +
            `${discord.getEmoji("allpass")}_Allpass Filter_ -> _Changes the phase relationship of frequencies._\n` +
            `${discord.getEmoji("tremolo")}_Tremelo_ -> _Amplitude modulation with an LFO._`
        )
        const reactions = ["reverb", "delay", "chorus", "phaser", "flanger", "bitcrush", "upsample", "distortion", "compression", "allpass", "tremolo", "cancel"]
        const msg = await this.discord.reply(this.message, fxEmbed)
        for (let i = 0; i < reactions.length; i++) await msg.react(discord.getEmoji(reactions[i]))

        const reverbCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("reverb").id && user.bot === false
        const delayCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("delay").id && user.bot === false
        const chorusCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("chorus").id && user.bot === false
        const phaserCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("phaser").id && user.bot === false
        const flangerCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("flanger").id && user.bot === false
        const bitcrushCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("bitcrush").id && user.bot === false
        const upsampleCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("upsample").id && user.bot === false
        const distortionCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("distortion").id && user.bot === false
        const compressionCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("compression").id && user.bot === false
        const allpassCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("allpass").id && user.bot === false
        const tremoloCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("tremolo").id && user.bot === false
        const cancelCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("cancel").id && user.bot === false
        const reverb = msg.createReactionCollector({filter: reverbCheck})
        const delay = msg.createReactionCollector({filter: delayCheck})
        const chorus = msg.createReactionCollector({filter: chorusCheck})
        const phaser = msg.createReactionCollector({filter: phaserCheck})
        const flanger = msg.createReactionCollector({filter: flangerCheck})
        const bitcrush = msg.createReactionCollector({filter: bitcrushCheck})
        const upsample = msg.createReactionCollector({filter: upsampleCheck})
        const distortion = msg.createReactionCollector({filter: distortionCheck})
        const compression = msg.createReactionCollector({filter: compressionCheck})
        const allpass = msg.createReactionCollector({filter: allpassCheck})
        const tremolo = msg.createReactionCollector({filter: tremoloCheck})
        const cancel = msg.createReactionCollector({filter: cancelCheck})
        let argArray: any[] = []
        let canceled = false
        async function parseArgs(response: Message) {
            if (response.content.trim().toLowerCase() === "cancel") {
                canceled = true
                return Functions.deferDelete(response, 0)
            }
            const rArgs = response.content.split(" ")
            argArray = rArgs
            await Functions.deferDelete(response, 0)
            return rArgs
        }
        await new Promise<void>((resolve) => {
        reverb.on("collect", async (reaction, user) => {
            if (!(await this.checkEffectPermissions(user))) return
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.discord.send(this.message, `<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user)
            const rep = await this.discord.send(this.message, `<@${user.id}>, Enter the amount, damping, room, stereo, pre-delay, and wet-gain. _(Or cancel to quit)._`)
            await this.embeds.createPrompt(parseArgs)
            const amount = Number(argArray[0])
            const damping = Number(argArray[1])
            const room = Number(argArray[2])
            const stereo = Number(argArray[3])
            const preDelay = Number(argArray[4])
            const wetGain = Number(argArray[5])
            const reverse = Boolean(argArray[6])
            Functions.deferDelete(rep, 0)
            if (canceled) return this.setProcBlock(true)
            const settings = this.getSettings()
            const queue = this.getQueue()
            settings.effects.push("reverb")
            const file = queue[0].file
            const rep2 = await this.discord.send(this.message, `<@${user.id}>, Adding reverb, please wait...`)
            await this.reverb(file, amount, damping, room, stereo, preDelay, wetGain, reverse, false)
            this.setProcBlock(true)
            Functions.deferDelete(rep2, 0)
            const rep3 = await this.discord.send(this.message, `<@${user.id}>, Added reverb!`)
            Functions.deferDelete(rep3, 3000)
            resolve()
        })

        delay.on("collect", async (reaction, user) => {
            if (!(await this.checkEffectPermissions(user))) return
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.discord.send(this.message, `<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user)
            const rep = await this.discord.send(this.message, `<@${user.id}>, Enter pairs of delay and decay times. _(Or cancel to quit)._`)
            await this.embeds.createPrompt(parseArgs)
            const delaysDecays = argArray.map((a) => Number(a) ? Number(a) : 0)
            if (delaysDecays.length % 2 === 1) delaysDecays.push(0)
            Functions.deferDelete(rep, 0)
            if (canceled) return this.setProcBlock(true)
            const settings = this.getSettings()
            const queue = this.getQueue()
            settings.effects.push("delay")
            const file = queue[0].file
            const rep2 = await this.discord.send(this.message, `<@${user.id}>, Adding delay, please wait...`)
            await this.delay(file, delaysDecays, false)
            this.setProcBlock(true)
            Functions.deferDelete(rep2, 0)
            const rep3 = await this.discord.send(this.message, `<@${user.id}>, Added delay!`)
            Functions.deferDelete(rep3, 3000)
            resolve()
        })

        chorus.on("collect", async (reaction, user) => {
            if (!(await this.checkEffectPermissions(user))) return
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.discord.send(this.message, `<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user)
            const rep = await this.discord.send(this.message, `<@${user.id}>, Enter the delay, decay, speed, and depth. _(Or cancel to quit)._`)
            await this.embeds.createPrompt(parseArgs)
            const delay = Number(argArray[0])
            const decay = Number(argArray[1])
            const speed = Number(argArray[2])
            const depth = Number(argArray[3])
            Functions.deferDelete(rep, 0)
            if (canceled) return this.setProcBlock(true)
            const settings = this.getSettings()
            const queue = this.getQueue()
            settings.effects.push("chorus")
            const file = queue[0].file
            const rep2 = await this.discord.send(this.message, `<@${user.id}>, Adding chorus, please wait...`)
            await this.chorus(file, delay, decay, speed, depth, false)
            this.setProcBlock(true)
            Functions.deferDelete(rep2, 0)
            const rep3 = await this.discord.send(this.message, `<@${user.id}>, Added chorus!`)
            Functions.deferDelete(rep3, 3000)
            resolve()
        })

        phaser.on("collect", async (reaction, user) => {
            if (!(await this.checkEffectPermissions(user))) return
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.discord.send(this.message, `<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user)
            const rep = await this.discord.send(this.message, `<@${user.id}>, Enter the delay, decay, and speed. _(Or cancel to quit)._`)
            await this.embeds.createPrompt(parseArgs)
            const delay = Number(argArray[0])
            const decay = Number(argArray[1])
            const speed = Number(argArray[2])
            Functions.deferDelete(rep, 0)
            if (canceled) return this.setProcBlock(true)
            const settings = this.getSettings()
            const queue = this.getQueue()
            settings.effects.push("phaser")
            const file = queue[0].file
            const rep2 = await this.discord.send(this.message, `<@${user.id}>, Adding phaser, please wait...`)
            await this.phaser(file, delay, decay, speed, false)
            this.setProcBlock(true)
            Functions.deferDelete(rep2, 0)
            const rep3 = await this.discord.send(this.message, `<@${user.id}>, Added phaser!`)
            Functions.deferDelete(rep3, 3000)
            resolve()
        })

        flanger.on("collect", async (reaction, user) => {
            if (!(await this.checkEffectPermissions(user))) return
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.discord.send(this.message, `<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user)
            const rep = await this.discord.send(this.message, `<@${user.id}>, Enter the delay, depth, regen, width, speed, shape, phase, and interp. _(Or cancel to quit)._`)
            await this.embeds.createPrompt(parseArgs)
            const delay = Number(argArray[0])
            const depth = Number(argArray[1])
            const regen = Number(argArray[2])
            const width = Number(argArray[3])
            const speed = Number(argArray[4])
            const shape = argArray[5]
            const phase = Number(argArray[6])
            const interp = argArray[7]
            Functions.deferDelete(rep, 0)
            if (canceled) return this.setProcBlock(true)
            const settings = this.getSettings()
            const queue = this.getQueue()
            settings.effects.push("flanger")
            const file = queue[0].file
            const rep2 = await this.discord.send(this.message, `<@${user.id}>, Adding flanger, please wait...`)
            await this.flanger(file, delay, depth, regen, width, speed, shape, phase, interp, false)
            this.setProcBlock(true)
            Functions.deferDelete(rep2, 0)
            const rep3 = await this.discord.send(this.message, `<@${user.id}>, Added flanger!`)
            Functions.deferDelete(rep3, 3000)
            resolve()
        })

        bitcrush.on("collect", async (reaction, user) => {
            if (!(await this.checkEffectPermissions(user))) return
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.discord.send(this.message, `<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user)
            const rep = await this.discord.send(this.message, `<@${user.id}>, Enter the bitcrush factor. _(Or cancel to quit)._`)
            await this.embeds.createPrompt(parseArgs)
            const factor = Number(argArray[0])
            Functions.deferDelete(rep, 0)
            if (canceled) return this.setProcBlock(true)
            const settings = this.getSettings()
            const queue = this.getQueue()
            settings.effects.push("bitcrush")
            const file = queue[0].file
            const rep2 = await this.discord.send(this.message, `<@${user.id}>, Adding bitcrushing, please wait...`)
            await this.bitcrush(file, factor, false)
            this.setProcBlock(true)
            Functions.deferDelete(rep2, 0)
            const rep3 = await this.discord.send(this.message, `<@${user.id}>, Added bitcrushing!`)
            Functions.deferDelete(rep3, 3000)
            resolve()
        })

        upsample.on("collect", async (reaction, user) => {
            if (!(await this.checkEffectPermissions(user))) return
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.discord.send(this.message, `<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user)
            const rep = await this.discord.send(this.message, `<@${user.id}>, Enter the upsample factor. _(Or cancel to quit)._`)
            await this.embeds.createPrompt(parseArgs)
            const factor = Number(argArray[0])
            Functions.deferDelete(rep, 0)
            if (canceled) return this.setProcBlock(true)
            const settings = this.getSettings()
            const queue = this.getQueue()
            settings.effects.push("upsample")
            const file = queue[0].file
            const rep2 = await this.discord.send(this.message, `<@${user.id}>, Adding upsampling, please wait...`)
            await this.upsample(file, factor, false)
            this.setProcBlock(true)
            Functions.deferDelete(rep2, 0)
            const rep3 = await this.discord.send(this.message, `<@${user.id}>, Added upsampling!`)
            Functions.deferDelete(rep3, 3000)
            resolve()
        })

        distortion.on("collect", async (reaction, user) => {
            if (!(await this.checkEffectPermissions(user))) return
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.discord.send(this.message, `<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user)
            const rep = await this.discord.send(this.message, `<@${user.id}>, Enter the gain and color. _(Or cancel to quit)._`)
            await this.embeds.createPrompt(parseArgs)
            const gain = Number(argArray[0])
            const color = Number(argArray[1])
            Functions.deferDelete(rep, 0)
            if (canceled) return this.setProcBlock(true)
            const settings = this.getSettings()
            const queue = this.getQueue()
            settings.effects.push("distortion")
            const file = queue[0].file
            const rep2 = await this.discord.send(this.message, `<@${user.id}>, Adding distortion, please wait...`)
            await this.distortion(file, gain, color, false)
            this.setProcBlock(true)
            Functions.deferDelete(rep2, 0)
            const rep3 = await this.discord.send(this.message, `<@${user.id}>, Added distortion!`)
            Functions.deferDelete(rep3, 3000)
            resolve()
        })

        compression.on("collect", async (reaction, user) => {
            if (!(await this.checkEffectPermissions(user))) return
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.discord.send(this.message, `<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user)
            const rep = await this.discord.send(this.message, `<@${user.id}>, Enter the compression amount (0-100). _(Or cancel to quit)._`)
            await this.embeds.createPrompt(parseArgs)
            const amount = Number(argArray[0])
            Functions.deferDelete(rep, 0)
            if (canceled) return this.setProcBlock(true)
            const settings = this.getSettings()
            const queue = this.getQueue()
            settings.effects.push("compression")
            const file = queue[0].file
            const rep2 = await this.discord.send(this.message, `<@${user.id}>, Adding compression, please wait...`)
            await this.compression(file, amount, false)
            this.setProcBlock(true)
            Functions.deferDelete(rep2, 0)
            const rep3 = await this.discord.send(this.message, `<@${user.id}>, Added compression!`)
            Functions.deferDelete(rep3, 3000)
            resolve()
        })

        allpass.on("collect", async (reaction, user) => {
            if (!(await this.checkEffectPermissions(user))) return
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.discord.send(this.message, `<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user)
            const rep = await this.discord.send(this.message, `<@${user.id}>, Enter the frequency and width. _(Or cancel to quit)._`)
            await this.embeds.createPrompt(parseArgs)
            const freq = Number(argArray[0])
            const width = Number(argArray[1])
            Functions.deferDelete(rep, 0)
            if (canceled) return this.setProcBlock(true)
            const settings = this.getSettings()
            const queue = this.getQueue()
            settings.effects.push("allpass")
            const file = queue[0].file
            const rep2 = await this.discord.send(this.message, `<@${user.id}>, Adding an allpass filter, please wait...`)
            await this.allPass(file, freq, width, false)
            this.setProcBlock(true)
            Functions.deferDelete(rep2, 0)
            const rep3 = await this.discord.send(this.message, `<@${user.id}>, Added an allpass filter!`)
            Functions.deferDelete(rep3, 3000)
            resolve()
        })

        tremolo.on("collect", async (reaction, user) => {
            if (!(await this.checkEffectPermissions(user))) return
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.discord.send(this.message, `<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user)
            const rep = await this.discord.send(this.message, `<@${user.id}>, Enter the speed and depth. _(Or cancel to quit)._`)
            await this.embeds.createPrompt(parseArgs)
            const speed = Number(argArray[0])
            const depth = Number(argArray[1])
            Functions.deferDelete(rep, 0)
            if (canceled) return this.setProcBlock(true)
            const settings = this.getSettings()
            const queue = this.getQueue()
            settings.effects.push("tremolo")
            const file = queue[0].file
            const rep2 = await this.discord.send(this.message, `<@${user.id}>, Adding tremolo, please wait...`)
            await this.tremolo(file, speed, depth, false)
            this.setProcBlock(true)
            Functions.deferDelete(rep2, 0)
            const rep3 = await this.discord.send(this.message, `<@${user.id}>, Added tremolo!`)
            Functions.deferDelete(rep3, 3000)
            resolve()
        })
        cancel.on("collect", async (reaction, user) => {
            if (!(await this.checkEffectPermissions(user))) return
            this.setProcBlock(true)
            resolve()
        })
        })
        return msg
    }
}
