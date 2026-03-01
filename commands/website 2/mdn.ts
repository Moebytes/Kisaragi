/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import axios from "axios"
import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class MDN extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches the mdn docs.",
            help:
            `
            \`mdn query\` - Searches mdn for the query
            \`mdn url\` - Searches the url
            `,
            examples:
            `
            \`=>mdn array\`
            `,
            aliases: ["jsref"],
            cooldown: 5,
            defer: true,
            subcommandEnabled: true
        })
        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("The query to search.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(queryOption)
    }

    public mdnReplace = (str: string) => {
        return str
        .replace(/Array/gm, "[**Array**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)")
        .replace(/Object/gm, "[**Object**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)")
        .replace(/Function/gm, "[**Function**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)")
        .replace(/Boolean/gm, "[**Boolean**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)")
        .replace(/Number/gm, "[**Number**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)")
        .replace(/String/gm, "[**String**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)")
        .replace(/Date/gm, "[**Date**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)")
        .replace(/RegExp/gm, "[**RegExp**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)")
        .replace(/Set/gm, "[**Set**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)")
        .replace(/JSON/gm, "[**JSON**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON)")
        .replace(/Promise/gm, "[**Promise**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)")
        .replace(/BigInt/gm, "[**BigInt**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)")
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
        let query = Functions.combineArgs(args, 1)
        if (!query) {
            return this.noQuery(embeds.createEmbed()
            .setTitle(`**MDN Search** ${discord.getEmoji("gabStare")}`)
            .setAuthor({name:`mdn`, iconURL: "https://kisaragi.moe/assets/embed/mdn.png", url: "https://developer.mozilla.org/en-US/"}))
        }

        if (query.match(/developer.mozilla.org/)) {
            query =  query.match(/(?<=\/)(?:.(?!\/))+$/)![0].replace(/_/g, " ")
        }
        const url = `https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/${query.trim()}/index.json`
        const result = await axios.get(url, {headers}).then((r) => r.data?.doc)
        const mdnEmbed = embeds.createEmbed()
        mdnEmbed
        .setTitle(`**${result.title}** ${discord.getEmoji("gabStare")}`)
        .setAuthor({name:`mdn`, iconURL: "https://kisaragi.moe/assets/embed/mdn.png", url: "https://developer.mozilla.org/en-US/"})
        .setThumbnail(message.author!.displayAvatarURL({extension: "png"}))
        .setURL(`https://developer.mozilla.org/${result.mdn_url}`)
        .setDescription(
        `${discord.getEmoji("star")}_Modified:_ ${Functions.formatDate(result.modified)}\n` +
        `${discord.getEmoji("star")}_Summary:_ ${Functions.cleanHTML(result.summary)}\n`
        )
        return this.reply(mdnEmbed)
    }
}
