/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class ReverseText extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Reverses your message.",
            help:
            `
            \`reversetext text\` - Sends the message in reverse.
            `,
            examples:
            `
            \`=>reversetext noon\`
            `,
            aliases: ["rtext", "rsay", "sayreverse"],
            cooldown: 3,
            subcommandEnabled: true
        })
        const textOption = new SlashCommandOption()
            .setType("string")
            .setName("text")
            .setDescription("The text to reverse.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(textOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message

        const text = Functions.combineArgs(args, 1)
        if (!text) return this.reply("You did not provide any text.")

        return this.reply(text.split("").reverse().join(""))
    }
}