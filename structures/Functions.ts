 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import archiver from "archiver"
import axios from "axios"
import crypto from "crypto"
import {Message, ChatInputCommandInteraction, GuildMember} from "discord.js"
import emojiRegex from "emoji-regex"
import fs from "fs"
import path from "path"
import stream from "stream"
import {RefreshingAuthProvider} from "@twurple/auth"
import {ApiClient} from "@twurple/api"
import config from "../config.json"
import {Kisaragi} from "./Kisaragi"
import {SQLQuery} from "./SQLQuery"

const activeStreams = new Set<string>()

export class Functions {
    constructor(private readonly message: Message) {}

    // Defer delete
    public static deferDelete = async (response: Message | null, timeout: number) => {
        if (!response) return
        return new Promise<void>((resolve) => {
            setTimeout(async () => {
                Kisaragi.ignoreDelete.add(response.id)
                await response.delete().catch(() => null)
                resolve()
            }, timeout)
        })
    }

    // Timeout
    public static timeout = (ms: number) => {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    // Reject Promise after timeout
    public static promiseTimeout = (ms: number, promise: Promise<any>) => {
        const timeout = new Promise((resolve, reject) => {
          const id = setTimeout(() => {
            clearTimeout(id)
            reject("Timed out in "+ ms + "ms.")
          }, ms)
        })

        return Promise.race([
          promise,
          timeout
        ])
    }

    // Await Stream
    public static awaitStream = async (readStream: NodeJS.ReadableStream, writeStream: NodeJS.WritableStream) => {
        return new Promise<void>((resolve) => {
            readStream.pipe(writeStream)
            readStream.on("end", () => {
                resolve()
            })
            readStream.on("close", () => {
                resolve()
            })
            readStream.on("finish", () => {
                resolve()
            })
        })
    }

    // Copy file
    public static copyFile = (original: string, copy: string) => {
        const read = fs.readFileSync(original, null).buffer
        fs.writeFileSync(copy, Buffer.from(read), "binary")
    }

    // Random Number
    public static getRandomNum = (min: number, max: number) => {
        return Math.random() * (max - min) + min
    }

    /** Random String */
    public static randomString = (length: number) => {
        return crypto.randomBytes(length).toString("hex")
    }

    // Random Date
    public static randomDate(start: Date, end: Date) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
    }

    // Response Time
    public responseTime = () => {
        const time = Date.now() - this.message?.createdTimestamp
        return `${time ? Math.abs(time) : 0} ms`
    }

    // Format Date
    public static formatDate = (inputDate: Date | string) => {
        const monthNames = [
          "January", "February", "March",
          "April", "May", "June", "July",
          "August", "September", "October",
          "November", "December"
        ]
        const date = new Date(inputDate)
        const day = date.getDate()
        const monthIndex = date.getMonth()
        const year = date.getFullYear()

        return `${monthNames[monthIndex]} ${day}, ${year}`
      }

    // Clean HTML
    public static cleanHTML = (str: string) => {
        return str.replace(/<\/?[^>]+(>|$)/g, "")
    }

