 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Guild, GuildAuditLogsEntry, AuditLogEvent, GuildBan, TextChannel, User} from "discord.js"
import {Embeds} from "./../structures/Embeds"
import {Functions} from "./../structures/Functions"
import {Kisaragi} from "./../structures/Kisaragi"
import {SQLQuery} from "./../structures/SQLQuery"

export default class GuildBanRemove {
    constructor(private readonly discord: Kisaragi) {}

    public run = async (ban: GuildBan) => {
        const discord = this.discord
        const message = await discord.fetchFirstMessage(ban.guild)
        if (!message) return
        const sql = new SQLQuery(message)
        const embeds = new Embeds(discord, message)

        const logUnban = async (guild: Guild) => {
            const modLog = await sql.fetchColumn("guilds", "mod log")
            if (modLog) {
                const modChannel = guild?.channels.cache.get(modLog)! as TextChannel
                const log = await guild.fetchAuditLogs({type: AuditLogEvent.MemberBanRemove, limit: 1}).then((l) => l.entries.first())
                .catch(async () => {
                    return this.discord.channelSend(modChannel, `I need the **View Audit Logs** permission in order to log guild bans.`).catch(() => null) 
                }) as GuildAuditLogsEntry
                if (!log) return
                const data = {type: "unban", user: (log.target as User).id, executor: log.executor?.id, date: Date.now(), guild: guild.id, reason: log.reason}
                discord.emit("caseUpdate", data)
            }
        }
        logUnban(ban.guild)
    }
}
