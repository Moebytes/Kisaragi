 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {TextChannel, VoiceState} from "discord.js"
import {getVoiceConnection} from "@discordjs/voice"
import {Audio} from "./../structures/Audio"
import {Kisaragi} from "./../structures/Kisaragi"
import {SQLQuery} from "./../structures/SQLQuery"

export default class VoiceStateUpdate {
    constructor(private readonly discord: Kisaragi) {}

    public run = async (oldState: VoiceState, newState: VoiceState) => {
        const msg = await this.discord.fetchFirstMessage(newState.guild)
        if (!msg) return
        const sql = new SQLQuery(msg)
        const leaveVoiceChannel = async () => {
            const connection = getVoiceConnection(newState.guild.id)
            const listening = newState.channel?.members.filter((m) => {
                if (m.user.bot) {
                    return false
                } else if (m.voice.deaf) {
                    return false
                } else {
                    return true
                }
            })
            if (connection && !newState.channel && !listening?.size) {
                const msg = await this.discord.fetchFirstMessage(newState.guild)
                const audio = new Audio(this.discord, msg!)
                audio.deleteQueue()
                await sql.updateColumn("guilds", "voice", "off")
                try {
                    connection.disconnect()
                    connection.destroy()
                } catch {
                    // ignore
                }
            }
        }
        leaveVoiceChannel()

        const linkedChannel = async () => {
            const linked = await sql.fetchColumn("guilds", "linked")
            if (!linked || oldState.channelId === newState.channelId) return
            for (let i = 0; i < linked.length; i++) {
                const curr = JSON.parse(linked[i])
                if (!curr.state || curr.state === "off") continue
                const chan = newState.guild.channels.cache.get(curr.text) as TextChannel
                if (!chan) continue
                if (newState.channelId === curr.voice) {
                    await chan.permissionOverwrites.create(newState.member!.id, {ViewChannel: true, SendMessages: true}, {reason: "Linked channel"}).catch(() => null)
                } else if (oldState.channelId === curr.voice) {
                    const overwrite = chan.permissionOverwrites.cache.find((o) => o.id === oldState.member?.id)
                    await overwrite?.delete().catch(() => null)
                }
            }
        }
        linkedChannel()
    }
}