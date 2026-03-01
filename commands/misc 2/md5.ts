 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import md5 from "md5"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class MD5 extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Hashes a message using the md5 algorithm.",
            help:
            `
            \`md5 text\` - Hashes the text
            `,
            examples:
            `
            \`=>md5 secret password\`
            `,
            aliases: [],
            cooldown: 3,
            subcommandEnabled: true
        })
        const textOption = new SlashCommandOption()
            .setType("string")
            .setName("text")
            .setDescription("The text to hash.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(textOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)

        const text = Functions.combineArgs(args, 1).trim()
        if (!text) return this.reply(`What do you want to hash ${discord.getEmoji("kannaCurious")}`)

        const hash = md5(text)
        await this.reply(`**MD5 Hash** ${discord.getEmoji("kannaCurious")}`)
        return this.send(hash)
    }
}
