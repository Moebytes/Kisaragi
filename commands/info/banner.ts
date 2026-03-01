/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Kisaragi} from "../../structures/Kisaragi"

export default class Banner extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Posts the guild's banner.",
            help:
            `
            \`banner\` - Posts the guild banner
            `,
            examples:
            `
            \`=>banner\`
            `,
            guildOnly: true,
            aliases: [],
            random: "none",
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
        const embeds = new Embeds(discord, message)
        const bannerEmbed = embeds.createEmbed()

        if (!message.guild) {
            try {
                const preview = await discord.fetchGuildPreview(message.guildId!)
                let banner = preview.splashURL({extension: "png", size: 512})
                return this.reply(bannerEmbed
                    .setDescription(`**${preview.name}'s Banner**`)
                    .setURL(banner)
                    .setImage(banner))
            } catch {
                return this.reply(`I have to be added to this guild or it must be discoverable.`)
            }
        }

        const banner = message.guild?.bannerURL({extension: "png", size: 1024})
        if (!banner) return message.reply(`This guild has no banner ${discord.getEmoji("kannaFacepalm")}`)

        await this.reply(bannerEmbed
            .setDescription(`**${message.guild!.name}'s Banner**`)
            .setURL(banner)
            .setImage(banner))
    }
}