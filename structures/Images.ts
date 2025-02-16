import axios from "axios"
import Canvas, {GlobalFonts} from "@napi-rs/canvas"
import {DMChannel, GuildMember, Message, AttachmentBuilder, GuildTextBasedChannel, PartialDMChannel} from "discord.js"
import fs from "fs"
import gifFrames from "gif-frames"
import sizeOf from "image-size"
import imagemin from "imagemin"
import imageminGifsicle from "imagemin-gifsicle"
import path from "path"
import querystring from "querystring"
import request from "request"
import stream from "stream"
import Twitter from "twitter"
import unzip from "unzipper"
import config from "../config.json"
import {Catbox, Litterbox} from "node-catbox"
import {Functions} from "./Functions"
import {Kisaragi} from "./Kisaragi.js"

const compressImages = require("compress-images")
const getPixels = require("get-pixels")
const GifEncoder = require("gif-encoder")
const imageDataURI = require("image-data-uri")

GlobalFonts.registerFromPath(path.join(__dirname, "../../assets/fonts/07nikumarufont.otf"), "07nikumarufont")

export class Images {
    // let blacklist = require("../blacklist.json");
    private readonly headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
    constructor(private readonly discord: Kisaragi, private readonly message: Message) {}

    /** Compresses a gif. */
    public compressGif = async (input: string[]) => {
        const file = await imagemin(input,
        {destination: path.join(__dirname, "../assets/misc/images/gifs"),
         plugins: [imageminGifsicle({interlaced: false, optimizationLevel: 2, colors: 512})]
        })
        return file
    }

    /** Encodes a new gif. */
    public encodeGif = async (images: string[], folder: string, file: string | stream.Writable) => {
        return new Promise<void>((resolve) => {
        const dimensions = sizeOf(`${folder}${path.basename(images[0])}`)
        const gif = new GifEncoder(dimensions.width, dimensions.height)
        gif.pipe(file)
        gif.setQuality(20)
        gif.setDelay(0)
        gif.setRepeat(0)
        gif.writeHeader()
        gif.on("end", () => {
            resolve()
        })
        let counter = 0
        const addToGif = (frames: string[]) => {
            getPixels(`${folder}${path.basename(frames[counter])}`, function(err: Error, pixels: any) {
                gif.addFrame(pixels.data)
                gif.read()
                if (counter >= frames.length - 1) {
                    gif.finish()
                } else {
                    counter++
                    addToGif(images)
                }
            })
        }
        addToGif(images)
        })
    }

    /** Compresses images and gifs. */
    public compressImages = (src: string, dest: string) => {
        return new Promise<void>((resolve) => {
            const imgInput = src
            const imgOutput = dest
            compressImages(imgInput, imgOutput, {compress_force: true, statistic: false, autoupdate: true}, false,
            {jpg: {engine: "mozjpeg", command: ["-quality", "10"]}},
            {png: {engine: "pngquant", command: ["--quality=20-50"]}},
            {svg: {engine: "svgo", command: "--multipass"}},
            {gif: {engine: "gifsicle", command: ["--colors", "64", "--use-col=web"]}}, function(error: Error, completed: boolean) {
                if (completed === true) {
                    resolve()
                }
            })
        })
    }

    /** Downloads and extracts a zip file. */
    public downloadZip = async (url: string, path: string) => {
        return new Promise<void>((resolve) => {
            const writeStream = request({url, headers: this.headers}).pipe(unzip.Extract({path}) as any)
            writeStream.on("finish", () => {
                resolve()
            })
        })
    }

    /** Download any binary data (gif, video, etc.) */
    public download = async (url: string, dest: string) => {
        const bin = await axios.get(url, {responseType: "arraybuffer", headers: this.headers}).then((r) => r.data)
        fs.writeFileSync((dest), Buffer.from(bin, "binary"))
        return dest
    }

    /** Download image */
    public downloadImage = async (url: string, dest: string) => {
        if (!dest.endsWith(".jpg") || !dest.endsWith(".png")) return this.download(url, dest)
        const writeStream = fs.createWriteStream(dest)
        await axios.get(url, {responseType: "stream", headers: this.headers}).then((r) => r.data.pipe(writeStream))
        await new Promise<void>((resolve, reject) => {
            writeStream.on("finish", resolve)
            writeStream.on("error", reject)
        })
        return dest
    }

