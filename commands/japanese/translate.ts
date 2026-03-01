 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import langs from "../../assets/json/langs.json"
import {Command} from "../../structures/Command"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {translate} from "@vitalets/google-translate-api"

export default class Translate extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Translates text to another language.",
            help:
            `
            \`translate code text\` - Translates the text into the given language (2 letter code)
            \`translate text\` - Translates the text to english
            \`japanese text\` - Special alias for japanese translation
            `,
            examples:
            `
            \`=>translate ja translate this to japanese\`
            \`=>translate これを日本語に翻訳する\`
            \`=>japanese this will be translated to japanese\`
            `,
            aliases: ["tr", "trans", "japanese", "jp"],
            cooldown: 5,
            subcommandEnabled: true
        })
        const text2Option = new SlashCommandOption()
            .setType("string")
            .setName("text2")
            .setDescription("Text to translate after providing language code.")

        const textOption = new SlashCommandOption()
            .setType("string")
            .setName("text")
            .setDescription("Can be a language code or text (for english translation).")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(textOption)
            .addOption(text2Option)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message

        let translateText = Functions.combineArgs(args, 1)
        let code = "en"
        if (Object.keys(langs).includes(args[1])) {
            translateText = Functions.combineArgs(args, 2)
            code = args[1]
        } else if (args[0] === "japanese" || args[0] === "jp") {
            code = "ja"
        }

        const result = await translate(translateText, {to: code})
        await this.reply(`**Translated to ${langs[code]}** ${discord.getEmoji("kannaCurious")}\n${result.text}`)
    }
}
