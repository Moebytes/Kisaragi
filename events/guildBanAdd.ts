/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Guild, GuildAuditLogsEntry, AuditLogEvent, TextChannel, User, GuildBan} from "discord.js"
import {Embeds} from "./../structures/Embeds"
import {Kisaragi} from "./../structures/Kisaragi"
import {SQLQuery} from "./../structures/SQLQuery"

export default class GuildBanAdd {
    constructor(private readonly discord: Kisaragi) {}

    public run = async (ban: GuildBan) => {
        const discord = this.discord
        const message = await discord.fetchFirstMessage(ban.guild)
        const sql = new SQLQuery(message!)
        const embeds = new Embeds(discord, message!)

        const logBan = async (guild: Guild) => {
            const modLog = await sql.fetchColumn("guilds", "mod log")
            if (modLog) {
                const modChannel = guild?.channels.cache.get(modLog)! as TextChannel
                const log = await guild.fetchAuditLogs({type: AuditLogEvent.MemberBanAdd, limit: 1}).then((l) => l.entries.first())
                .catch(async () => {
                    return this.discord.channelSend(modChannel, `I need the **View Audit Logs** permission in order to log guild bans.`).catch(() => null)
                }) as GuildAuditLogsEntry
                if (!log) return
                const data = {type: "ban", user: (log.target as User).id, executor: log.executor?.id, date: Date.now(), guild: guild.id, reason: log.reason}
                discord.emit("caseUpdate", data)
            }
        }
        logBan(ban.guild)
    }
}
