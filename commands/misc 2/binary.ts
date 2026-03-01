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

export default class Binary extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Converts to and from binary.",
            help:
            `
            \`binary text/binary string\` - Converts the text to binary, or back to text.
            `,
            examples:
            `
            \`=>binary hello world\`
            `,
            aliases: ["bin"],
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

    public fromBinary = (bin: string) => {
        const textArray: string[] = []
        for (let i = 0; i < bin.length; i+=8) {
            const ascii = parseInt(bin.slice(i, i+8), 2).toString(10)
            textArray.push(String.fromCharCode(Number(ascii)))
        }
        return textArray.join("")
    }

    public toBinary = (text: string) => {
        const binaryArray: string[] = []
        for (let i = 0; i < text.length; i++) {
            binaryArray.push(text[i].charCodeAt(0).toString(2).padStart(8, "0"))
        }
        return binaryArray.join("")
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)

        const input = Functions.combineArgs(args, 1).trim()
        if (!input) return message.reply(`What do you want to encode/decode ${discord.getEmoji("kannaCurious")}`)

        if (!input.match(/^[01]+$/gm)?.[0]) {
            await this.reply(`**Binary Conversion** ${discord.getEmoji("think")}`)
            return this.send(this.toBinary(input))
        } else {
            await this.reply(`**Binary Conversion** ${discord.getEmoji("think")}`)
            return this.send(this.fromBinary(input))
        }

    }
}
