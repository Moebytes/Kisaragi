 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Guild, Message, TextChannel} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {SQLQuery} from "../../structures/SQLQuery"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"

export default class LeaveGuild extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Forcefully leaves a guild.",
            help:
            `
            \`leaveguild id reason?\` - Leaves the guild
            \`leaveguild silent id\` - Leaves the guild without a reason
            `,
            examples:
            `
            \`=>leaveguild 123\`
            `,
            aliases: ["lg"],
            cooldown: 10,
            botdev: true,
            subcommandEnabled: true
        })
        const reasonOption = new SlashCommandOption()
            .setType("string")
            .setName("reason")
            .setDescription("Can be a reason/id.")

        const idOption = new SlashCommandOption()
            .setType("string")
            .setName("id")
            .setDescription("Can be an id/silent.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(idOption)
            .addOption(reasonOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const sql = new SQLQuery(message)
        const perms = new Permission(discord, message)
        if (!perms.checkBotDev()) return

        let guildID: string
        let silent = false
        if (args[1] === "silent") {
            guildID = args[2]
            silent = true
        } else {
            guildID = args[1]
        }
        const reason = Functions.combineArgs(args, 2)
        const guild = discord.guilds.cache.find((g: Guild) => g.id.toString() === guildID) as Guild
        if (!guild) return this.reply(`Not in this server ${discord.getEmoji("kannaFacepalm")}`)
        const name = guild.name

        if (!silent) {
            const msg = await discord.fetchFirstMessage(guild)
            await discord.send(msg!, `I am leaving this guild. Message from bot developer: **${reason ? reason : "None provided!"}**`)
        }

        await guild.leave()
        await SQLQuery.deleteGuild(guildID)
        await this.reply(`Left the guild **${name}**!`)
    }
}
