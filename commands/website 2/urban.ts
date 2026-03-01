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
import {Permission} from "./../../structures/Permission"

const urban = require("urban.js")
export default class Urban extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for words on urban dictionary.",
            help:
            `
            \`urban\` - Posts a random word
            \`urban word\` - Searches for a word in the dictionary
            `,
            examples:
            `
            \`=>urban\`
            \`=>urban anime\`
            `,
            aliases: [],
            random: "none",
            cooldown: 5,
            defer: true,
            subcommandEnabled: true
        })
        const wordOption = new SlashCommandOption()
            .setType("string")
            .setName("word")
            .setDescription("The word to search.")

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
        if (!perms.checkNSFW()) return
        const urbanEmbed = embeds.createEmbed()

        if (args[1]) {
            let word = args[1]
            if (args[1].match(/urbandictionary.com/)) {
                word = args[1].match(/(?<=\/)(?:.(?!\/))+$/)![0].replace("define.php?term=", "")
            }
            const result = await urban(word)
            const cleanDef = result.definition.replace(/(\[|\])/g, "").replace(/(\r\n|\n|\r)/gm, "")
            const cleanExample = result.example.replace(/(\[|\])/g, "").replace(/(\r\n|\n|\r)/gm, "")
            const checkedExample = Functions.checkChar(cleanExample, 1700, ".")
            urbanEmbed
            .setAuthor({name: "Urban Dictionary", iconURL: "https://kisaragi.moe/assets/embed/urban.png", url: "https://www.urbandictionary.com/"})
            .setURL(result.URL)
            .setTitle(`**Urban Dictionary** ${discord.getEmoji("smugFace")}`)
            .setDescription(
            `${discord.getEmoji("star")}**Word**: ${result.word}\n` +
            `${discord.getEmoji("star")}**Author**: ${result.author ? result.author : "None"}\n` +
            `${discord.getEmoji("star")}${discord.getEmoji("thumbsUp")} ${result.thumbsUp} ${discord.getEmoji("thumbsDown")} ${result.thumbsDown}\n` +
            `${discord.getEmoji("star")}**Definition**: ${cleanDef ? cleanDef : "None"}\n` +
            `${discord.getEmoji("star")}**Example**: ${checkedExample ? checkedExample : "None"}`
            )
            .setThumbnail(message.author!.displayAvatarURL({extension: "png"}))
            return this.reply(urbanEmbed)
        }

        const result = await urban.random()
        const cleanDef = result.definition.replace(/(\[|\])/g, "").replace(/(\r\n|\n|\r)/gm, "")
        const cleanExample = result.example.replace(/(\[|\])/g, "").replace(/(\r\n|\n|\r)/gm, "")
        const checkedExample = Functions.checkChar(cleanExample, 1700, ".")
        urbanEmbed
            .setAuthor({name: "Urban Dictionary", iconURL: "https://kisaragi.moe/assets/embed/urban.png", url: "https://www.urbandictionary.com/"})
            .setURL(result.URL)
            .setTitle(`**Urban Dictionary** ${discord.getEmoji("smugFace")}`)
            .setDescription(
            `${discord.getEmoji("star")}**Word**: ${result.word}\n` +
            `${discord.getEmoji("star")}**Author**: ${result.author ? result.author : "None"}\n` +
            `${discord.getEmoji("star")}${discord.getEmoji("up")} ${result.thumbsUp} ${discord.getEmoji("down")} ${result.thumbsDown}\n` +
            `${discord.getEmoji("star")}**Definition**: ${cleanDef ? cleanDef : "None"}\n` +
            `${discord.getEmoji("star")}**Example**: ${checkedExample ? checkedExample : "None"}`
            )
            .setThumbnail(message.author!.displayAvatarURL({extension: "png"}))
        return this.reply(urbanEmbed)
    }
}
