 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Guild, GuildAuditLogsEntry, GuildMember, PartialGuildMember, Message, Role, TextChannel, User} from "discord.js"
import ascii from "fold-to-ascii"
import {Embeds} from "../structures/Embeds"
import {Functions} from "../structures/Functions"
import {Kisaragi} from "../structures/Kisaragi"
import {SQLQuery} from "../structures/SQLQuery"

export default class GuildMemberUpdate {
    constructor(private readonly discord: Kisaragi) {}

    public run = async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
        const discord = this.discord
        const message = await discord.fetchFirstMessage(newMember.guild)
        if (!message) return
        const sql = new SQLQuery(message)
        const embeds = new Embeds(discord, message)

        let [setNick, setNewRole, setRemoveRole] = [false, false, false]

        if (oldMember.displayName !== newMember.displayName) setNick = true
        if (oldMember.roles.cache.size < newMember.roles.cache.size) setNewRole = true
        if (oldMember.roles.cache.size > newMember.roles.cache.size) setRemoveRole = true

        const logNick = async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
            const memberLog = await sql.fetchColumn("guilds", "member log")
            if (memberLog) {
                const memberChannel = newMember.guild?.channels.cache.get(memberLog)! as TextChannel
                const logEmbed = embeds.createEmbed()
                logEmbed
                .setAuthor({name: "nickname", iconURL: "https://cdn.discordapp.com/emojis/589154620845195275.png"})
                .setTitle(`**Nickname Change** ${discord.getEmoji("chinoSmug")}`)
                .setThumbnail(newMember.displayAvatarURL({extension: "png"}) || null)
                .setDescription(
                    `${discord.getEmoji("star")}_User:_ **<@!${newMember.id}> (${newMember.user.tag})**\n` +
                    `${discord.getEmoji("star")}_User ID:_ \`${newMember.id}\`\n` +
                    `${discord.getEmoji("star")}_Old Nickname:_ **${oldMember.displayName}**\n` +
                    `${discord.getEmoji("star")}_New Nickname:_ **$newMember.displayName}**\n`
                )
                .setFooter({text: `${newMember.guild.name} • ${Functions.formatDate(new Date())}`, iconURL: newMember.guild.iconURL({extension: "png"}) ?? ""})
                await this.discord.channelSend(memberChannel, logEmbed).catch(() => null)
            }
        }
        if (setNick) logNick(oldMember, newMember)

        const logNewRole = async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
            const memberLog = await sql.fetchColumn("guilds", "member log")
            if (memberLog) {
                const newRole = newMember.roles.cache.find((r) => {
                    if (oldMember.roles.cache.has(r.id)) {
                        return false
                    } else {
                        return true
                    }
                }) as Role
                const memberChannel = newMember.guild?.channels.cache.get(memberLog)! as TextChannel
                const logEmbed = embeds.createEmbed()
                logEmbed
                .setAuthor({name: "new role", iconURL: "https://cdn.discordapp.com/emojis/682967153200070690.png"})
                .setTitle(`**Role Addition** ${discord.getEmoji("tohruThink")}`)
                .setThumbnail(newMember.displayAvatarURL({extension: "png"}) || null)
                .setDescription(
                    `${discord.getEmoji("star")}_User:_ **<@!${newMember.id}> (${newMember.user.tag})**\n` +
                    `${discord.getEmoji("star")}_User ID:_ \`${newMember.id}\`\n` +
                    `${discord.getEmoji("star")}_New Role:_ <@&${newRole.id}>\n` +
                    `${discord.getEmoji("star")}_Roles:_ **${newMember.roles.cache.size - 1}**`
                )
                .setFooter({text: `${newMember.guild.name} • ${Functions.formatDate(new Date())}`, iconURL: newMember.guild.iconURL({extension: "png"}) ?? ""})
                await this.discord.channelSend(memberChannel, logEmbed).catch(() => null)
            }
        }
        if (setNewRole) logNewRole(oldMember, newMember)

        const logRoleRemoval = async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
            const memberLog = await sql.fetchColumn("guilds", "member log")
            if (memberLog) {
                const oldRole = oldMember.roles.cache.find((r) => {
                    if (newMember.roles.cache.has(r.id)) {
                        return false
                    } else {
                        return true
                    }
                }) as Role
                const memberChannel = newMember.guild?.channels.cache.get(memberLog)! as TextChannel
                const logEmbed = embeds.createEmbed()
                logEmbed
                .setAuthor({name: "remove role", iconURL: "https://cdn.discordapp.com/emojis/589239465348694017.png"})
                .setTitle(`**Role Removal** ${discord.getEmoji("raphi")}`)
                .setThumbnail(newMember.displayAvatarURL({extension: "png"}) || null)
                .setDescription(
                    `${discord.getEmoji("star")}_User:_ **<@!${newMember.id}> (${newMember.user.tag})**\n` +
                    `${discord.getEmoji("star")}_User ID:_ \`${newMember.id}\`\n` +
                    `${discord.getEmoji("star")}_Removed Role:_ <@&${oldRole.id}>\n` +
                    `${discord.getEmoji("star")}_Roles:_ **${newMember.roles.cache.size - 1}**`
                )
                .setFooter({text: `${newMember.guild.name} • ${Functions.formatDate(new Date())}`, iconURL: newMember.guild.iconURL({extension: "png"}) ?? ""})
                await this.discord.channelSend(memberChannel, logEmbed).catch(() => null)
            }
        }
        if (setRemoveRole) logRoleRemoval(oldMember, newMember)

        const asciiNames = async (member: GuildMember) => {
            const toggle = await sql.fetchColumn("guilds", "ascii name toggle")
            if (!toggle || toggle === "off") return
            if (member.displayName.match(/[^\x00-\x7F]/g)) {
                let newName = ascii.foldReplacing(member.displayName).trim()
                if (!newName) newName = "User"
                await member.setNickname(newName, "Non-ascii characters in name").catch(() => null)
            }
        }
        if (setNick) asciiNames(newMember)
    }
}
