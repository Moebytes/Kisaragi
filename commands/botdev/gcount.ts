/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, ActivityType} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"
import {SQLQuery} from "../../structures/SQLQuery"

export default class GCount extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Refreshes the guild count and reposts stats.",
            help:
            `
            \`gcount\` - Refresh guild count
            `,
            examples:
            `
            \`=>gcount\`
            `,
            aliases: [],
            cooldown: 3,
            botdev: true,
            subcommandEnabled: true
        })
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const sql = new SQLQuery(message)
        const embeds = new Embeds(discord, message)
        if (!perms.checkBotDev()) return
        this.discord.user?.setPresence({activities: [{type: ActivityType.Playing, name: `=>help | ${this.discord.guilds.cache.size} guilds`, state: "dnd"}]})
        this.discord.postGuildCount()
        return this.reply("Refreshed guild count!")
    }
}
