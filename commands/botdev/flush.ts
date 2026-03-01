/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "../../structures/Embeds"
import {Kisaragi} from "../../structures/Kisaragi"
import {SQLQuery} from "../../structures/SQLQuery"

export default class Flush extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Flushes cached data.",
            help:
            `
            \`flush\` - Flushes the redis keys.
            \`flush embed\` - Flushes the cached embeds.
            \`flush pixiv\` - Flushes the pixiv embeds.
            `,
            examples:
            `
            \`=>flush\`
            `,
            aliases: [],
            cooldown: 3,
            botdev: true,
            subcommandEnabled: true
        })
        const optOption = new SlashCommandOption()
            .setType("string")
            .setName("opt")
            .setDescription("Can be embed/pixiv.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(optOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const embeds = new Embeds(discord, message)
        if (!perms.checkBotDev()) return
        const flushEmbed = embeds.createEmbed()
        let desc = ""
        if (args[1] === "embed") {
            await SQLQuery.purgeTable("collectors")
            desc = "Cached embeds were deleted!"
        } else if (args[1] === "pixiv") {
            await SQLQuery.purgeTable("pixiv")
            desc = "Pixiv embeds were deleted!"
        } else {
            await SQLQuery.flushDB()
            desc = "All redis keys were flushed!"
        }
        flushEmbed
        .setTitle(`**Flush** ${discord.getEmoji("gabStare")}`)
        .setDescription(desc)
        this.reply(flushEmbed)
    }
}
