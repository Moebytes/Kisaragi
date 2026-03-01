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
import kaomoji from "kaomojilib"

export default class Kaomoji extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Posts a kawaii emoji.",
            help:
            `
            \`kaomoji\` - Gets a random kaomoji.
            \`kaomoji query\` - Searches for a kaomoji with the query.
            `,
            examples:
            `
            \`=>kaomoji\`
            \`=>kaomoji kawaii\`
            `,
            aliases: ["kmoji"],
            random: "none",
            cooldown: 3,
            subcommandEnabled: true
        })
        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("The query to search for a kaomoji.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(queryOption)
    }

    public run = async (args: string[]) => {
        const message = this.message
        const lib: any = []
        const keys = Object.keys(kaomoji.library)
        for (let i = 0, n = keys.length; i < n; i++) {
            const key  = keys[i]
            lib[i] = kaomoji.library[key]
        }
        if (!args[1]) {
            const random = Math.floor(Math.random() * lib.length)
            message.reply(lib[random].icon)
            return
        }
        const query = Functions.combineArgs(args, 1)
        for (let i = 0; i < lib.length; i++) {
            for (let j = 0;  j < lib[i].keywords.length; j++) {
                if (query.toLowerCase().trim() === lib[i].keywords[j].toLowerCase()) {
                    message.reply(lib[i].icon)
                    return
                }
            }
        }
        return this.reply("No kaomoji were found.")
    }
}
