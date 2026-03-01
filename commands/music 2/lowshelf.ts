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

export default class Lowshelf extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Applies a lowshelf filter (boosts bass).",
            help:
            `
            \`lowshelf gain? freq? width?\` - Applies a lowshelf filter to the audio file with the parameters.
            \`lowshelf download/dl gain? freq? width?\` - Applies a lowshelf filter to an attachment and uploads it.
            `,
            examples:
            `
            \`=>lowshelf 4 300 100\`
            \`=>lowshelf 2 200 50\`
            `,
            aliases: [],
            guildOnly: true,
            cachedGuildOnly: true,
            cooldown: 20,
            premium: true,
            subcommandEnabled: true
        })
        const width2Option = new SlashCommandOption()
            .setType("string")
            .setName("width2")
            .setDescription("Width of the filter in the dl subcommand.")

        const widthOption = new SlashCommandOption()
            .setType("string")
            .setName("width")
            .setDescription("Width of the filter or freq in the dl subcommand.")

        const freqOption = new SlashCommandOption()
            .setType("string")
            .setName("freq")
            .setDescription("Freq of the filter or gain in the dl subcommand.")

        const gainOption = new SlashCommandOption()
            .setType("string")
            .setName("gain")
            .setDescription("Gain of the filter or dl to apply to an attachment.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(gainOption)
            .addOption(freqOption)
            .addOption(widthOption)
            .addOption(width2Option)
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
        const gain = Number(args[1])
        const freq = Number(args[2])
        const width = Number(args[3])
        const rep = await this.reply("_Adding a lowshelf filter to the file, please wait..._")
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
            await audio.lowshelf(file, gain, freq, width, setDownload)
        } catch {
            return this.reply("Sorry, these parameters will cause clipping distortion on the audio file.")
        }
        if (rep) rep.delete()
        if (!setDownload) {
            const queue = audio.getQueue()
            const settings = audio.getSettings()
            settings.filters.push("lowshelf")
            const embed = await audio.updateNowPlaying()
            discord.edit(queue[0].message!, embed)
            const rep = await this.reply("Applied a lowshelf filter to the file!")
            await Functions.timeout(3000)
        Functions.deferDelete(rep, 0)
        if (message instanceof Message) Functions.deferDelete(message, 0)
        }
    }
}
