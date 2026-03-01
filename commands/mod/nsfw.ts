 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, TextChannel} from "discord.js"
import {SlashCommandSubcommand} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class NSFW extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Turns nsfw on/off for the current channel.",
          help:
          `
          \`nsfw\` - Sets nsfw to be on or off
          `,
          examples:
          `
          \`=>nsfw\`
          `,
          guildOnly: true,
          cachedGuildOnly: true,
          aliases: [],
          cooldown: 5,
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
        if (!await perms.checkMod()) return

        const channel = message.channel as TextChannel
        let state = "off"
        if (channel.nsfw) {
            await channel.setNSFW(false, "On second thought, this channel is sfw.")
        } else {
            await channel.setNSFW(true, "Definitely not a safe channel to open in public.")
            state = "on"
        }
        return this.reply(`Set nsfw on this channel **${state}**! ${discord.getEmoji("aquaUp")}`)
    }
}
