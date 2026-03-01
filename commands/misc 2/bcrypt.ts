/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import bcrypt from "bcrypt"
import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Bcrypt extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Hashes a message using the bcrypt algorithm.",
            help:
            `
            \`bcrypt text\` - Hashes the text
            `,
            examples:
            `
            \`=>bcrypt password\`
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
        if (!text) return message.reply(`What do you want to hash ${discord.getEmoji("kannaCurious")}`)

        const hash = await bcrypt.hash(text, 10)
        await this.reply(`**Bcrypt Hash** ${discord.getEmoji("kaosWTF")}`)
        return this.send(hash)
    }
}
