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
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {SQLQuery} from "../../structures/SQLQuery"

export default class Order extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Orders the rows in the guilds table.",
            help:
            `
            \`order\` - Order rows
            `,
            examples:
            `
            \`=>order\`
            `,
            aliases: [],
            cooldown: 3,
            botdev: true,
            subcommandEnabled: true
        })
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const embeds = new Embeds(discord, message)
        if (!perms.checkBotDev()) return
        const orderEmbed = embeds.createEmbed()

        await SQLQuery.orderTables()
        orderEmbed
        .setTitle(`**Order** ${discord.getEmoji("gabStare")}`)
        .setDescription("The table was ordered!")
        this.reply(orderEmbed)
    }
}
