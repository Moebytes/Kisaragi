/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, SlashCommandSubcommandBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Letters} from "./../../structures/Letters"

export default class Emojify extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Converts text to emoji letters.",
            help:
            `
            \`emojify text\` - Converts the text to emoji letters.
            `,
            examples:
            `
            \`=>emojify kawaii\`
            `,
            aliases: [],
            cooldown: 3,
            subcommandEnabled: true
        })
        const textOption = new SlashCommandOption()
            .setType("string")
            .setName("text")
            .setDescription("Text to convert to emoji letters.")
            .setRequired(true)

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(textOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const letters = new Letters(discord)

        const text = Functions.combineArgs(args, 1)
        if (!text) return message.reply("You did not provide any text.")
        const emojiFied = letters.letters(text)
        return this.reply(`${emojiFied}`)
    }
}
