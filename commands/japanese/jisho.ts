 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import axios from "axios"
import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import Kuroshiro from "kuroshiro"
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji"

export default class Jisho extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for a word or kanji on jisho.",
            help:
            `
            \`jisho word\` - Searches for the word
            `,
            examples:
            `
            \`=>jisho cute\`
            `,
            aliases: ["kanji"],
            random: "string",
            cooldown: 5,
            subcommandEnabled: true
        })
        const wordOption = new SlashCommandOption()
            .setType("string")
            .setName("word")
            .setDescription("Word to search.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(wordOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
        const kuroshiro = new Kuroshiro()
        await kuroshiro.init(new KuromojiAnalyzer())
        let query = Functions.combineArgs(args, 1).trim()
        if (!query) {
            return this.noQuery(embeds.createEmbed()
            .setAuthor({name: "jisho", iconURL: "https://kisaragi.moe/assets/embed/jisho.png"})
            .setTitle(`**Jisho Lookup** ${discord.getEmoji("kannaBear")}`))
        }

        if (query.match(/jisho.org/)) {
            query = query.replace("https://jisho.org/search/", "").replace(/%20/g, " ")
        }
        const result = await axios.get(`https://jisho.org/api/v1/search/words?keyword=${query}`, {headers}).then((r) => r.data.data)
        if (!result[0]) {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "jisho", iconURL: "https://kisaragi.moe/assets/embed/jisho.png"})
            .setTitle(`**Jisho Lookup** ${discord.getEmoji("kannaBear")}`))
        }
        const jishoArray: EmbedBuilder[] = []
        for (let i = 0; i < result.length; i++) {
            const common = result[i].is_common
            let description = ""
            for (let j = 0; j < result[i].japanese.length; j++) {
                if (!result[i].japanese[j] || !result[i].senses[j]) break
                const rawRom = await kuroshiro.convert(result[i].japanese[j].reading, {mode: "spaced", to: "romaji"})
                const romaji = rawRom.replace(/<\/?[^>]+(>|$)/g, "")
                description += `${discord.getEmoji("star")}_Word:_ **${result[i].japanese[j].word ?? result[i].japanese[j].reading ?? "None"}**\n` +
                `${discord.getEmoji("star")}_Reading:_ **${result[i].japanese[j].reading}** (${romaji})\n` +
                `${discord.getEmoji("star")}_Meaning:_ ${result[i].senses[j].english_definitions.join(", ") ?? "None"}\n` +
                `${discord.getEmoji("star")}_Tags:_ ${result[i].senses[j].tags[0] ? result[i].senses[j].tags[0] : "None"}\n`
            }
            const jishoEmbed = embeds.createEmbed()
            jishoEmbed
            .setAuthor({name: "jisho", iconURL: "https://kisaragi.moe/assets/embed/jisho.png"})
            .setTitle(`**Jisho Lookup** ${discord.getEmoji("kannaBear")}`)
            .setURL(`https://jisho.org/search/${query}`)
            .setDescription(
                `${discord.getEmoji("star")}_Common:_ **${common ? "Yes" : "No"}**\n` +
                `${discord.getEmoji("star")}_JLPT Level:_ **${result[i].jlpt[0] ? result[i].jlpt?.map((j: string) => j.replace("jlpt-", "").toUpperCase()).join(", ") : "None"}**\n` +
                Functions.checkChar(description, 1500, "\n")
            )
            jishoArray.push(jishoEmbed)
        }

        if (jishoArray.length === 1) {
            this.reply(jishoArray[0])
        } else {
            embeds.createReactionEmbed(jishoArray)
        }
    }
}
