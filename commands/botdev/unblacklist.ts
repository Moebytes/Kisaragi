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

export default class Unblacklist extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Unblacklists a user or guild.",
            help:
            `
            \`unblacklist id\` - Unblacklists a guild (the default).
            \`unblacklist user id reason?\` Unblacklists a user. Reason is sent in dms.
            \`unblacklist guild id\` - Long form for unblacklisting guilds
            `,
            examples:
            `
            \`=>unblacklist <guild id>\`
            \`=>unblacklist user <user id>\`
            `,
            aliases: [],
            cooldown: 3,
            botdev: true,
            subcommandEnabled: true
        })
        const reason2Option = new SlashCommandOption()
            .setType("string")
            .setName("reason2")
            .setDescription("Optional reason for user.")

        const reasonOption = new SlashCommandOption()
            .setType("string")
            .setName("reason")
            .setDescription("Can be a user/guild id.")

        const idOption = new SlashCommandOption()
            .setType("string")
            .setName("id")
            .setDescription("Can be an id/user/guild.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(idOption)
            .addOption(reasonOption)
            .addOption(reason2Option)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const sql = new SQLQuery(message)
        const embeds = new Embeds(discord, message)
        if (!perms.checkBotDev()) return
        const blacklistEmbed = embeds.createEmbed()
        blacklistEmbed
        .setAuthor({name: "unblacklist", iconURL: "https://kisaragi.moe/assets/embed/unblacklist.png"})
        .setTitle(`**Unblacklist** ${discord.getEmoji("tohruSmug")}`)
        let setGuild = true
        if (args[1] === "user") {
            args.shift()
            setGuild = false
        } else if (args[1] === "guild") {
            args.shift()
        }
        const id = args[1]
        const reason = Functions.combineArgs(args, 2) ? Functions.combineArgs(args, 2) : null
        if (!id) return this.reply("Who do you want to unblacklist...")
        if (setGuild) {
            const exists = await sql.fetchColumn("blacklist", "guild id", "guild id", id)
            if (exists) {
                await SQLQuery.deleteRow("blacklist", "guild id", id)
                return this.reply(blacklistEmbed.setDescription(`Unblacklisted the guild **${id}**!`))
            } else {
                return this.reply("This guild isn't blacklisted...")
            }
        } else {
            const exists = await sql.fetchColumn("blacklist", "user id", "user id", id)
            if (exists) {
                const user = await discord.users.fetch(id)
                await SQLQuery.deleteRow("blacklist", "user id", id)
                await discord.dmSend(user, blacklistEmbed.setDescription(`You were unblacklisted from Kisaragi Bot. Message from developer: **${reason ?? "None provided!"}**.`))
                return this.reply(blacklistEmbed.setDescription(`Unblacklisted the user **${user!.tag}**`))
            } else {
                return this.reply("This user isn't blacklisted...")
            }
        }
    }
}
