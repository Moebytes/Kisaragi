/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Audio} from "./../../structures/Audio"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Queue extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Displays the full queue of songs.",
            help:
            `
            \`queue\` - Shows the queue of songs.
            `,
            examples:
            `
            \`=>queue\`
            `,
            aliases: [],
            guildOnly: true,
            cachedGuildOnly: true,
            cooldown: 10,
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
        const queue = audio.getQueue()
        const queueArray: EmbedBuilder[] = []
        for (let i = 0; i < queue.length; i++) {
            const embed = await audio.updateNowPlaying(i)
            embed
            .setAuthor({name: "queue", iconURL: "https://kisaragi.moe/assets/embed/queue.png"})
            .setTitle(`**Position #${i+1}** ${discord.getEmoji("gabYes")}`)
            queueArray.push(embed)
        }
        return embeds.createReactionEmbed(queueArray)
    }
}
