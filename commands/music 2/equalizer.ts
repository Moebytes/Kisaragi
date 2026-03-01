 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import fs from "fs"
import {Command} from "../../structures/Command"
import {Audio} from "./../../structures/Audio"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Equalizer extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Opens the equalizer menu.",
            help:
            `
            \`equalizer\` - Opens the equalizer.
            `,
            examples:
            `
            \`=>equalizer\`
            `,
            aliases: ["eq"],
            guildOnly: true,
            cachedGuildOnly: true,
            cooldown: 20,
            defer: true,
            premium: true,
            subcommandEnabled: true
        })
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const audio = new Audio(discord, message)
        const perms = new Permission(discord, message)
        if (!audio.checkMusicPermissions()) return
        if (!audio.checkMusicPlaying()) return
        if (!message.channel.isSendable()) return
        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)
        const msg = await audio.equalizerMenu()
        Functions.deferDelete(msg, 0)
        const queue = audio.getQueue()
        const embed = await audio.updateNowPlaying()
        discord.edit(queue[0].message!, embed)
        if (message instanceof Message) Functions.deferDelete(message, 0)
    }
}
