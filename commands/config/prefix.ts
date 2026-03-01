/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Permission} from "../../structures/Permission"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Prefix extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Changes the bot prefix.",
            help:
            `
            \`prefix text\` - Sets the new prefix.
            `,
            examples:
            `
            \`=>prefix k!\`
            `,
            guildOnly: true,
            cachedGuildOnly: true,
            aliases: ["pref"],
            cooldown: 10,
            subcommandEnabled: true
        })
        const prefixOption = new SlashCommandOption()
            .setType("string")
            .setName("prefix")
            .setDescription("The new prefix.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(prefixOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const embeds = new Embeds(discord, message)
        if (!await perms.checkAdmin()) return

        if (!args[1]) return this.reply(`You must specify the new prefix ${discord.getEmoji("kannaCurious")}`)
        const newPrefix = args[1]

        await SQLQuery.updatePrefix(message, newPrefix)

        const prefixEmbed = embeds.createEmbed()
        prefixEmbed
        .setDescription(`The prefix has been changed to ${newPrefix}\n If you ever forget the prefix just tag me!`)
        return this.reply(prefixEmbed)
    }
}
