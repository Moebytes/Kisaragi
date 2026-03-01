/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, Snowflake} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Kisaragi} from "../../structures/Kisaragi"

export default class Icon extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Posts the guild's icon.",
            help:
            `
            \`icon\` - Posts the guild icon
            `,
            examples:
            `
            \`=>icon\`
            `,
            guildOnly: true,
            aliases: ["gicon", "guildicon"],
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
        const guildIconEmbed = embeds.createEmbed()

        if (!message.guild) {
            try {
                const preview = await discord.fetchGuildPreview(message.guildId!)
                let icon = preview.iconURL({extension: "png", size: 512})
                return this.reply(guildIconEmbed
                    .setDescription(`**${preview.name}'s Icon**`)
                    .setURL(icon)
                    .setImage(icon))
            } catch {
                return this.reply(`I have to be added to this guild or it must be discoverable.`)
            }
        }

        const icon = message.guild?.iconURL({extension: "png", size: 1024})
        if (!icon) return this.reply(`This guild doesn't have an icon ${discord.getEmoji("kannaFacepalm")}`)
        await this.reply(guildIconEmbed
            .setDescription(`**${message.guild!.name}'s Icon**`)
            .setURL(icon)
            .setImage(icon))
    }
}
