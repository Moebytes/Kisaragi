/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, Role} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Mention extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Mentions any role, then sets it to unmentionable.",
            help:
            `
            \`mention @role\` - Mentions the role, and then makes it unmentionable.
            `,
            examples:
            `
            \`=>mention @news\`
            `,
            guildOnly: true,
            cachedGuildOnly: true,
            aliases: [],
            cooldown: 5,
            subcommandEnabled: true
        })
        const roleOption = new SlashCommandOption()
            .setType("string")
            .setName("role")
            .setDescription("Role to mention")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(roleOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const embeds = new Embeds(discord, message)
        if (!await perms.checkAdmin()) return
        if (!message.channel.isSendable()) return
        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)
        const mentionEmbed = embeds.createEmbed()
        const prefix = await SQLQuery.fetchPrefix(message)

        const input = Functions.combineArgs(args, 1)
        if (!input) return message.reply(`What role do you want me to mention ${discord.getEmoji("kannaCurious")}`)
        const role = message.guild!.roles.cache.find((r: Role) => r.name.toLowerCase().includes(input.toLowerCase().trim()))
        if (!role) {
            return this.reply(mentionEmbed
            .setDescription("Could not find that role!"))
        }
        try {
            await role.setMentionable(true)
            await this.reply(`<@&${role.id}>`, undefined, {allowedMentions: {parse: ["roles", "users"]}})
            await role.setMentionable(false)
        } catch {
            return this.reply("Could not mention this role, I need the **Manage Roles** permission.")
        }

        if (message.content?.startsWith(prefix[0])) await Functions.deferDelete(message, 0)
    }
}
