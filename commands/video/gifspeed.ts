/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, AttachmentBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import fs from "fs"
import gifFrames from "gif-frames"
import path from "path"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Images} from "../../structures/Images"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class GifSpeed extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Speeds up a gif by constraining the amount of frames.",
            help:
            `
            _Note: If you use a factor, a period is required. Otherwise a frame amount is assumed._
            \`gifspeed\` - The default frame amount is 20.
            \`gifspeed frames/factor\` - Speeds up the last posted gif.
            \`gifspeed frames/factor url\` - Speeds up the linked gif.
            `,
            examples:
            `
            \`=>gifspeed 20\`
            \`=>gifspeed 1.5\`
            `,
            aliases: ["gspeed", "cgif", "constraingif", "compressgif"],
            cooldown: 20,
            defer: true,
            premium: true,
            subcommandEnabled: true
        })
        const urlOption = new SlashCommandOption()
            .setType("string")
            .setName("url")
            .setDescription("Optional url, or will use last posted gif.")

        const factorOption = new SlashCommandOption()
            .setType("number")
            .setName("factor")
            .setDescription("Factor or number of frames.")

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
        const perms = new Permission(discord, message)
        const regex = new RegExp(/.gif/)
        args[1] = String(args[1]).replace(/x/g, "")
        let constrain = !Number.isNaN(Number(args[1])) ? Number(args[1]) : 20
        let url: string | undefined
        if (args[2]) {
            url = args[2]
        } else {
            url = await discord.fetchLastAttachment(message, false, regex)
        }
        if (!url) return message.reply(`Could not find a gif ${discord.getEmoji("kannaCurious")}`)
        const frames = await gifFrames({url, frames: "all", cumulative: true})
        if (String(args[1]).includes(".")) {
            constrain = Math.round(frames.length / constrain)
        }
        if (constrain >= frames.length) return this.reply(`Adding frames to or slowing down a gif is not supported. ${discord.getEmoji("kannaFacepalm")}`)
        const newFrames = Functions.constrain(frames, constrain) as any[]
        const random = Math.floor(Math.random() * 10000)
        const dir = path.join(__dirname, `../../assets/misc/images/dump/${random}/`)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true})
        const files: string[] = []
        const promises: any[] = []
        for (let i = 0; i < newFrames.length; i++) {
            const readStream = newFrames[i].getImage()
            const writeStream = fs.createWriteStream(path.join(dir, `./image${newFrames[i].frameIndex}.jpg`))
            const prom = new Promise<void>((resolve) => {
                readStream.pipe(writeStream).on("finish", () => resolve())
            })
            files.push(path.join(dir, `./image${newFrames[i].frameIndex}.jpg`))
            promises.push(prom)
        }
        await Promise.all(promises)
        const msg = await this.reply(`**Encoding Gif. This might take awhile...** ${this.discord.getEmoji("kisaragiCircle")}`)
        const file = fs.createWriteStream(path.join(dir, `./animated.gif`))
        await images.encodeGif(files, dir, file)
        Functions.deferDelete(msg, 0)
        const attachment = new AttachmentBuilder(path.join(dir, `./animated.gif`), {name: "animated.gif"})
        return this.reply(`Constrained a **${frames.length}** frame gif down to **${files.length}** frames!`, attachment)
    }
}
