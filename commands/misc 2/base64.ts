 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Base64 as base64} from "js-base64"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Base64 extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Encodes or decodes a message using the base64 algorithm.",
            help:
            `
            \`base64 text\` - Encodes or decodes the text
            `,
            examples:
            `
            \`=>base64 some message\`
            `,
            aliases: ["b64"],
            cooldown: 3,
            subcommandEnabled: true
        })
        const textOption = new SlashCommandOption()
            .setType("string")
            .setName("text")
            .setDescription("The text to encode/decode.")
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
        if (!text) return message.reply(`What do you want to encode/decode ${discord.getEmoji("kannaCurious")}`)
        let result = ""

        if (text.match(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/gm)) {
            result = base64.decode(text)
        } else {
            result = base64.encode(text)
        }

        await this.reply(`**Base64 Conversion** ${discord.getEmoji("tohruThink")}`)
        return this.send(result)
    }
}
