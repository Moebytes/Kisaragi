 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import child_process from "child_process"
import {Message} from "discord.js"
import ffmpeg from "fluent-ffmpeg"
import fs from "fs"
import path from "path"
import {Functions} from "./Functions"
import {Kisaragi} from "./Kisaragi"

export class Video {
    private readonly iphoneFlags = ["-vcodec", "libx264", "-profile:v", "main", "-level", "3.1", "-preset", "ultrafast", "-crf", "24", "-x264-params", "ref=4", "-movflags", "+faststart"]
    constructor(private readonly discord: Kisaragi, private readonly message: Message) {}

    public init = (remove?: boolean) => {
        const dir = path.join(__dirname, `../videos/transform`)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true})
        if (remove) Functions.removeDirectory(dir)
    }

    public executeCommand = (command: string) => {
        const response = child_process.execSync(command.replace(/\\/g, "/"))
        return response.toString()
    }

    public getDir = () => {
        const dir = child_process.execSync("cd")
        return `${dir}/`
    }

    /** Creates a video from a static image. */
    public createImgVideo = async (audioFile: string, imgFile?: string) => {
        this.init()
        let name = path.basename(audioFile).slice(0, -4)
        if (imgFile) name = path.basename(imgFile).slice(0, -4)
        if (!imgFile) imgFile = "../assets/images/default.jpg"
        const vidDest = path.join(__dirname, `../assets/misc/videos/transform/`)
        const newDest = path.join(__dirname, `../assets/misc/videos/${name}.mp4`)
        if (!fs.existsSync(vidDest)) fs.mkdirSync(vidDest, {recursive: true})
        await new Promise<void>((resolve) => {
            ffmpeg().input(audioFile).input(imgFile!)
            .outputOptions([...this.iphoneFlags, "-tune", "stillimage", "-c:a", "aac", "-b:a", "192k", "-shortest"])
            .save(newDest)
            .on("end", () => {
                resolve()
            })
        })
        return newDest
    }

    /** Converts a video to a gif image. */
    public video2Gif = async (start: number, length: number, videoFile: string, newDest?: string) => {
        this.init()
        const name = path.basename(videoFile).slice(0, -4)
        const vidDest = path.join(__dirname, `../videos/transform/`)
        if (!fs.existsSync(vidDest)) fs.mkdirSync(vidDest, {recursive: true})
        if (!newDest) newDest = path.join(vidDest, `./${name}.gif`)
        await new Promise<void>((resolve) => {
            ffmpeg(videoFile).outputOptions(["-ss", String(start), "-t", String(length), "-filter_complex", "[0:v]fps=12,scale=480:-1,split[a][b];[a]palettegen[p];[b][p]paletteuse"])
            .format("gif").save(newDest!)
            .on("end", () => {
                resolve()
            })
        })
        return newDest
    }

    /** Changes the speed of a video file. */
    public videoSpeed = async (factor: number, videoFile: string, newDest?: string) => {
        if (factor < 0.5) factor = 0.5
        if (factor > 100) factor = 100
        this.init()
        const name = path.basename(videoFile).slice(0, -4)
        const vidDest = path.join(__dirname, `../videos/transform/`)
        if (!fs.existsSync(vidDest)) fs.mkdirSync(vidDest, {recursive: true})
        if (!newDest) newDest = path.join(vidDest, `./${name}_speed.mp4`)
        await new Promise<void>((resolve) => {
            ffmpeg(videoFile).outputOptions([...this.iphoneFlags, "-filter_complex", `[0:v]setpts=${1.0/factor}*PTS[v];[0:a]atempo=${factor}[a]`, "-map", "[v]", "-map", "[a]"])
            .save(newDest!)
            .on("end", () => {
                resolve()
            })
        })
        return newDest
    }

    /** Reverses a video file. */
    public reverseVideo = async (videoFile: string, newDest?: string) => {
        this.init()
        const name = path.basename(videoFile).slice(0, -4)
        const vidDest = path.join(__dirname, `../videos/transform/`)
        if (!fs.existsSync(vidDest)) fs.mkdirSync(vidDest, {recursive: true})
        if (!newDest) newDest = path.join(vidDest, `./${name}_reverse.mp4`)
        await new Promise<void>((resolve) => {
            ffmpeg(videoFile).outputOptions([...this.iphoneFlags, "-vf", "reverse", "-af", "areverse"])
            .save(newDest!)
            .on("end", () => {
                resolve()
            })
        })
        return newDest
    }

    /** Extracts the audio from a video file. */
    public extractAudio = async (videoFile: string, newDest?: string) => {
        this.init()
        const name = path.basename(videoFile).slice(0, -4)
        const mp3Dest = path.join(__dirname, `../tracks/transform/`)
        if (!fs.existsSync(mp3Dest)) fs.mkdirSync(mp3Dest, {recursive: true})
        if (!newDest) newDest = path.join(mp3Dest, `./${name}.mp3`)
        await new Promise<void>((resolve) => {
            ffmpeg(videoFile).format("mp3")
            .save(newDest!)
            .on("end", () => {
                resolve()
            })
        })
        return newDest
    }
}
