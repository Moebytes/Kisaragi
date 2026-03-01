 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, AttachmentBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import fs from "fs"
import path from "path"
import wiki from "wikijs"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "./../../structures/Permission"

const svg2img = require("svg2img")

export default class Wikipedia extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for wikipedia articles.",
            help:
            `
            \`wikipedia\` - Gets a random article
            \`wikipedia query\` - Searches for an article
            \`wikipedia url\` - Gets the article from the url
            `,
            examples:
            `
            \`=>wikipedia\`
            \`=>wikipedia anime\`
            `,
            aliases: ["w", "wiki"],
            random: "none",
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("Can be a query or url.")

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
        if (!perms.checkNSFW()) return

        const wikipedia = wiki()

        let title = [] as string[]
        if (!args[1]) {
            title = await wikipedia.random(1)
        } else {
            let query = Functions.combineArgs(args, 1)
            if (query.match(/en.wikipedia.org/)) {
                query = query.match(/(?<=\/)(?:.(?!\/))+$/)?.[0].replace(/_/g, " ")!
            }
            if (/hentai|porn|sex|penis|vagina|nsfw/.test(query)) {
                if (!perms.checkNSFW()) return
            }
            const result = await wikipedia.search(query, 1)
            title = result.results
        }

        const page = await wikipedia.page(title[0]) as any
        const summary = await page.summary()
        const mainImg = await page.mainImage()

        if (mainImg.slice(-3) === "svg") {
            await svg2img(mainImg, function(error: Error, buffer: Buffer) {
                    fs.writeFileSync(path.join(__dirname, "../../assets/misc/images/dump/wiki.png"), buffer)
            })
            await Functions.timeout(500)
            const attachment = new AttachmentBuilder(path.join(__dirname, "../../assets/misc/images/dump/wiki.png"))
            const wikiEmbed = embeds.createEmbed()
            wikiEmbed
            .setAuthor({name: "wikipedia", iconURL: "https://kisaragi.moe/assets/embed/wikipedia.png", url: "https://en.wikipedia.org/wiki/Main_Page"})
            .setTitle(`**Wikipedia Article** ${discord.getEmoji("raphi")}`)
            .setURL(page.raw.fullurl)
            .setImage(`attachment://wiki.png`)
            .setThumbnail("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTiFv5c96eAMFjLxlSiE9F5GYKgzrMBPlUygB9vZzOUetVipzIe")
            .setDescription(
                `${discord.getEmoji("star")}_Title:_ **${page.raw.title}**\n` +
                `${discord.getEmoji("star")}_Last Revision:_ **${Functions.formatDate(page.raw.touched)}**\n` +
                `${discord.getEmoji("star")}_Summary:_ ${Functions.checkChar(summary, 1800, ".")}\n`
            )
            return this.reply(wikiEmbed, attachment)
        } else {
            const wikiEmbed = embeds.createEmbed()
            wikiEmbed
            .setAuthor({name: "wikipedia", iconURL: "https://kisaragi.moe/assets/embed/wikipedia.png", url: "https://en.wikipedia.org/wiki/Main_Page"})
            .setTitle(`**Wikipedia Article** ${discord.getEmoji("raphi")}`)
            .setURL(page.raw.fullurl)
            .setImage(mainImg)
            .setThumbnail("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTiFv5c96eAMFjLxlSiE9F5GYKgzrMBPlUygB9vZzOUetVipzIe")
            .setDescription(
                `${discord.getEmoji("star")}_Title:_ **${page.raw.title}**\n` +
                `${discord.getEmoji("star")}_Last Revision:_ **${Functions.formatDate(page.raw.touched)}**\n` +
                `${discord.getEmoji("star")}_Summary:_ ${Functions.checkChar(summary, 1800, ".")}\n`
            )
            return this.reply(wikiEmbed)
        }
    }
}
