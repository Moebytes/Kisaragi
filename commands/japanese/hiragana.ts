 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import Kuroshiro from "kuroshiro"
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji"

export default class Hiragana extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Converts japanese text to hiragana.",
            help:
            `
            \`hiragana text\` - Converts text to hiragana
            `,
            examples:
            `
            \`=>hiragana 艦隊これくしょん\`
            `,
            aliases: [],
            cooldown: 5,
            subcommandEnabled: true
        })
        const textOption = new SlashCommandOption()
            .setType("string")
            .setName("text")
            .setDescription("Text to convert to hiragana.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(textOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const kuroshiro = new Kuroshiro()
        await kuroshiro.init(new KuromojiAnalyzer())

        const input = Functions.combineArgs(args, 1)
        if (!input) {
            return this.noQuery(embeds.createEmbed()
            .setAuthor({name: "kuroshiro", iconURL: "https://kisaragi.moe/assets/embed/hiragana.png"})
            .setTitle(`**Hiragana Conversion** ${discord.getEmoji("aquaUp")}`))
        }
        const result = await kuroshiro.convert(input, {mode: "spaced", to: "hiragana"})
        const cleanResult = result.replace(/<\/?[^>]+(>|$)/g, "")

        await this.reply(`**Hiragana Conversion** ${discord.getEmoji("aquaUp")}\n${cleanResult}`)
    }
}