    // Decode HTML entities
    public static decodeEntities(encodedString: string) {
        const regex = /&(nbsp|amp|quot|lt|gt);/g
        const translate = {
            nbsp:" ",
            amp : "&",
            quot: "\"",
            lt  : "<",
            gt  : ">"
        }
        return encodedString.replace(regex, function(match, entity) {
            return translate[entity]
        }).replace(/&#(\d+);/gi, function(match, numStr) {
            const num = parseInt(numStr, 10)
            return String.fromCharCode(num)
        })
    }

    // Multi Trim
    public static multiTrim = (str: string) => {
        return str.replace(/^\s+/gm, "").replace(/\s+$/gm, "").replace(/newline/g, " ")
    }

    // Trim Punctuation
    public static punctuationTrim = (str: string) => {
        return str.replace(/[.,\[\]\|\/#!$%\^&\*;:{}=\-_`~()]/g, " ").replace(/ +/g, " ")
    }

    // Proper Case
    public static toProperCase = (str: string) => {
        return str.replace(/\w\S*/g, (txt) => {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            }
        )
    }

    // Shuffle an array
    public static shuffleArray<T>(array: T[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]
        }
        return array
    }

    // Splits a message into chunks
    public static splitMessage = (text: string, {maxLength = 2000, char = "\n", prepend = "", append = ""} = {}) => {
        if (text.length <= maxLength) return [text]
        const splitText = text.split(char)
        if (splitText.some(chunk => chunk.length > maxLength)) throw new RangeError("SPLIT_MAX_LEN")
        const messages = [] as string[]
        let msg = ""
        for (const chunk of splitText) {
          if (msg && (msg + char + chunk + append).length > maxLength) {
            messages.push(msg + append)
            msg = prepend
          }
          msg += (msg && msg !== prepend ? char : "") + chunk
        }
        return messages.concat(msg).filter(m => m)
    }

    // Check Message Characters
    public static checkChar = (message: string, num: number, char: string): string => {
        if (!message) return ""
        const splitText = Functions.splitMessage(message, {maxLength: num, char})
        if (splitText[0]) {
            return splitText[0]
        } else {
            return String(splitText)
        }
    }

    // Remove duplicates
    public static removeDuplicates = <T>(array: T[]) => {
        return array.filter((a, b) => array.indexOf(a) === b)
    }

    // Remove duplicate object keys
    public static removeDuplicateObjectKeys = <T>(array: any[], key: string): T[] => {
        return Array.from(new Set(array.map((a) => a[key])))
        .map((k) => {
          return array.find((a: any) => a[key] === k)
        })
    }

    // Fill Array
    public static fillArray<T>(arr: T[], value: T, len: number) {
        while (arr.length !== len) {
          arr.push(value)
        }
        return arr
      }

    // Remove from Array
    public static arrayRemove = (arr: string[], val: string) => {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === val) {
              arr.splice(i, 1)
              i--
            }
         }
        return arr
    }

    // Random Color
    public static randomColor = () => {
        return Number(config.colors[Math.floor(Math.random() * config.colors.length)])
    }

    // Combine args after an index
    public static combineArgs = (args: string[], num: number) => {
        let combined = ""
        for (let i = num; i < args.length; i++) {
            combined += args[i] + " "
        }
        return combined
    }

    // Check args
    public static checkArgs = (args: string[], num: string) => {
        switch (num) {
            case "single": {
                if (!args[0]) {
                    return false
                } else {
                    return true
                }

            }
            case "multi": {
                if (!args[0] || !Functions.combineArgs(args, 1)) {
                    return false
                } else {
                    return true
                }
            }
            default: return false
        }
    }

    // Sort object array
    public static sortObjectArray = (array: any[], key: string, order: "desc" | "asc", type?: "number" | "string") => {
        if (!type) type = "number"
        const compare = (key: string, order = "asc", type = "number") => {
            return function innerSort(a: any, b: any) {
              if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
                return 0
              }
              let varA: any
              let varB: any
              if (type === "number") {
                varA = String(a[key]).match(/\d+/) ? Number(String(a[key]).replace(/,/g, "").match(/\d+/)?.[0]) : 0
                varB = String(b[key]).match(/\d+/) ? Number(String(b[key]).replace(/,/g, "").match(/\d+/)?.[0]) : 0
              } else {
                varA = String(a[key]).toUpperCase()
                varB = String(b[key]).toUpperCase()
              }

              let comparison = 0
              if (varA > varB) {
                comparison = 1
              } else if (varA < varB) {
                comparison = -1
              }
              return (
                (order === "desc") ? (comparison * -1) : comparison
              )
            }
        }
        return array.sort(compare(key, order, type))
    }

    // Create 2-dimensional array
    public static create2DArray(rows: number, columns: number) {
        const array = new Array(rows)
        for (let i = 0; i < array.length; i++) {
            array[i] = new Array(columns)
        }
        return array
    }

    // Clone array with nested arrays
    public static cloneArray(arr: any) {
        if (Array.isArray(arr)) {
            const copy = arr.slice(0)
            for (let i = 0; i < copy.length; i++) {
                copy[i] = Functions.cloneArray(copy[i])
            }
            return copy
        } else if (typeof arr === "object") {
            throw new Error("Cannot clone array containing an object!")
        } else {
            return arr
        }
    }

    // Constrain Array
    public static constrain = <T>(frames: T[], constrain: number) => {
        const step = Math.ceil(frames.length*1.0/constrain)
        const newFrames: T[] = []
        for (let i = 0; i < frames.length; i+=step) {
            newFrames.push(frames[i])
        }
        return newFrames
    }

    // Create a zip file
    public static createZip = async (files: string[], dest: string) => {
        dest = dest.endsWith(".zip") ? dest : dest + ".zip"
        await new Promise<void>((resolve) => {
            const stream = fs.createWriteStream(dest) as unknown as NodeJS.WritableStream
            const zip = archiver("zip")

            zip.pipe(stream)
            for (let i = 0; i < files.length; i++) {
                zip.file(files[i], {name: path.basename(files[i])})
            }
            zip.finalize()

            stream.on("close", function() {
                resolve()
            })
        })
        return dest
    }

    // Zip a directory
    public static zipDir = async (dir: string, dest: string) => {
        dest = dest.endsWith(".zip") ? dest : dest + ".zip"
        await new Promise<void>((resolve) => {
            const stream = fs.createWriteStream(dest) as unknown as NodeJS.WritableStream
            const zip = archiver("zip")
            zip.pipe(stream)
            zip.directory(dir, false)
            zip.finalize()
            stream.on("close", function() {
                resolve()
            })
        })
        return dest
    }

    // Remove directory recursively
    public static removeDirectory(dir: string) {
        if (dir === "/" || dir === "./") return
        if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach(function(entry) {
                const entryPath = path.join(dir, entry)
                if (fs.lstatSync(entryPath).isDirectory()) {
                    Functions.removeDirectory(entryPath)
                } else {
                    fs.unlinkSync(entryPath)
                }
            })
            try {
                fs.rmdirSync(dir)
            } catch (e) {
                console.log(e)
            }
        }
    }

    /** Parses seconds (clock format) */
    public static parseSeconds = (str: string) => {
        const split = str.split(":")
        let seconds = 0
        if (split.length === 3) {
            seconds += Number(split[0]) * 3600
            seconds += Number(split[1]) * 60
            seconds += Number(split[2])
        } else if (split.length === 2) {
            seconds += Number(split[0]) * 60
            seconds += Number(split[1])
        } else if (split.length === 1) {
            seconds += Number(split[0])
        }
        return seconds
    }

    /** Parses seconds (calender format) */
    public static parseCalenderSeconds = (str: string) => {
        const split = str.split(" ")
        let seconds = 0
        for (let i = 0; i < split.length; i++) {
            if (/y/.test(split[i])) {
                seconds += Number(split[i].replace("y", "")) * 3.154e7
            } else if (/mo/.test(split[i])) {
                seconds += Number(split[i].replace("mo", "")) * 2.628e6
            } else if (/w/.test(split[i])) {
                seconds += Number(split[i].replace("w", "")) * 604800
            } else if (/d/.test(split[i])) {
                seconds += Number(split[i].replace("d", "")) * 86400
            } else if (/h/.test(split[i])) {
                seconds += Number(split[i].replace("h", "")) * 3600
            } else if (/m/.test(split[i])) {
                seconds += Number(split[i].replace("m", "")) * 60
            } else {
                seconds += Number(split[i].replace("s", ""))
            }
        }
        return seconds
    }

    /** Parse video m3u8 */
    public static parsem3u8 = (manifest: any) => {
            const m3u8Parser = require("m3u8-parser")
            const parser = new m3u8Parser.Parser()
            parser.push(manifest)
            parser.end()
            return parser.manifest
    }

    /** Get object depth */
    public static objectDepth = (object: any) => {
        let level = 1
        for (const key in object) {
            if (!object.hasOwnProperty(key)) continue

            if (typeof object[key] === "object") {
                const depth = Functions.objectDepth(object[key]) + 1
                level = Math.max(depth, level)
            }
        }
        return level
    }

    /** Checks if a string contains a unicode emoji. */
    public static unicodeEmoji = <T extends boolean = false>(str: string, all?: T): T extends false ? string : RegExpMatchArray => {
        const regex = new RegExp(emojiRegex(), "g")
        if (all) {
            return str.match(regex) as T extends false ? string : RegExpMatchArray
        } else {
            return str.match(regex)?.[0] as T extends false ? string : RegExpMatchArray
        }
    }

    /** Returns a frame of silence */
    public static silence = () => {
        const {Readable} = require("stream")
        const SILENCE_FRAME = Buffer.from([0xF8, 0xFF, 0xFE])
        class Silence extends Readable {
            public _read() {
                this.push(SILENCE_FRAME)
                this.destroy()
            }
        }
        return new Silence() as unknown as stream.Readable
    }

    /** Polls the twitch api for stream notifications */
    public static pollTwitch = (discord: Kisaragi) => {
        const authProvider = new RefreshingAuthProvider({clientId: process.env.TWITCH_CLIENT_ID!, clientSecret: process.env.TWITCH_CLIENT_SECRET!})
        authProvider.addUser("196927459", {obtainmentTimestamp: 0, expiresIn: 0, refreshToken: process.env.TWITCH_REFRESH_TOKEN!, accessToken: process.env.TWITCH_ACCESS_TOKEN!})
        const twitch = new ApiClient({authProvider})
        const callAPI = async () => {
            const channels = await SQLQuery.selectColumn("twitch", "channel")
            if (!channels?.[0]) return
            const streams = await twitch.streams.getStreamsByUserNames(channels)
            if (!streams?.length) return
            const currentStreamers: string[] = []
            for (let i = 0; i < streams.length; i++) {
                if (!activeStreams.has(streams[i].userDisplayName)) {
                    discord.emit("twitchOnline", streams[i])
                    activeStreams.add(streams[i].userDisplayName)
                }
                currentStreamers.push(streams[i].userDisplayName)
            }
            if (currentStreamers?.[0]) {
                const recordedStreams = Array.from(activeStreams) as string[]
                for (let i = 0; i < recordedStreams.length; i++) {
                    if (!currentStreamers.includes(recordedStreams[i])) {
                        activeStreams.delete(recordedStreams[i])
                    }
                }
            } else {
                activeStreams.clear()
            }
            setTimeout(callAPI, 120000)
        }
        setTimeout(callAPI, 120000)
    }

    /** Re-subscribes to youtube notifications on bot restart */
    public static youtubeReSubscribe = async () => {
        if (process.env.TESTING === "yes") return
        const yt: any[] = []
        const configs = await SQLQuery.selectColumn("yt", "config")
        if (!configs) return
        for (let i = 0; i < configs.length; i++) {
            for (let j = 0; j < configs[i].length; j++) {
                const current = JSON.parse(configs[i][j])
                yt.push(current)
            }
        }
        for (let i = 0; i < yt.length; i++) {
            if (!yt[i]) break
            const current = {...yt[i], refresh: true}
            await axios.post(`${config.kisaragiAPI}/youtube`, current)
        }
    }

    /** Sum all object values */
    public static sumObjectValues = (obj: object, ignore?: string) => {
        if (ignore && obj[ignore]) obj[ignore] = 0
        return Object.values(obj).reduce((a, b) => Number(a) + Number(b)) as number
    }

    /** Sort an object by value */
    public static sortObject = (obj: object) => {
        let arr = Object.entries(obj)
        arr = arr.sort((a, b) => b[1] - a[1])
        const newObj = {}
        for (let i = 0; i < arr.length; i++) {
            newObj[arr[i][0]] = arr[i][1]
        }
        return newObj
    }

    /** Join two arrays to an object */
    public static doubleObjectArray = <A, B>(arr1: A[], arr2: B[], property?: string) => {
        const obj = {} as any
        for (let i = 0; i < arr1.length; i++) {
            if (property) {
                obj[arr1[i]] = JSON.parse(arr2[i] as unknown as string)?.[property]
            } else {
                obj[arr1[i]] = arr2[i]
            }
        }
        return obj
    }

    /** Translate text to english */
    public static googleTranslate = async (text: string) => {
        const translate = require("@vitalets/google-translate-api")
        const result = await translate(text, {to: "en"})
        return result.text as string
    }

    /** Remove bad words, or checks a string for bad words. */
    public static badWords = <T extends boolean | undefined = false>(text: string, checkOnly?: T): T extends true ? boolean : string => {
        const Filter = require("bad-words")
        const filter = new Filter()
        if (checkOnly) return filter.isProfane(text)
        return filter.clean(text)
    }

    /** Calculate gcd */
    public static gcd(a: number, b: number): number {
        return b === 0 ? a : Functions.gcd(b, a % b)
    }

    /** Calculate lcm */
    public static lcm = (a: number, b: number) => {
        return (a * b) / Functions.gcd(a, b)
    }

    public static getMBBytes = (MB: number) => {
        return MB * 1024 * 1024
    }

    public static dataUrlBuffer = (dataUrl: string) => {
        const base64Data = dataUrl.split(",")[1]
        return Buffer.from(base64Data, "base64")
    }

    public static decodeHexColor = (hex: string) => {
        hex = hex.replace("#", "")
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        return {r, g, b}
    }

    public static transformRange = (value: number, oldMin: number, oldMax: number, newMin: number, newMax: number) => {
        return ((value - oldMin) / (oldMax - oldMin)) * (newMax - newMin) + newMin
    }

    public static arrayBufferToBase64 = (arrayBuffer: ArrayBuffer, mime = "image/png") => {
        return `data:${mime};base64,${Buffer.from(arrayBuffer).toString("base64")}`
    }
}
