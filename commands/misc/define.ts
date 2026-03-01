 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {CollegiateDictionary} from "mw-dict"

export default class Define extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Retrieves the definition of a word from merriam webster.",
            help:
            `
            \`define word\` - Gets the definition of the word
            `,
            examples:
            `
            \`=>define energy\`
            `,
            aliases: ["def", "definition", "word", "dictionary"],
            random: "string",
            cooldown: 10,
            subcommandEnabled: true
        })
        const wordOption = new SlashCommandOption()
            .setType("string")
            .setName("word")
            .setDescription("The word to define.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(wordOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        if (discord.checkMuted(message)) if (!perms.checkNSFW()) return
        const dictionary = new CollegiateDictionary(process.env.DICTIONARY_API_KEY)
        let word = Functions.combineArgs(args, 1)
        if (!word) {
            return this.noQuery(embeds.createEmbed()
            .setAuthor({name: "merriam webster", iconURL: "https://kisaragi.moe/assets/embed/define.png"})
            .setTitle(`**Dictionary** ${discord.getEmoji("raphi")}`))
        }

        if (word.match(/merriam-webster.com/)) {
            word = word.replace("https://www.merriam-webster.com/dictionary/", "").replace(/%20/g, " ")
        }
        const defineEmbed = embeds.createEmbed()
        let result
        try {
            result = await dictionary.lookup(word.trim())
        } catch (error: any) {
            defineEmbed
            .setAuthor({name: "merriam webster", iconURL: "https://kisaragi.moe/assets/embed/define.png"})
            .setTitle(`**Dictionary** ${discord.getEmoji("raphi")}`)
            .setDescription(`No definitions were found. Here are some word suggestions: \n${error.suggestions.join(", ")}`)
            return this.reply(defineEmbed)
        }
        const definArray: string[] = []
        const exampleArray: string[] = []
        for (const i in result[0].definition) {
            if (result[0].definition[i].senses) {
                const meaningArray: string[] = []
                if (result[0].definition[i].senses?.join("")) {
                    for (const j in result[0].definition[i].senses[0].meanings) {
                        if (result[0].definition[i].senses[0].meanings[j] === ":") {
                            if (result[0].definition[i].senses[0].synonyms) {
                                meaningArray.push(result[0].definition[i].senses[0].synonyms.join(" "))
                            } else {
                                meaningArray.push("")
                            }
                        } else {
                            meaningArray.push(result[0].definition[i].senses[0].meanings[j])
                        }
                    }
                    definArray.push(meaningArray.join("\n"))
                    exampleArray.push(result[0].definition[i].senses[0].illustrations ? result[0].definition[i].senses[0].illustrations[0] : "")
                } else {
                    definArray.push(result[0].definition[i].meanings.join("\n"))
                }
            } else {
                if (result[0].definition[i].meanings?.join("").trim() === ":") {
                    definArray.push("")
                } else {
                    definArray.push(result[0].definition[i].meanings.join("\n"))
                }
                exampleArray.push(result[0].definition[i].illustrations ? result[0].definition[i].illustrations[0] : "")
            }
        }
        let definitions = ""
        for (let i = 0; i < definArray.length; i++) {
            if (definArray[i]) {
                definitions += `${discord.getEmoji("star")}_Definition:_ ${definArray[i]}\n`
            }
            if (exampleArray[i]) {
                definitions += `${discord.getEmoji("star")}_Example:_ ${exampleArray[i]}\n`
            }
        }
        defineEmbed
        .setAuthor({name: "merriam webster", iconURL: "https://kisaragi.moe/assets/embed/define.png"})
        .setTitle(`**Word Lookup** ${discord.getEmoji("raphi")}`)
        .setURL(`https://www.merriam-webster.com/dictionary/${result[0].word.replace(/ /g, "_")}`)
        .setThumbnail(message.author!.displayAvatarURL({extension: "png"}))
        .setDescription(
            `${discord.getEmoji("star")}_Word:_ **${result[0].word}**\n` +
            `${discord.getEmoji("star")}_Function:_ **${result[0].functional_label}**\n` +
            `${discord.getEmoji("star")}_Popularity:_ **${result[0].popularity}**\n` +
            `${discord.getEmoji("star")}_Etymology:_ ${result[0].etymology ? result[0].etymology : "None"}\n` +
            `${Functions.checkChar(definitions, 2000, ".")}\n`
        )
        this.reply(defineEmbed)
    }
}