    /** Download images */
    public downloadImages = async (images: string[], dest: string) => {
        const destArray: string[] = []
        await Promise.all(images.map(async (url, i) => {
            let name = path.basename(decodeURI(images[i]))
            name = name.length > 15 ? name.slice(0, 15) : name
            if (!/.(png|jpg|gif)/.test(name)) name += ".png"
            try {
                const d = await this.downloadImage(images[i], dest + name)
                destArray.push(d)
            } catch (e) {
                // console.log(e)
            }
        }))
        return destArray
    }

    /** Fetch channel attachments */
    public fetchChannelAttachments = async (channel: GuildTextBasedChannel | DMChannel | PartialDMChannel, limit?: number, gif?: boolean, messageID?: string) => {
        if (!limit) limit = Infinity
        let last = messageID || channel.lastMessageId
        let attachments: string[] = []
        let counter = 0
        const amount = limit < 100 ? limit : 100
        while (counter < limit) {
                const messages = await channel.messages.fetch({limit: amount, before: last!})
                last = messages.lastKey()!
                if (!last) break
                const aArray = messages.map((msg) => msg.attachments.map((a) => a.url))
                const eArray = messages.map((msg: Message) => msg.embeds.map(((e) => e.image?.url)))
                const filteredArray = [...aArray, ...eArray].flat(Infinity) as string[]
                for (let i = 0; i < filteredArray.length; i++) {
                    if (filteredArray[i]) {
                        const url = filteredArray[i]?.match(/.(png|jpg|gif)/) ? filteredArray[i] : filteredArray[i] + ".png"
                        attachments.push(url)
                    }
                }
                counter += 100
                await Functions.timeout(100)
        }
        attachments = attachments.filter((a) => {
            if (a.endsWith(".jpg") || a.endsWith(".png")) {
                return true
            } else if (a.endsWith(".gif")) {
                if (gif) {
                    return true
                } else {
                    return false
                }
            } else {
                return false
            }
        })
        return {attachments, last}
    }

    public colorStops = [
        "#FF8AD8", "#FF8AD8",
        "#FF8ABB", "#FF8ABB",
        "#F9FF8A", "#F9FF8A",
        "#8AFFB3", "#8AFFB3",
        "#8AE4FF", "#8AE4FF",

        "#FF8AD8", "#FF8AD8",
        "#FF8ABB", "#FF8ABB",
        "#F9FF8A", "#F9FF8A",
        "#8AFFB3", "#8AFFB3",
        "#8AE4FF", "#8AE4FF"
    ]

    /** Creates a welcome/leave canvas */
    public createCanvas = async (member: GuildMember, image: string, text: string, color: string, uri?: boolean | false, iterator?: number | false, bgElements?: "on" | "off") => {
        if (!this.message.channel.isSendable()) return
        const colorStops = this.colorStops
        const newText = text.replace(/username/g, Functions.toProperCase(member.user.username)).replace(/user/g, `@${member.user.username}`)
        .replace(/guild/g, Functions.toProperCase(member.guild.name)).replace(/name/g, Functions.toProperCase(member.displayName)).replace(/count/g, String(member.guild.memberCount))
        if (Array.isArray(image)) image = image[Math.floor(Math.random() * image.length)]
        if (bgElements === "off") {
            const attachment = new AttachmentBuilder(image)
            return attachment
        }

        function wrapText(context: any, txt: string, x: number, y: number, maxWidth: number, lineHeight: number) {
            const cars = txt.split("\n")
            for (let i = 0; i < cars.length; i++) {
                let line = ""
                const words = cars[i].split(" ")
                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + " "
                    const metrics = context.measureText(testLine)
                    const testWidth = metrics.width
                    if (testWidth > maxWidth) {
                        context.strokeText(line, x, y)
                        context.fillText(line, x, y)
                        line = words[n] + " "
                        y += lineHeight
                    } else {
                        line = testLine
                    }
                }
                context.strokeText(line, x, y)
                context.fillText(line, x, y)
                y += lineHeight
            }
        }

