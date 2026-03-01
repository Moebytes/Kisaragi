 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Audio} from "./../../structures/Audio"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Flanger extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Applies a flanger effect.",
            help:
            `
            _Note: Parameters are delay (0-30), depth (0-10), regen (-95-95), width (0-100), speed (0.1-10), shape (sin/tri), phase (0-100), and interp (lin/quad)._
            \`flanger delay? depth? regen? width? speed? shape? phase? interp?\` - Applies flanger to the audio file with the parameters.
            \`flanger download/dl delay? depth? regen? width? speed? shape? phase? interp?\` - Applies flanger to an attachment and uploads it.
            `,
            examples:
            `
            \`=>flanger 100 30 40 60 30 10 30 20\`
            \`=>flanger download 300 20 40 60 10 50 10 50\`
            `,
            aliases: ["flg"],
            guildOnly: true,
            cachedGuildOnly: true,
            cooldown: 20,
            premium: true,
            subcommandEnabled: true
        })
        const interp2Option = new SlashCommandOption()
            .setType("string")
            .setName("interp2")
            .setDescription("Interp of the effect in the dl subcommand.")

        const interpOption = new SlashCommandOption()
            .setType("string")
            .setName("interp")
            .setDescription("Interp of the effect or phase in the dl subcommand.")

        const phaseOption = new SlashCommandOption()
            .setType("string")
            .setName("phase")
            .setDescription("Phase of the effect or shape in the dl subcommand.")

        const shapeOption = new SlashCommandOption()
            .setType("string")
            .setName("shape")
            .setDescription("Shape of the effect or speed in the dl subcommand.")

        const speedOption = new SlashCommandOption()
            .setType("string")
            .setName("speed")
            .setDescription("Speed of the effect or width in the dl subcommand.")

        const widthOption = new SlashCommandOption()
            .setType("string")
            .setName("width")
            .setDescription("Width of the effect or regen in the dl subcommand.")

        const regenOption = new SlashCommandOption()
            .setType("string")
            .setName("regen")
            .setDescription("Regen of the effect or depth in the dl subcommand.")

        const depthOption = new SlashCommandOption()
            .setType("string")
            .setName("depth")
            .setDescription("Depth of the effect or delay in the dl subcommand.")

        const delayOption = new SlashCommandOption()
            .setType("string")
            .setName("delay")
            .setDescription("Delay of the effect or dl to apply to an attachment.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(delayOption)
            .addOption(depthOption)
            .addOption(regenOption)
            .addOption(widthOption)
            .addOption(speedOption)
            .addOption(shapeOption)
            .addOption(phaseOption)
            .addOption(interpOption)
            .addOption(interp2Option)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const audio = new Audio(discord, message)
        const perms = new Permission(discord, message)
        if (!audio.checkMusicPermissions()) return
        if (!audio.checkMusicPlaying()) return
        const queue = audio.getQueue()
        let setDownload = false
        if (args[1] === "download" || args[1] === "dl") {
            setDownload = true
            args.shift()
        }
        const delay = Number(args[1])
        const depth = Number(args[2])
        const regen = Number(args[3])
        const width = Number(args[4])
        const speed = Number(args[5])
        const shape = args[6] as any
        const phase = Number(args[7])
        const interp = args[8] as any
        const rep = await this.reply("_Adding flanger to the file, please wait..._")
        let file = ""
        if (setDownload) {
            const regex = new RegExp(/.(mp3|wav|flac|ogg|aiff)/)
            const attachment = await discord.fetchLastAttachment(message, false, regex)
            if (!attachment) return this.reply(`Only **mp3**, **wav**, **flac**, **ogg**, and **aiff** files are supported.`)
            file = attachment
        } else {
            const queue = audio.getQueue()
            file = queue?.[0].file
        }
        try {
            await audio.flanger(file, delay, depth, regen, width, speed, shape, phase, interp, setDownload)
        } catch {
            return this.reply("Sorry, these parameters will cause clipping distortion on the audio file.")
        }
        if (rep) rep.delete()
        if (!setDownload) {
            const queue = audio.getQueue()
            const settings = audio.getSettings()
            settings.effects.push("flanger")
            const embed = await audio.updateNowPlaying()
            discord.edit(queue[0].message!, embed)
            const rep = await this.reply("Applied a flanger effect to the file!")
            await Functions.timeout(3000)
        Functions.deferDelete(rep, 0)
        if (message instanceof Message) Functions.deferDelete(message, 0)
        }
    }
}
