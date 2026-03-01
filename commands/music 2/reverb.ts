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

export default class Reverb extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Applies a reverb effect.",
            help:
            `
            _Note: The first four parameters are percentages, pre-delay is in milliseconds and gain is in decibels._
            \`reverb amount? damping? room? stereo? pre-delay? wet-gain?\` - Applies a reverb with the specified parameters.
            \`reverb reverse amount? damping? room? stereo? pre-delay? wet-gain?\` - Applies a reverse reverb effect.
            \`reverb download/dl reverse? amount? damping? room? stereo? pre-delay? wet-gain?\` - Applies the effect to an attachment and uploads it.
            `,
            examples:
            `
            \`=>reverb 50 50 100 100 0 0\`
            \`=>reverb reverse 75 25 100 100 0 0\`
            `,
            aliases: [],
            guildOnly: true,
            cachedGuildOnly: true,
            cooldown: 5,
            premium: true,
            subcommandEnabled: true
        })
        const wet2GainOption = new SlashCommandOption()
            .setType("string")
            .setName("wet-gain2")
            .setDescription("Wet gain of the effect in the dl subcommand.")

        const wetGainOption = new SlashCommandOption()
            .setType("string")
            .setName("wet-gain")
            .setDescription("Wet gain of the effect or pre-delay in the dl subcommand.")

        const predelayOption = new SlashCommandOption()
            .setType("string")
            .setName("pre-delay")
            .setDescription("Predelay of the effect or stereo in the dl subcommand.")

        const stereoOption = new SlashCommandOption()
            .setType("string")
            .setName("stereo")
            .setDescription("Stereo of the effect or room in the dl subcommand.")

        const roomOption = new SlashCommandOption()
            .setType("string")
            .setName("room")
            .setDescription("Room of the effect or damping in the dl subcommand.")

        const dampingOption = new SlashCommandOption()
            .setType("string")
            .setName("damping")
            .setDescription("Damping of the effect or amount in the dl subcommand.")

        const amountOption = new SlashCommandOption()
            .setType("string")
            .setName("amount")
            .setDescription("Amount of the effect or dl to apply to an attachment.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(amountOption)
            .addOption(dampingOption)
            .addOption(roomOption)
            .addOption(stereoOption)
            .addOption(predelayOption)
            .addOption(wetGainOption)
            .addOption(wet2GainOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const audio = new Audio(discord, message)
        const perms = new Permission(discord, message)
        if (!audio.checkMusicPermissions()) return
        if (!audio.checkMusicPlaying()) return
        let input = Functions.combineArgs(args, 1)
        let setReverse = false
        if (input.match(/reverse/)) {
            setReverse = true
            input = input.replace("reverse", "")
        }
        const newArgs = input.split(/ +/g)
        let setDownload = false
        if (newArgs[0] === "download" || newArgs[0] === "dl") {
            setDownload = true
            args.shift()
        }
        const amount = Number(newArgs[0])
        const damping = Number(newArgs[1])
        const room = Number(newArgs[2])
        const stereo = Number(newArgs[3])
        const preDelay = Number(newArgs[4])
        const wetGain = Number(newArgs[5])
        const rep = await this.reply("_Adding reverb to the file, please wait..._")
        let file = ""
        if (setDownload) {
            const regex = new RegExp(/.(mp3|wav|flac|ogg|aiff)/)
            const attachment = await discord.fetchLastAttachment(message, false, regex)
            if (!attachment) return this.reply(`Only **mp3**, **wav**, **flac**, **ogg**, and **aiff** files are supported.`)
            file = attachment
        } else {
            const queue = audio.getQueue()
            file = queue[0]?.file
        }
        try {
            await audio.reverb(file, amount, damping, room, stereo, preDelay, wetGain, setReverse)
        } catch {
            return this.reply("Sorry, these parameters will cause clipping distortion on the audio file.")
        }
        if (rep) rep.delete()
        if (!setDownload) {
            const queue = audio.getQueue()
            const settings = audio.getSettings()
            settings.effects.push("reverb")
            const embed = await audio.updateNowPlaying()
            discord.edit(queue[0].message!, embed)
            const rep = await this.reply("Added a reverb effect to the file!")
            await Functions.timeout(3000)
        Functions.deferDelete(rep, 0)
        if (message instanceof Message) Functions.deferDelete(message, 0)
        }
    }
}
