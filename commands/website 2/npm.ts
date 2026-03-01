 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

const npm = require("libnpmsearch")

export default class NPM extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for packages on the npm registry.",
            help:
            `
            \`npm query\` - Searches for packages with the query
            `,
            examples:
            `
            \`=>npm pixiv.ts\`
            `,
            aliases: [],
            random: "string",
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

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        let query = Functions.combineArgs(args, 1)
        if (!query) {
            return this.noQuery(embeds.createEmbed()
            .setTitle(`**NPM Search** ${discord.getEmoji("gabStare")}`)
            .setAuthor({name: `npm`, iconURL: "https://kisaragi.moe/assets/embed/npm.png", url: "https://www.npmjs.com/"}))
        }
        if (query.match(/npmjs.com/)) {
            query = query.match(/(?<=\/)(?:.(?!\/))+$/)![0].replace("search?q=", "")
        }
        const result = await npm(query, {sortBy: "popularity"})
        const npmArray: EmbedBuilder[] = []
        for (let i = 0; i < result.length; i++) {
            const npmEmbed = embeds.createEmbed()
            const keywords = result[i].keywords ? result[i].keywords.join(", ") : "None"
            npmEmbed
            .setTitle(`**${result[i].name}** ${discord.getEmoji("gabStare")}`)
            .setURL(result[i].links ? result[i].links.npm : "None")
            .setAuthor({name: `npm`, iconURL: "https://kisaragi.moe/assets/embed/npm.png", url: "https://www.npmjs.com/"})
            .setThumbnail(`https://i.imgur.com/CJ70ktz.png`)
            .setDescription(
            `${discord.getEmoji("star")}_Version:_ **${result[i].version}**\n` +
            `${discord.getEmoji("star")}_Publisher:_ ${result[i].publisher.username}\n` +
            // `${discord.getEmoji("star")}_Email:_ ${result[i].publisher.email}\n` +
            `${discord.getEmoji("star")}_Date:_ ${Functions.formatDate(result[i].date)}\n` +
            `${discord.getEmoji("star")}_Repository:_ ${result[i].links.repository ? result[i].links.repository : "None"}\n` +
            `${discord.getEmoji("star")}_Description:_ ${result[i].description ? result[i].description : "None"}\n` +
            `${discord.getEmoji("star")}_Keywords:_ ${Functions.checkChar(keywords, 1000, ",")}\n`
            )
            npmArray.push(npmEmbed)
        }
        if (npmArray.length > 1) {
            return embeds.createReactionEmbed(npmArray)
        } else {
            return this.reply(npmArray[0])
        }
    }
}