        function applyText(cv: Canvas.Canvas, txt: string) {
            const context = cv.getContext("2d")
            let fontSize = 70
            do {
                context.font = `${fontSize -= 1}px 07nikumarufont`
            } while (context.measureText(txt).width > (cv.width*2.2) - 300)
            return context.font
        }

        const canvas = Canvas.createCanvas(700, 250)
        const ctx = canvas.getContext("2d")

        let background: Canvas.Image
        if (image.includes("gif")) {
            const random  = Math.floor(Math.random() * 1000000)
            const dir = path.join(__dirname, `../assets/misc/images/dump/${random}/`)
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true})

            const files: string[] = []
            const attachmentArray: string[] = []
            let frames = await gifFrames({url: image, frames: "all", cumulative: true})
            frames = Functions.constrain(frames, 50)

            for (let i = 0; i < frames.length; i++) {
                const readStream = frames[i].getImage() as unknown as NodeJS.ReadableStream
                const writeStream = fs.createWriteStream(path.join(dir, `./image${frames[i].frameIndex}.jpg`)) as unknown as NodeJS.WritableStream
                await new Promise<void>((resolve) => {
                    readStream.pipe(writeStream).on("finish", () => resolve())
                })
                files.push(path.join(dir, `./image${frames[i].frameIndex}.jpg`))
            }
            const msg2 = await this.message.channel.send(`**Encoding Gif. This might take awhile** ${this.discord.getEmoji("kisaragiCircle")}`) as Message
            const iterations = colorStops.length
            for (let i = 0; i < iterations; i++) {
                const rIterator = i % colorStops.length
                const fIterator = i % files.length
                const dataURI = await this.createCanvas(member, files[fIterator], text, color, true, rIterator)
                await imageDataURI.outputFile(dataURI, path.join(dir, `./image${fIterator}`))
                attachmentArray.push(`image${fIterator}.png`)
            }
            const file = fs.createWriteStream(path.join(dir, `./animated${random}.gif`))
            await this.encodeGif(attachmentArray, dir, file)
            msg2.delete()
            const attachment = new AttachmentBuilder(path.join(dir, `./animated${random}.gif`), {name: "animated.gif"})
            return attachment

        } else {
            background = await Canvas.loadImage(image)
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height)
            ctx.font = applyText(canvas, newText)
            ctx.strokeStyle= "black"
            ctx.lineWidth = 4
            if (color === "rainbow") {
                let rainbowIterator = iterator ? iterator : 0
                const gradient = ctx.createLinearGradient(0, 0, canvas.width + 200, 0)

                const rainbowStep = 1 / (colorStops.length - 1)
                const rainbowOffset = rainbowIterator ? rainbowIterator % colorStops.length : 0
                for (let i = 0; i < colorStops.length; i++) {
                    const position = (colorStops.length - 1 - ((i + rainbowOffset) % colorStops.length)) * rainbowStep
                    const currColor = colorStops[i]
                    gradient.addColorStop(position, currColor)
                }

                ctx.fillStyle = gradient
            } else {
                ctx.fillStyle = color
            }
            wrapText(ctx, newText, canvas.width / 2.8, canvas.height / 4, 450, 55)

            ctx.beginPath()
            ctx.arc(125, 125, 100, 0, Math.PI * 2, true)
            ctx.closePath()
            ctx.clip()

            const avatar = await Canvas.loadImage(member.displayAvatarURL({extension: "png"}))
            ctx.drawImage(avatar, 25, 25, 200, 200)

            if (uri) {
                return canvas.toDataURL("image/png")
            }

            const attachment = new AttachmentBuilder(canvas.toBuffer("image/jpeg"), {name: `welcome.jpg`})
            return attachment
        }
    }

    /** Deletes local files in a queue */
    public queuedDelete = async (files: string[]) => {
        if (files.length > 20) {
            const deletionQueue: string[] = []
            do {
                const popped = files.shift()
                if (!popped) break
                deletionQueue.push(popped)
            } while (files.length > 10)
            const promiseArray: any[] = []
            for (let i = 0; i < deletionQueue.length; i++) {
                const promise = new Promise<void>((resolve)=> {
                    fs.unlink(deletionQueue[i], () => resolve())
                })
                promiseArray.push(promise)
            }
            await Promise.all(promiseArray)
            return deletionQueue.length
        }
        return 0
    }

    /** Uploads files to catbox.moe and returns the link. */
    public upload = async <T extends string | string[]>(files: T, persist?: boolean): Promise<T extends string ? string : string[]> => {
        const catbox = new Catbox(process.env.CATBOX_HASH)
        const litterbox = new Litterbox()
        let isString = false
        if (!Array.isArray(files)) {
            files = [files] as any
            isString = true
        }
        let links: string[] = []
        for (let i = 0; i < files.length; i++) {
            if (files[i].includes("http")) {
                let result = ""
                if (persist) {
                    result = await catbox.uploadURL({url: files[i]})
                } else {
                    const tempFolder = path.join(__dirname, "../assets/misc/images/dump")
                    if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder, {recursive: true})
                    const arrayBuffer = await fetch(files[i]).then((r) => r.arrayBuffer())
                    let temp = path.join(tempFolder, "temp.png")
                    let j = 1
                    while (fs.existsSync(temp)) {
                        temp = path.join(tempFolder, `temp${j}.png`)
                        j++
                    }
                    fs.writeFileSync(temp, Buffer.from(arrayBuffer))
                    result = await litterbox.upload({path: temp, duration: "72h"})
                    fs.unlinkSync(temp)
                }
                links.push(result)
            } else {
                let result = ""
                if (persist) {
                    result = await catbox.uploadFile({path: files[i]})
                } else {
                    result = await litterbox.upload({path: files[i], duration: "72h"})
                }
                links.push(result)
            }
        }
        links = links.flat(Infinity)
        if (isString) {
            return links[0] as any
        } else {
            return links as any
        }
    }

    /** Fetch images from my api */
    public fetch = async (endpoint: string, limit?: number) => {
        const pictures = await axios.get(`${config.animePictures}/${endpoint}/files.json`).then((r) => r.data)
        if (!limit) limit = pictures.length
        return Functions.shuffleArray(pictures).slice(0, limit) as string[]
    }

    /** Upload attachment to Twitter */
    public uploadTwitterMedia = async (twitter: Twitter, link: string) => {
        const src = await this.downloadImage(link, path.join(__dirname, `../assets/misc/dump/${link.slice(-10)}`))
        let mime = "image/jpeg"
        if (/.png/.test(src)) {
            mime = "image/png"
        } else if (/.gif/.test(src)) {
            mime = "image/gif"
        } else if (/.mp4/.test(src)) {
            mime = "video.mp4"
        }
        const data = fs.readFileSync(src)
        const size =  fs.statSync(src).size

        const initUpload = async () => {
            return twitter.post("media/upload", {
                command    : "INIT",
                total_bytes: size,
                media_type : mime
            }).then((data) => data.media_id_string)
        }
        const appendUpload = async (mediaId: string) => {
            return twitter.post("media/upload", {
              command      : "APPEND",
              media_id     : mediaId,
              media        : data,
              segment_index: 0
            }).then(() => mediaId)
        }
        const finalizeUpload = async (mediaId: string) => {
            return twitter.post("media/upload", {
              command : "FINALIZE",
              media_id: mediaId
            }).then(() => mediaId)
        }
        const mediaID = await initUpload().then(appendUpload).then(finalizeUpload)
        return mediaID
    }

    /** Upload text to pastebin */
    public pastebinUpload = async (title: string, content: string, privacy: number) => {
        const link = await axios.post(`https://pastebin.com/api/api_post.php`, querystring.stringify({
            api_dev_key: process.env.PASTEBIN_API_KEY,
            api_option: "paste",
            api_paste_code: content,
            api_paste_name: title,
            api_paste_private: privacy,
            api_user_key: ""
        }), {headers: this.headers}).then((r) => r.data)
        return link as string
    }

    /** Upload text to hastebin */
    public hastebinUpload = async (content: string) => {
        try {
            const key = await axios.post(`https://hastebin.skyra.pw/documents`, content, {headers: {...this.headers, "Content-Type": "text/plain"}, transformRequest: (raw) => raw}).then((r) => r.data?.key)
            return `https://hastebin.skyra.pw/${key}`
        } catch (e) {
            console.log(e)
            return Promise.reject("Could not upload to hastebin")
        }
    }
}
