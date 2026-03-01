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

export default class Blacklist extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Blacklists a user or entire guild.",
            help:
            `
            \`blacklist id reason?\` - Blacklists a guild (the default).
            \`blacklist user id reason?\` Blacklists a user.
            \`blacklist guild id reason?\` - Long form for blacklisting guilds
            `,
            examples:
            `
            \`=>blacklist <guild id>\`
            \`=>blacklist user <user id>\`
            `,
            aliases: [],
            cooldown: 3,
            botdev: true,
            subcommandEnabled: true
        })
        const reason2Option = new SlashCommandOption()
            .setType("string")
            .setName("reason2")
            .setDescription("Last chance to type reason.")

        const reasonOption = new SlashCommandOption()
            .setType("string")
            .setName("reason")
            .setDescription("Can be a reason or id.")

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
        .setAuthor({name: "blacklist", iconURL: "https://kisaragi.moe/assets/embed/blacklist.png"})
        .setTitle(`**Blacklist** ${discord.getEmoji("smugFace")}`)
        let setGuild = true
        if (args[1] === "user") {
            args.shift()
            setGuild = false
        } else if (args[1] === "guild") {
            args.shift()
        }
        const id = args[1]
        const reason = Functions.combineArgs(args, 2) ? Functions.combineArgs(args, 2) : null
        if (!id) return this.reply("Who do you want to blacklist...")
        if (setGuild) {
            const exists = await sql.fetchColumn("blacklist", "guild id", "guild id", id)
            if (exists) {
                return this.reply("Guild is already blacklisted!")
            } else {
                const guild = discord.guilds.cache.get(id)
                await SQLQuery.insertInto("blacklist", "guild id", id)
                const msg = await discord.fetchFirstMessage(guild)
                if (msg) await discord.send(msg, blacklistEmbed.setDescription(`Your guild has been blacklisted, and you will no longer be able to add me onto it. Message from developer: **${reason ?? "None provided!"}**`))
                await guild?.leave()
                return this.reply(blacklistEmbed.setDescription(`Blacklisted the guild **${guild?.name ?? id}**!`))
            }
        } else {
            const exists = await sql.fetchColumn("blacklist", "user id", "user id", id)
            if (exists) {
                return message.reply("User is already blacklisted!")
            } else {
                const user = await discord.users.fetch(id)
                if (!user) return message.reply("Invalid user id!")
                await SQLQuery.insertInto("blacklist", "user id", id)
                await discord.dmSend(user, blacklistEmbed.setDescription(`You have been blacklisted, and you will no longer be able use Kisaragi bot. Message from developer: **${reason ?? "None provided!"}**`))
                return this.reply(blacklistEmbed.setDescription(`Blacklisted the user **${user.tag}**!`))
            }
        }
    }
}
