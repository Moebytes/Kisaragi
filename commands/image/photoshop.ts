import axios from "axios"
import {Collection, Message, MessageReaction, TextChannel, User} from "discord.js"
import {SlashCommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import fs from "fs"
import {Jimp as jimp, JimpMime} from "jimp"
import sharp from "sharp"
import path from "path"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Images} from "../../structures/Images"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"

const procBlock = new Collection()

export default class Photoshop extends Command {
    private readonly links: string[] = []
    private readonly publicIDs: string[] = []
    private readonly historyStates: string[] = []
    private readonly historyEmbeds: string[] = []
    private readonly historyValues: any[] = []
    private historyIndex = -1
    private original = ""
    private originalEmbed = ""
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Opens the image editor to apply multiple edits to an image.",
          help:
          `
          \`photoshop\` - Edits the last posted image
          \`photoshop url\` - Edits the linked image
          `,
          examples:
          `
          \`=>photoshop\`
          `,
          aliases: ["ps", "edit", "editor", "adjust", "hsv", "hsb"],
          cooldown: 10,
          defer: true,
          slashEnabled: true
        })
        const urlOption = new SlashCommandOption()
            .setType("string")
            .setName("url")
            .setDescription("Url, or use the last posted image.")

        this.slash = new SlashCommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(urlOption)
            .toJSON()
    }

    public getProcBlock = () => {
        let id = ""
        if (this.message.guild) {
            id = this.message.guild.id
        } else {
            id = this.message.author.id
        }
        if (procBlock.has(id)) {
            return true
        } else {
            return false
        }
    }

    public setProcBlock = (remove?: boolean) => {
        let id = ""
        if (this.message.guild) {
            id = this.message.guild.id
        } else {
            id = this.message.author.id
        }
        if (remove) {
            procBlock.delete(id)
        } else {
            procBlock.set(id, true)
        }
    }

    public hsvEmbed = async (image: string, newObj?: any) => {
        const images = new Images(this.discord, this.message)
        const embeds = new Embeds(this.discord, this.message)
        let url: string
        let description: string
        if (newObj) {
            let link = ""
            if (image.includes("http")) {
                link = image
            } else {
                link = await images.upload([image]).then((l) => l[0])
            }
            description = this.getDesc()
            this.historyIndex++
            this.historyStates.splice(this.historyIndex, Infinity, image)
            this.links.splice(this.historyIndex, Infinity, link)
            this.historyEmbeds.splice(this.historyIndex, Infinity, description)
            this.historyValues.splice(this.historyIndex, Infinity, newObj)
            url = link
        } else {
            if (this.historyIndex < 0) {
                url = this.original
            } else {
                url = this.links[this.historyIndex]
            }
        }
        description = this.getDesc()
        const hsvEmbed = embeds.createEmbed()
        hsvEmbed
        .setAuthor({name: "photoshop", iconURL: "https://kisaragi.moe/assets/embed/photoshop.png"})
        .setTitle(`**Photoshop** ${this.discord.getEmoji("chinoSmug")}`)
        .setImage(url)
        .setURL(url)
        .setDescription(description)
        return hsvEmbed
    }

    public getVal = (val: any) => {
        if (Number.isNaN(Number(val)) || String(val).split(" ").length > 1) return `${val}`
        if (val < 0) {
            return `${val}`
        } else {
            return `+${val}`
        }
    }

    public valObj = () => {
        const obj = {} as any
        obj.brightness = 0
        obj.contrast = 0
        obj.hue = 0
        obj.saturation = 0
        obj.lightness = 0
        obj.flip = "None"
        obj.tint = "None"
        obj.invert = "Off"
        obj.posterize = "Off"
        obj.crop = "None"
        obj.scale = "0x"
        obj.rotate = 0
        obj.blur = 0
        obj.sharpen = 0
        return obj
    }

    public getObj = () => {
        let obj = {} as any
        if (this.historyIndex > -1) {
            obj = {...this.historyValues[this.historyIndex]}
        } else {
            obj = {...this.valObj()}
        }
        return obj
    }

    public getDesc = () => {
        const obj = this.getObj()
        const desc =
        `${this.discord.getEmoji("brightness")}_Brightness:_ **${this.getVal(obj.brightness)}**  ` +
        `${this.discord.getEmoji("contrast")}_Contrast:_ **${this.getVal(obj.contrast)}**\n` +
        `${this.discord.getEmoji("hue")}_Hue:_ **${this.getVal(obj.hue)}°**  ` +
        `${this.discord.getEmoji("saturation")}_Saturation:_ **${this.getVal(obj.saturation)}**  ` +
        `${this.discord.getEmoji("lightness")}_Lightness:_ **${this.getVal(obj.lightness)}**\n` +
        `${this.discord.getEmoji("flip")}_Flip:_ **${this.getVal(obj.flip)}**  ` +
        `${this.discord.getEmoji("tint")}_Tint:_ **${this.getVal(obj.tint)}**\n` +
        `${this.discord.getEmoji("invert")}_Invert:_ **${this.getVal(obj.invert)}**  ` +
        `${this.discord.getEmoji("posterize")}_Posterize:_ **${this.getVal(obj.posterize)}**\n` +
        `${this.discord.getEmoji("crop")}_Crop:_ **${this.getVal(obj.crop)}**  ` +
        `${this.discord.getEmoji("scale")}_Scale:_ **${this.getVal(obj.scale)}**  ` +
        `${this.discord.getEmoji("rotate")}_Rotate:_ **${this.getVal(obj.rotate)}°**\n` +
        `${this.discord.getEmoji("blur")}_Blur:_ **${this.getVal(obj.blur)}**  ` +
        `${this.discord.getEmoji("sharpen")}_Sharpen:_ **${this.getVal(obj.sharpen)}**\n` +
        `_Use the arrows to switch between history states._`
        return desc
    }

    public fetchLink = async (link: string) => {
        if (link.startsWith("http")) {
            const arrayBuffer = await fetch(link).then((r) => r.arrayBuffer())
            return Buffer.from(arrayBuffer)
        }
        return fs.readFileSync(link)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const images = new Images(discord, message)
        if (message.guild && !(message.channel as TextChannel).permissionsFor(message.guild?.members.me!)?.has("ManageMessages")) {
            this.reply(`The bot needs the permission **Manage Messages** in order to use this command. ${this.discord.getEmoji("kannaFacepalm")}`)
            return
        }
        const seed = Math.floor(Math.random() * 10000)
        let url: string | undefined
        if (args[1]) {
            url = args[1]
        } else {
            url = await discord.fetchLastAttachment(message)
        }
        if (!url) return this.reply(`Could not find an image ${discord.getEmoji("kannaFacepalm")}`)
        if (!url.includes("http")) return this.reply(`Invalid image url ${discord.getEmoji("kannaFacepalm")}`)
        const hsvEmbed = embeds.createEmbed()
        if (!fs.existsSync(path.join(__dirname, "../../images"))) fs.mkdirSync(path.join(__dirname, "../../images"))
        const link = await images.upload([url]).then((l) => l[0])
        const description = this.getDesc()
        this.original = link
        this.originalEmbed = description
        hsvEmbed
        .setAuthor({name: "photoshop", iconURL: "https://kisaragi.moe/assets/embed/photoshop.png"})
        .setTitle(`**Photoshop** ${discord.getEmoji("chinoSmug")}`)
        .setImage(link)
        .setURL(link)
        .setDescription(description)
        const msg = await this.reply(hsvEmbed)
        const reactions = ["brightness", "contrast", "hue", "saturation", "lightness", "flip", "tint", "invert", "posterize", "crop", "scale", "rotate", "blur", "sharpen", "undo", "redo", "reset"]
        for (let i = 0; i < reactions.length; i++) await msg.react(discord.getEmoji(reactions[i]))

        const brightnessCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("brightness").id && user.bot === false
        const contrastCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("contrast").id && user.bot === false
        const hueCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("hue").id && user.bot === false
        const saturationCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("saturation").id && user.bot === false
        const lightnessCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("lightness").id && user.bot === false
        const flipCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("flip").id && user.bot === false
        const tintCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("tint").id && user.bot === false
        const invertCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("invert").id && user.bot === false
        const posterizeCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("posterize").id && user.bot === false
        const cropCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("crop").id && user.bot === false
        const scaleCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("scale").id && user.bot === false
        const rotateCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("rotate").id && user.bot === false
        const blurCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("blur").id && user.bot === false
        const sharpenCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("sharpen").id && user.bot === false
        const undoCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("undo").id && user.bot === false
        const redoCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("redo").id && user.bot === false
        const resetCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("reset").id && user.bot === false
        const brightness = msg.createReactionCollector({filter: brightnessCheck})
        const contrast = msg.createReactionCollector({filter: contrastCheck})
        const hue = msg.createReactionCollector({filter: hueCheck})
        const saturation = msg.createReactionCollector({filter: saturationCheck})
        const lightness = msg.createReactionCollector({filter: lightnessCheck})
        const flip = msg.createReactionCollector({filter: flipCheck})
        const tint = msg.createReactionCollector({filter: tintCheck})
        const invert = msg.createReactionCollector({filter: invertCheck})
        const posterize = msg.createReactionCollector({filter: posterizeCheck})
        const crop = msg.createReactionCollector({filter: cropCheck})
        const scale = msg.createReactionCollector({filter: scaleCheck})
        const rotate = msg.createReactionCollector({filter: rotateCheck})
        const blur = msg.createReactionCollector({filter: blurCheck})
        const sharpen = msg.createReactionCollector({filter: sharpenCheck})
        const undo = msg.createReactionCollector({filter: undoCheck})
        const redo = msg.createReactionCollector({filter: redoCheck})
        const reset = msg.createReactionCollector({filter: resetCheck})
        let argArray: string[] = []
        async function getArgs(response: Message) {
            argArray = response.content.split(" ")
            await Functions.deferDelete(response, 0)
        }

        brightness.on("collect", async (reaction, user) => {
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.send(`<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user).catch(() => null)
            const rep = await this.send(`<@${user.id}>, Enter the brightness factor (-100-100).`)
            await embeds.createPrompt(getArgs)
            await Functions.deferDelete(rep, 0)
            let factor = Number(argArray[0]) ? Number(argArray[0]) : 0
            if (factor < -100) factor = -100
            if (factor > 100) factor = 100
            const newObj = this.getObj()
            newObj.brightness += factor
            let newFactor = Functions.transformRange(factor, -100, 100, 0, 2)
            let current: string
            if (this.historyIndex < 0) {
                current = this.original
            } else {
                current = this.historyStates[this.historyIndex]
            }
            console.log(current)
            const currentBuffer = await this.fetchLink(current)
            console.log(currentBuffer)
            const buffer = await sharp(currentBuffer, {limitInputPixels: false})
            .modulate({brightness: newFactor}).toBuffer()
            let newDest = path.join(__dirname, `../../assets/misc/images/dump/${seed}_brightness`)
            let i = 0
            while (fs.existsSync(`${newDest}.jpg`)) {
                newDest = `${newDest}${i}`
                i++
            }
            console.log(`${newDest}.jpg`)
            fs.writeFileSync(`${newDest}.jpg`, buffer)
            const newEmbed = await this.hsvEmbed(`${newDest}.jpg`, newObj)
            discord.edit(msg, newEmbed)
            this.setProcBlock(true)
        })

        contrast.on("collect", async (reaction, user) => {
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.send(`<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user).catch(() => null)
            const rep = await this.send(`<@${user.id}>, Enter the contrast factor (-100-100).`)
            await embeds.createPrompt(getArgs)
            await Functions.deferDelete(rep, 0)
            let factor = Number(argArray[0]) ? Number(argArray[0]) : 0
            if (factor < -100) factor = -100
            if (factor > 100) factor = 100
            const newObj = this.getObj()
            newObj.contrast += factor
            let newFactor = Functions.transformRange(factor, -100, 100, 0, 2)
            let current: string
            if (this.historyIndex < 0) {
                current = this.original
            } else {
                current = this.historyStates[this.historyIndex]
            }
            const currentBuffer = await this.fetchLink(current)
            const buffer = await sharp(currentBuffer, {limitInputPixels: false})
            .linear(newFactor, -(128 * newFactor) + 128).toBuffer()
            let newDest = path.join(__dirname, `../../assets/misc/images/dump/${seed}_contrast`)
            let i = 0
            while (fs.existsSync(`${newDest}.jpg`)) {
                newDest = `${newDest}${i}`
                i++
            }
            fs.writeFileSync(`${newDest}.jpg`, buffer)
            const newEmbed = await this.hsvEmbed(`${newDest}.jpg`, newObj)
            discord.edit(msg, newEmbed)
            this.setProcBlock(true)
        })

        hue.on("collect", async (reaction, user) => {
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.send(`<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user).catch(() => null)
            const rep = await this.send(`<@${user.id}>, Enter the hue (-180-180).`)
            await embeds.createPrompt(getArgs)
            await Functions.deferDelete(rep, 0)
            const shift = Number(argArray[0]) ? Number(argArray[0]) : 0
            const newObj = this.getObj()
            newObj.hue += shift
            let current: string
            if (this.historyIndex < 0) {
                current = this.original
            } else {
                current = this.historyStates[this.historyIndex]
            }
            const currentBuffer = await this.fetchLink(current)
            const buffer = await sharp(currentBuffer, {limitInputPixels: false})
            .modulate({hue: shift}).toBuffer()
            let newDest = path.join(__dirname, `../../assets/misc/images/dump/${seed}_hue`)
            let i = 0
            while (fs.existsSync(`${newDest}.jpg`)) {
                newDest = `${newDest}${i}`
                i++
            }
            fs.writeFileSync(`${newDest}.jpg`, buffer)
            const newEmbed = await this.hsvEmbed(`${newDest}.jpg`, newObj)
            discord.edit(msg, newEmbed)
            this.setProcBlock(true)
        })

        saturation.on("collect", async (reaction, user) => {
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.send(`<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user).catch(() => null)
            const rep = await this.send(`<@${user.id}>, Enter the saturation factor (-100-100).`)
            await embeds.createPrompt(getArgs)
            await Functions.deferDelete(rep, 0)
            let value = Number(argArray[0]) ? Number(argArray[0]) : 0
            const newObj = this.getObj()
            newObj.saturation += value
            let newValue = Functions.transformRange(value, -100, 100, 0, 2)
            let current: string
            if (this.historyIndex < 0) {
                current = this.original
            } else {
                current = this.historyStates[this.historyIndex]
            }
            const currentBuffer = await this.fetchLink(current)
            const buffer = await sharp(currentBuffer, {limitInputPixels: false})
            .modulate({saturation: newValue}).toBuffer()
            let newDest = path.join(__dirname, `../../assets/misc/images/dump/${seed}_saturation`)
            let i = 0
            while (fs.existsSync(`${newDest}.jpg`)) {
                newDest = `${newDest}${i}`
                i++
            }
            fs.writeFileSync(`${newDest}.jpg`, buffer)
            const newEmbed = await this.hsvEmbed(`${newDest}.jpg`, newObj)
            discord.edit(msg, newEmbed)
            this.setProcBlock(true)
        })

        lightness.on("collect", async (reaction, user) => {
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.send(`<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user).catch(() => null)
            const rep = await this.send(`<@${user.id}>, Enter the lightness factor (-100-100).`)
            await embeds.createPrompt(getArgs)
            await Functions.deferDelete(rep, 0)
            let factor = Number(argArray[0]) ? Number(argArray[0]) : 0
            const newObj = this.getObj()
            newObj.lightness += factor
            let current: string
            if (this.historyIndex < 0) {
                current = this.original
            } else {
                current = this.historyStates[this.historyIndex]
            }
            const currentBuffer = await this.fetchLink(current)
            const buffer = await sharp(currentBuffer, {limitInputPixels: false})
            .modulate({lightness: factor}).toBuffer()
            let newDest = path.join(__dirname, `../../assets/misc/images/dump/${seed}_lightness`)
            let i = 0
            while (fs.existsSync(`${newDest}.jpg`)) {
                newDest = `${newDest}${i}`
                i++
            }
            fs.writeFileSync(`${newDest}.jpg`, buffer)
            const newEmbed = await this.hsvEmbed(`${newDest}.jpg`, newObj)
            discord.edit(msg, newEmbed)
            this.setProcBlock(true)
        })

        flip.on("collect", async (reaction, user) => {
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.send(`<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user).catch(() => null)
            const rep = await this.send(`<@${user.id}>, Type \`x\` to flip horizontally, \`y\` to flip vertically, or \`xy\` for both.`)
            await embeds.createPrompt(getArgs)
            await Functions.deferDelete(rep, 0)
            const input = argArray.join("")
            let setHorizontal = false
            let setVertical = false
            if (/x/.test(input)) {
                setHorizontal = true
            } else if (/y/.test(input)) {
                setVertical = true
            }
            let current: string
            if (this.historyIndex < 0) {
                current = this.original
            } else {
                current = this.historyStates[this.historyIndex]
            }
            const currentBuffer = await this.fetchLink(current)
            let img = sharp(currentBuffer, {limitInputPixels: false})
            const newObj = this.getObj()
            if (setHorizontal) {
                img = img.flop()
                if (newObj.flip === "Horizontal") {
                    newObj.flip = "None"
                } else {
                    newObj.flip = "Horizontal"
                }
            } else if (setVertical) {
                img = img.flip()
                if (newObj.flip === "Vertical") {
                    newObj.flip = "None"
                } else {
                    newObj.flip = "Vertical"
                }
            } else if (setHorizontal && setVertical) {
                img = img.flip().flop()
                if (newObj.flip === "Horizontal and Vertical") {
                    newObj.flip = "None"
                } else if (newObj.flip === "Horizontal") {
                    newObj.flip = "Vertical"
                } else if (newObj.flip === "Vertical") {
                    newObj.flip = "Horizontal"
                } else {
                    newObj.flip = "Horizontal and Vertical"
                }
            }
            let buffer = await img.toBuffer()
            let newDest = path.join(__dirname, `../../assets/misc/images/dump/${seed}_flip`)
            let i = 0
            while (fs.existsSync(`${newDest}.jpg`)) {
                newDest = `${newDest}${i}`
                i++
            }
            fs.writeFileSync(`${newDest}.jpg`, buffer)
            const newEmbed = await this.hsvEmbed(`${newDest}.jpg`, newObj)
            discord.edit(msg, newEmbed)
            this.setProcBlock(true)
        })

        tint.on("collect", async (reaction, user) => {
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.send(`<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user).catch(() => null)
            const rep = await this.send(`<@${user.id}>, Enter the hex color.`)
            await embeds.createPrompt(getArgs)
            await Functions.deferDelete(rep, 0)
            const color = argArray[0] ? argArray[0] : "#ff0fd3"
            const newObj = this.getObj()
            newObj.tint = `${color}`
            let current: string
            if (this.historyIndex < 0) {
                current = this.original
            } else {
                current = this.historyStates[this.historyIndex]
            }
            const currentBuffer = await this.fetchLink(current)
            const buffer = await sharp(currentBuffer, {limitInputPixels: false})
            .tint(Functions.decodeHexColor(color)).toBuffer()
            let newDest = path.join(__dirname, `../../assets/misc/images/dump/${seed}_tint`)
            let i = 0
            while (fs.existsSync(`${newDest}.jpg`)) {
                newDest = `${newDest}${i}`
                i++
            }
            fs.writeFileSync(`${newDest}.jpg`, buffer)
            const newEmbed = await this.hsvEmbed(`${newDest}.jpg`, newObj)
            discord.edit(msg, newEmbed)
            this.setProcBlock(true)
        })

        invert.on("collect", async (reaction, user) => {
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.send(`<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user).catch(() => null)
            let current: string
            if (this.historyIndex < 0) {
                current = this.original
            } else {
                current = this.historyStates[this.historyIndex]
            }
            const newObj = this.getObj()
            if (newObj.invert === "On") {
                newObj.invert = "Off"
            } else {
                newObj.invert = "On"
            }
            const currentBuffer = await this.fetchLink(current)
            const buffer = await sharp(currentBuffer, {limitInputPixels: false})
            .negate({alpha: false}).toBuffer()
            let newDest = path.join(__dirname, `../../assets/misc/images/dump/${seed}_invert`)
            let i = 0
            while (fs.existsSync(`${newDest}.jpg`)) {
                newDest = `${newDest}${i}`
                i++
            }
            fs.writeFileSync(`${newDest}.jpg`, buffer)
            const newEmbed = await this.hsvEmbed(`${newDest}.jpg`, newObj)
            discord.edit(msg, newEmbed)
            this.setProcBlock(true)
        })

        posterize.on("collect", async (reaction, user) => {
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.send(`<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user).catch(() => null)
            const rep = await this.send(`<@${user.id}>, Enter the number of levels.`)
            await embeds.createPrompt(getArgs)
            await Functions.deferDelete(rep, 0)
            let current: string
            if (this.historyIndex < 0) {
                current = this.original
            } else {
                current = this.historyStates[this.historyIndex]
            }
            const newObj = this.getObj()
            if (newObj.posterize === "On") {
                newObj.posterize = "Off"
            } else {
                newObj.posterize = "On"
            }
            const currentBuffer = await this.fetchLink(current)
            const buffer = await sharp(currentBuffer, {limitInputPixels: false}).png().toBuffer()
            const image = await jimp.read(buffer)
            const levels = Number(argArray[0]) ? Number(argArray[0]) : 2
            image.posterize(levels)
            let newDest = path.join(__dirname, `../../assets/misc/images/dump/${seed}_posterize`)
            let i = 0
            while (fs.existsSync(`${newDest}.jpg`)) {
                newDest = `${newDest}${i}`
                i++
            }
            await image.write(`${newDest}.jpg`)
            const newEmbed = await this.hsvEmbed(`${newDest}.jpg`, newObj)
            discord.edit(msg, newEmbed)
            this.setProcBlock(true)
        })

        crop.on("collect", async (reaction, user) => {
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.send(`<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user).catch(() => null)
            const rep = await this.send(`<@${user.id}>, Enter the x offset, y offset, width, and height (in pixels).`)
            await embeds.createPrompt(getArgs)
            await Functions.deferDelete(rep, 0)
            let current: string
            if (this.historyIndex < 0) {
                current = this.original
            } else {
                current = this.historyStates[this.historyIndex]
            }
            const currentBuffer = await this.fetchLink(current)
            const metadata = await sharp(currentBuffer, {limitInputPixels: false}).metadata()
            const x = argArray[0] ? Number(argArray[0]) : 0
            const y = argArray[1] ? Number(argArray[1]) : 0
            let width = argArray[2] ? Number(argArray[2]) : metadata.width!
            let height = argArray[3] ? Number(argArray[3]) : Math.floor(metadata.height! / (metadata.width! / width * 1.0))
            if (width > metadata.width!) width = metadata.width!
            if (height > metadata.height!) height = metadata.height!
            const newObj = this.getObj()
            newObj.crop = `${x}x ${y}y ${width}w ${height}h`
            const buffer = await sharp(currentBuffer, {limitInputPixels: false})
            .extract({left: x, top: y, width, height}).toBuffer()
            let newDest = path.join(__dirname, `../../assets/misc/images/dump/${seed}_crop`)
            let i = 0
            while (fs.existsSync(`${newDest}.jpg`)) {
                newDest = `${newDest}${i}`
                i++
            }
            fs.writeFileSync(`${newDest}.jpg`, buffer)
            const newEmbed = await this.hsvEmbed(`${newDest}.jpg`, newObj)
            discord.edit(msg, newEmbed)
            this.setProcBlock(true)
        })

        scale.on("collect", async (reaction, user) => {
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.send(`<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user).catch(() => null)
            const rep = await this.send(`<@${user.id}>, Enter the width and height. Type \`scale\` if you want to use a scale factor instead (eg. 1.5x).`)
            await embeds.createPrompt(getArgs)
            await Functions.deferDelete(rep, 0)
            let current: string
            if (this.historyIndex < 0) {
                current = this.original
            } else {
                current = this.historyStates[this.historyIndex]
            }
            const currentBuffer = await this.fetchLink(current)
            const metadata = await sharp(currentBuffer, {limitInputPixels: false}).metadata()
            const newObj = this.getObj()
            let width = undefined as any
            let height = undefined as any
            if (/scale/.test(argArray.join(" "))) {
                const input = argArray.join(" ").replace("scale", "").trim().split("")
                const factor = Number(input[0]) ? Number(input[0]) : 1
                width = Math.floor(metadata.width! * factor)
                height = Math.floor(metadata.height! * factor)
                newObj.scale = `${Number(String(newObj.scale).replace("x", "")) * factor}x`
            } else {
                width = argArray[0] ? Number(argArray[0]) : undefined as any
                height = argArray[1] ? Number(argArray[1]) : undefined as any
                newObj.scale = `${width}w ${height}h`
            }
            let buffer = await sharp(currentBuffer, {limitInputPixels: false})
            .resize({width, height, fit: "fill"}).toBuffer()
            let newDest = path.join(__dirname, `../../assets/misc/images/dump/${seed}_scale`)
            let i = 0
            while (fs.existsSync(`${newDest}.jpg`)) {
                newDest = `${newDest}${i}`
                i++
            }
            fs.writeFileSync(`${newDest}.jpg`, buffer)
            const newEmbed = await this.hsvEmbed(`${newDest}.jpg`, newObj)
            discord.edit(msg, newEmbed)
            this.setProcBlock(true)
        })

        rotate.on("collect", async (reaction, user) => {
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.send(`<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user).catch(() => null)
            const rep = await this.send(`<@${user.id}>, Enter the the amount of degrees to rotate (clockwise).`)
            await embeds.createPrompt(getArgs)
            await Functions.deferDelete(rep, 0)
            let current: string
            if (this.historyIndex < 0) {
                current = this.original
            } else {
                current = this.historyStates[this.historyIndex]
            }
            let degrees = Number(argArray[0]) ? Number(argArray[0]) : 0
            const newObj = this.getObj()
            newObj.rotate += degrees
            const currentBuffer = await this.fetchLink(current)
            const buffer = await sharp(currentBuffer, {limitInputPixels: false})
            .png().ensureAlpha().rotate(degrees, {background: {r: 0, b: 0, g: 0, alpha: 0}}).toBuffer()
            let newDest = path.join(__dirname, `../../assets/misc/images/dump/${seed}_rotate`)
            let i = 0
            while (fs.existsSync(`${newDest}.png`)) {
                newDest = `${newDest}${i}`
                i++
            }
            fs.writeFileSync(`${newDest}.png`, buffer)
            const newEmbed = await this.hsvEmbed(`${newDest}.png`, newObj)
            discord.edit(msg, newEmbed)
            this.setProcBlock(true)
        })

        blur.on("collect", async (reaction, user) => {
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.send(`<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user).catch(() => null)
            const rep = await this.send(`<@${user.id}>, Enter the blur radius in pixels.`)
            await embeds.createPrompt(getArgs)
            await Functions.deferDelete(rep, 0)
            let current: string
            if (this.historyIndex < 0) {
                current = this.original
            } else {
                current = this.historyStates[this.historyIndex]
            }
            const radius = Number(argArray[0]) ? Number(argArray[0]) : 5
            const currentBuffer = await this.fetchLink(current)
            const buffer = await sharp(currentBuffer, {limitInputPixels: false})
            .blur({sigma: radius}).toBuffer()
            const newObj = this.getObj()
            newObj.blur += radius
            let newDest = path.join(__dirname, `../../assets/misc/images/dump/${seed}_blur`)
            let i = 0
            while (fs.existsSync(`${newDest}.jpg`)) {
                newDest = `${newDest}${i}`
                i++
            }
            fs.writeFileSync(`${newDest}.jpg`, buffer)
            const newEmbed = await this.hsvEmbed(`${newDest}.jpg`, newObj)
            discord.edit(msg, newEmbed)
            this.setProcBlock(true)
        })

        sharpen.on("collect", async (reaction, user) => {
            if (this.getProcBlock()) {
                await reaction.users.remove(user)
                const proc = await this.send(`<@${user.id}>, Please wait until the current effect is done processing before adding another.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            await reaction.users.remove(user).catch(() => null)
            const rep = await this.send(`<@${user.id}>, Enter the the sharpen amount.`)
            await embeds.createPrompt(getArgs)
            await Functions.deferDelete(rep, 0)
            let current: string
            if (this.historyIndex < 0) {
                current = this.original
            } else {
                current = this.historyStates[this.historyIndex]
            }
            const amount = Number(argArray[0]) ? Number(argArray[0]) : 1
            const newObj = this.getObj()
            newObj.sharpen += amount
            const currentBuffer = await this.fetchLink(current)
            const buffer = await sharp(currentBuffer, {limitInputPixels: false})
            .sharpen({sigma: amount}).toBuffer()
            let newDest = path.join(__dirname, `../../assets/misc/images/dump/${seed}_sharp`)
            let i = 0
            while (fs.existsSync(`${newDest}.jpg`)) {
                newDest = `${newDest}${i}`
                i++
            }
            fs.writeFileSync(`${newDest}.jpg`, buffer)
            const newEmbed = await this.hsvEmbed(`${newDest}.jpg`, newObj)
            discord.edit(msg, newEmbed)
            this.setProcBlock(true)
        })

        undo.on("collect", async (reaction, user) => {
            await reaction.users.remove(user).catch(() => null)
            this.historyIndex--
            let current = this.historyStates[this.historyIndex]
            if (!current) {
                current = this.original
                this.historyIndex = -1
            }
            const newEmbed = await this.hsvEmbed(current)
            discord.edit(msg, newEmbed)
        })

        redo.on("collect", async (reaction, user) => {
            await reaction.users.remove(user).catch(() => null)
            this.historyIndex++
            let current = this.historyStates[this.historyIndex]
            if (!current) {
                this.historyIndex = this.historyStates.length - 1
                current = this.historyStates[this.historyIndex]
                if (!current) {
                    current = this.original
                    this.historyIndex = -1
                }
            }
            const newEmbed = await this.hsvEmbed(current)
            discord.edit(msg, newEmbed)
        })

        reset.on("collect", async (reaction, user) => {
            await reaction.users.remove(user).catch(() => null)
            this.historyIndex = -1
            const newEmbed = await this.hsvEmbed(this.original)
            discord.edit(msg, newEmbed)
        })
    }
}
