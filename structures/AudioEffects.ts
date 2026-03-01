/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import axios from "axios"
import child_process from "child_process"
import {Message, AttachmentBuilder} from "discord.js"
import ffmpeg from "fluent-ffmpeg"
import fs from "fs"
import path from "path"
import {Embeds} from "./Embeds"
import {Functions} from "./Functions"
import {Images} from "./Images"
import {Kisaragi} from "./Kisaragi"

const soxPath = process.platform === "win32" ? path.join(__dirname, "../../sox/sox.exe") : 
process.platform === "darwin" ? path.join(__dirname, "../../sox/sox") : "sox"

export class AudioEffects {
    private readonly headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
    private readonly images: Images
    private readonly embeds: Embeds
    constructor(private readonly discord: Kisaragi, private readonly message: Message) {
        this.embeds = new Embeds(this.discord, this.message)
        this.images = new Images(this.discord, this.message)
    }

    public getDir = () => {
        const dir = child_process.execSync("cd")
        return `${dir}/`.replace(/\\/g, "/").trim()
    }

    public init = (remove?: boolean) => {
        const dir = path.join(__dirname, `../assets/misc/tracks/transform`)
        if (remove) Functions.removeDirectory(dir)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true})
    }

    public processEffect = async (effect: string, filepath: string, fileDest: string) => {
        this.init()
        if (filepath.includes("https://") || filepath.includes("http://")) {
            const data = await axios.get(filepath, {responseType: "arraybuffer", headers: this.headers}).then((r) => r.data)
            const filename = path.basename(filepath.replace(`-${effect}`, "")).slice(0, -4)
            const dest = path.join(__dirname, `../assets/misc/tracks/${filename}-${effect}.${filepath.slice(-3)}`)
            fs.writeFileSync(dest, data, "binary")
            filepath = dest
        }
        const inDest = await this.convertToFormat(filepath, "aiff")
        fileDest = fileDest.replace(/(_)(.*?)(?=_)/g, "")
        let outDest = path.join(path.dirname(fileDest), path.basename(fileDest, path.extname(fileDest)) + ".aiff")
        let index = 0
        while (fs.existsSync(outDest)) {
            outDest = index <= 1 ? `${fileDest}.aiff` : `${fileDest}${index}.aiff`
            index++
        }
        const command = `"${soxPath}" "${inDest}" "${outDest}" gain -50 ${effect} gain -n -1`
        const child = child_process.exec(command)
        await new Promise<void>((resolve) => {
            child.on("error", (err) => console.log(err))
            child.on("close", () => resolve())
        })
        const mp3Dest = await this.convertToFormat(outDest, "mp3")
        if (filepath.includes("tracks/transform")) fs.unlink(filepath, () => null)
        fs.unlink(inDest, () => null)
        fs.unlink(outDest, () => null)
        return mp3Dest
    }

    public downloadEffect = async (effect: string, filepath: string) => {
        this.init()
        const ext = path.extname(filepath)
        const filename = path.basename(filepath.replace(`-${effect}`, "")).slice(0, -4)
        const fileDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-${effect}${ext}`)
        const stats = fs.statSync(fileDest)
        if (stats.size > Functions.getMBBytes(10)) {
            const link = await this.images.upload(fileDest)
            const effectEmbed = this.embeds.createEmbed()
            effectEmbed
            .setAuthor({name: "audio effect", iconURL: "https://clipartmag.com/images/musical-notes-png-11.png"})
            .setTitle(`**Audio Effect Download** ${this.discord.getEmoji("kannaWave")}`)
            .setDescription(
                `${this.discord.getEmoji("star")}This audio file is too large for attachments. Download it [**here**](${link}).\n`
            )
            return this.discord.send(this.message, effectEmbed)
        } else {
            const attachName = path.basename(fileDest)
            const attachment = new AttachmentBuilder(path.join(__dirname, fileDest), {name: `${attachName}`})
            const effectEmbed = this.embeds.createEmbed()
            effectEmbed
            .setAuthor({name: "audio effect", iconURL: "https://clipartmag.com/images/musical-notes-png-11.png"})
            .setTitle(`**Audio Effect Download** ${this.discord.getEmoji("kannaWave")}`)
            .setDescription(
                `${this.discord.getEmoji("star")}Applied the **${effect}** effect to this mp3 file!\n`
            )
            return this.discord.send(this.message, effectEmbed, attachment)
        }
    }

    public compress = async (amount: number, filepath: string, fileDest: string) => {
        return this.processEffect(`contrast ${amount}`, filepath, fileDest)
    }

    public tremolo = async (speed: number, depth: number, filepath: string, fileDest: string) => {
        return this.processEffect(`tremolo ${speed} ${depth}`, filepath, fileDest)
    }

    public lowpass = async (freq: number, width: number, filepath: string, fileDest: string) => {
        return this.processEffect(`lowpass ${freq} ${width}h`, filepath, fileDest)
    }

    public highpass = async (freq: number, width: number, filepath: string, fileDest: string) => {
        return this.processEffect(`highpass ${freq} ${width}h`, filepath, fileDest)
    }

    public peak = async (freq: number, resonance: number, gain: number, filepath: string, fileDest: string) => {
        return this.processEffect(`equalizer ${freq} ${resonance} ${gain}`, filepath, fileDest)
    }

    public lowshelf = async (gain: number, freq: number, width: number, filepath: string, fileDest: string) => {
        return this.processEffect(`bass ${gain} ${freq} ${width}h`, filepath, fileDest)
    }

    public highshelf = async (gain: number, freq: number, width: number, filepath: string, fileDest: string) => {
        return this.processEffect(`treble ${gain} ${freq} ${width}h`, filepath, fileDest)
    }

    public bandpass = async (freq: number, width: number, filepath: string, fileDest: string) => {
        return this.processEffect(`bandpass ${freq} ${width}`, filepath, fileDest)
    }

    public bandreject = async (freq: number, width: number, filepath: string, fileDest: string) => {
        return this.processEffect(`bandreject ${freq} ${width}`, filepath, fileDest)
    }

    public upsample = async (factor: number, filepath: string, fileDest: string) => {
        return this.processEffect(`upsample ${factor}`, filepath, fileDest)
    }

    public bitcrush = async (factor: number, filepath: string, fileDest: string) => {
        return this.processEffect(`downsample ${factor}`, filepath, fileDest)
    }

    public distortion = async (gain: number, color: number, filepath: string, fileDest: string) => {
        return this.processEffect(`overdrive ${gain} ${color}`, filepath, fileDest)
    }

    public chorus = async (delay: number, decay: number, speed: number, depth: number, filepath: string, fileDest: string) => {
        return this.processEffect(`chorus 0.9 0.8 ${delay} ${decay} ${speed} ${depth} -t`, filepath, fileDest)
    }

    public phaser = async (delay: number, decay: number, speed: number, filepath: string, fileDest: string) => {
        return this.processEffect(`phaser 0.9 0.8 ${delay} ${decay} ${speed} -t`, filepath, fileDest)
    }

    public flanger = async (delay: number, depth: number, regen: number, width: number, speed: number, shape: "sin" | "tri", phase: number, interp: "lin" | "quad", filepath: string, fileDest: string) => {
        return this.processEffect(`flanger ${delay} ${depth} ${regen} ${width} ${speed} ${shape} ${phase} ${interp}`, filepath, fileDest)
    }

    public delay = async (delaysDecays: number[], filepath: string, fileDest: string) => {
        return this.processEffect(`echo 0.9 0.8 ${delaysDecays.join(" ")}`, filepath, fileDest)
    }

    public pitch = async (pitch: number, filepath: string, fileDest: string) => {
        const cents = pitch * 100
        return this.processEffect(`gain -h pitch ${cents}`, filepath, fileDest)
    }

    public speed = async (factor: number, pitch: boolean, filepath: string, fileDest: string) => {
        let effect = `gain -h tempo ${factor}`
        if (pitch) effect = `gain -h speed ${factor}`
        return this.processEffect(effect, filepath, fileDest)
    }

    public reverse = async (filepath: string, fileDest: string) => {
        return this.processEffect("gain -h reverse", filepath, fileDest)
    }

    public gain = async (gain: number, filepath: string, fileDest: string) => {
        let effect = `gain ${gain}`
        if (gain > 0) effect = `gain -h gain ${gain}`
        return this.processEffect(effect, filepath, fileDest)
    }

    public reverb = async (reverb: number, damping: number, room: number, stereo: number, preDelay: number, wetGain: number, reverse: boolean, filepath: string, fileDest: string) => {
        let effect = `pad 0 3 reverb ${reverb} ${damping} ${room} ${stereo} ${preDelay} ${wetGain}`
        if (reverse) {
            effect = `"|sox ${filepath} -p reverse reverb -w ${reverb} ${damping} ${room} ${stereo} ${preDelay} ${wetGain} reverse`
        }
        return this.processEffect(effect, filepath, fileDest)
    }

    public allPass = async (freq: number, width: number, filepath: string, fileDest: string) => {
        return this.processEffect(`allpass ${freq} ${width}`, filepath, fileDest)
    }

    public combFilter = async (delay: number, decay: number, filepath: string, wavDest?: string) => {
        this.init()
        const wavFile = await this.convertToFormat(filepath, "wav")
        const arraybuffer = fs.readFileSync(wavFile, null).buffer
        const array = new Uint8Array(arraybuffer)
        const header = array.slice(0, 44)
        const samples = array.slice(44)
        const {sampleRate} = this.getWavInfo(header)
        const delayedSamples = Math.floor(delay * (sampleRate/1000))
        const combSamples = samples.slice()
        for (let i = 0; i < samples.length - delayedSamples; i++) {
            combSamples[i + delayedSamples] += combSamples[i] * decay
        }
        /*for (let i = 0; i < samples.length; i++) {
            combSamples[i] = (combSamples[i] + (decay*combSamples[i-delay]))
        }*/
        if (!wavDest) return combSamples
        const combArray = [...header, ...combSamples]
        fs.writeFileSync(wavDest, Buffer.from(new Uint8Array(combArray)))
        // const mp3File = await this.WavToMp3(wavDest)
        fs.unlink(wavFile, (err) => console.log(err))
        // fs.unlink(wavDest, (err) => console.log(err))
        return wavDest
    }

    public streamOgg = async (filepath: string) => {
        this.init()
        const ext = path.extname(filepath).replace(".", "")
        if (ext === "ogg") return fs.createReadStream(filepath)
        const filename = ext.length === 4 ? path.basename(filepath).slice(0, -5) : path.basename(filepath).slice(0, -4)
        const newDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}.ogg`)
        await new Promise<void>((resolve) => {
            ffmpeg(filepath).toFormat("ogg").outputOptions(["-c:a", "libopus", "-b:a", "96k"]).save(newDest)
            .on("end", () => resolve())
        })
        return fs.createReadStream(newDest)
    }

    public pcmToWav = async (filepath: string, mono?: boolean) => {
        this.init()
        const channels = mono ? "1" : "2"
        const ext = path.extname(filepath).replace(".", "")
        const filename = ext.length === 4 ? path.basename(filepath).slice(0, -5) : path.basename(filepath).slice(0, -4)
        const newDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}.wav`)
        await new Promise<void>((resolve, reject) => {
            ffmpeg(filepath).inputOptions(["-f", "s16le", "-ar", "44.1k", "-ac", channels]).save(newDest)
            .on("end", () => resolve())
            .on("error", () => reject())
        })
        return newDest
    }

    public convertToFormat = async (filepath: string, format: string) => {
        this.init()
        if (filepath.slice(-3) === "pcm") {
            const wavDest = await this.pcmToWav(filepath)
            return this.convertToFormat(wavDest, format)
        }
        const ext = path.extname(filepath).replace(".", "")
        const filename = ext.length === 4 ? path.basename(filepath).slice(0, -5) : path.basename(filepath).slice(0, -4)
        const newDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}.${format}`)
        await new Promise<void>((resolve, reject) => {
            ffmpeg(filepath).toFormat(format).outputOptions("-bitexact").save(newDest)
            .on("end", () => resolve())
            .on("error", () => reject())
        })
        return newDest
    }

    public seek = async (filepath: string, seek: number) => {
        this.init()
        const ext = path.extname(filepath).replace(".", "")
        const filename = ext.length === 4 ? path.basename(filepath).slice(0, -5) : path.basename(filepath).slice(0, -4)
        const newDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-seek.${ext}`)
        await new Promise<void>((resolve, reject) => {
            ffmpeg(filepath).toFormat(ext).setStartTime(seek).save(newDest)
            .on("end", () => resolve())
            .on("error", () => reject())
        })
        if (filepath.includes("tracks/transform")) fs.unlink(filepath, () => null)
        return newDest
    }

    public volume = async (filepath: string, volume: number) => {
        this.init()
        const ext = path.extname(filepath).replace(".", "")
        const filename = ext.length === 4 ? path.basename(filepath).slice(0, -5) : path.basename(filepath).slice(0, -4)
        const newDest = path.join(__dirname, `../assets/misc/tracks/transform/${filename}-vol.${ext}`)
        await new Promise<void>((resolve, reject) => {
            ffmpeg(filepath).toFormat(ext).outputOptions(["-filter:a", `volume=${volume}`]).save(newDest)
            .on("end", () => resolve())
            .on("error", () => reject())
        })
        return newDest
    }

    public duration = async (filepath: string) => {
        return new Promise<number>((resolve, reject) => {
            ffmpeg.ffprobe(filepath, (err, data) => {
                const duration = data?.format?.duration || 0
                resolve(duration)
            })
        })
    }

    public getWavInfo = (header: Uint8Array) => {
        function int32ToDec(bin: string) {
            const binArr = bin.split("-")
            let binDigits = ""
            for (let i = 0; i < binArr.length; i++) {
                binDigits += ("00000000"+Number(binArr[i]).toString(2)).slice(-8)
            }
            const num = parseInt(binDigits, 2)
            return num
        }
        let littleEndian = false
        let bitDepth = 0
        let sampleRate = 0
        let channels = 0
        let topCode = ""
        for (let i = 0; i < 4; i++) {
            topCode += String.fromCharCode(header[i])
        }
        if (topCode === "RIFF") {
            littleEndian = true
        }
        if (littleEndian) {
            bitDepth = Number(`${header[35]}${header[34]}`)
            sampleRate = Number(int32ToDec(`${(header[27])}-${(header[26])}-${(header[25])}-${(header[24])}`))
            channels = Number(`${header[23]}${header[22]}`)
        } else {
            bitDepth = Number(`${header[34]}${header[35]}`)
            sampleRate = Number(int32ToDec(`${header[24]}-${(header[25])}-${(header[26])}-${(header[27])}`))
            channels = Number(`${header[22]}${header[23]}`)
        }
        const byteDepth = (bitDepth) / 8
        return {byteDepth, bitDepth, sampleRate, channels}
    }

    public reverseLegacy = async (filepath: string, wavDest: string) => {
        this.init()
        const wavFile = await this.convertToFormat(filepath, "wav")
        const arraybuffer = fs.readFileSync(wavFile, null).buffer
        const array = new Uint8Array(arraybuffer)
        const header = array.slice(0, 44)
        const samples = array.slice(44)
        const {byteDepth} = this.getWavInfo(header)
        let identifier = 0
        const reversed = samples.slice()
        for (let i = 0; i < samples.length; i++) {
            if (i !== 0 && (i % byteDepth === 0)) {
                identifier += 2 * byteDepth
            }
            const index = samples.length - byteDepth - identifier + i
            reversed[i] = samples[index]
        }
        const reversedArray = [...header, ...reversed]
        fs.writeFileSync(wavDest, Buffer.from(new Uint8Array(reversedArray)))
        const mp3File = await this.convertToFormat(wavDest, "mp3")
        fs.unlink(wavFile, (err) => console.log(err))
        fs.unlink(wavDest, (err) => console.log(err))
        return mp3File
    }
}
