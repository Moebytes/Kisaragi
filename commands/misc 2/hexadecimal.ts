/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Hexadecimal extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Converts a number to and from hexadecimal.",
            help:
            `
            _Note: Not all hexadecimal numbers contain letters, so add the param \`decode\` somewhere to explicitly convert from hex to decimal._
            \`hexadecimal number/hex string decode?\` - Converts decimal to hexadecimal or hexadecimal to decimal
            `,
            examples:
            `
            \`=>hexadecimal hi\`
            `,
            aliases: ["hex"],
            cooldown: 3,
            subcommandEnabled: true
        })
        const textOption = new SlashCommandOption()
            .setType("string")
            .setName("text")
            .setDescription("Hex or decimal number. Add decode to decode hex to decimal.")
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

        let text = Functions.combineArgs(args, 1).trim()
        if (!text) return message.reply(`What do you want to convert ${discord.getEmoji("kannaCurious")}`)
        let result = ""
        let setDecode  = false
        if (text.match(/decode/)) {
            text = text.replace("decode", "").trim()
            setDecode = true
        }

        if (Number.isNaN(Number(text)) || setDecode) {
            result = String(parseInt(text, 16))
        } else {
            result =  Number(text).toString(16)
        }

        await this.reply(`**Hexadecimal Conversion** ${discord.getEmoji("tohruThink")}`)
        return this.send(result)
    }
}
