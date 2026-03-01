/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Kisaragi} from "./../../structures/Kisaragi"
import lenny from "lenny"

export default class Lenny extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Posts a lenny emoji.",
            help:
            `
            \`lenny\` - Posts a lenny emoji.
            \`lenny face/shrug/tableflip/unflip\` - Posts one of these popular faces.
            \`lenny query\` - Searches for a lenny emoji with the query.
            `,
            examples:
            `
            \`=>lenny\`
            \`=>lenny face\`
            \`=>lenny shrug\`
            `,
            aliases: [],
            random: "none",
            cooldown: 3,
            subcommandEnabled: true
        })
        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("Set to face/shrug/tableflip/unflip for the popular faces or search for something else.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(queryOption)
    }

    public run = async (args: string[]) => {
        const message = this.message

        if (args[1] === "face") {
            this.reply("( ͡° ͜ʖ ͡°)")
        } else if (args[1] === "shrug") {
            this.reply("¯\\_(ツ)_/¯")
        } else if (args[1] === "tableflip") {
            this.reply("(╯°□°）╯︵ ┻━┻")
        } else if (args[1] === "unflip") {
            this.reply("┬─┬ ノ( ゜-゜ノ)")
        } else {
            this.reply(lenny())
        }
        return
    }
}
