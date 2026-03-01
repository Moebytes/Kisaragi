 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {GuildMember, Message, AttachmentBuilder, TextChannel} from "discord.js"
import {Embeds} from "../structures/Embeds"
import {Functions} from "./../structures/Functions"
import {Images} from "./../structures/Images"
import {Kisaragi} from "./../structures/Kisaragi"
import {SQLQuery} from "./../structures/SQLQuery"

export default class GuildMemberAdd {
    public discord: Kisaragi
    constructor(discord: Kisaragi) {
        this.discord = discord
    }

    public run = async (member: GuildMember) => {
        const discord = this.discord
        const firstMsg = await this.discord.fetchFirstMessage(member.guild)
        if (!firstMsg) return
        const sql = new SQLQuery(firstMsg)
        if (member.guild.members.me?.permissions.has("ManageGuild")) {
            const bans = await member.guild.bans.fetch()
            if (bans.has(member.id)) return
        }

        let defaultChannel = firstMsg?.channel as TextChannel
        const defChannel = await sql.fetchColumn("guilds", "default channel")
        if (defChannel) {
            defaultChannel = this.discord.channels.cache.find((c) => c.id.toString() === String(defChannel)) as TextChannel
        }

        const defMsg = defaultChannel ? await defaultChannel.messages.fetch({limit: 1}).then((m) => m.first()) as Message :
        await this.discord.fetchFirstMessage(member.guild) as Message

        const image = new Images(this.discord, defMsg)
        const embeds = new Embeds(this.discord, defMsg)

        const welcomeMessages = async () => {
            const welcomeToggle = await sql.fetchColumn("guilds", "welcome toggle")
            if (!(welcomeToggle === "on")) return

            const welcomeMsg = await sql.fetchColumn("guilds", "welcome message")
            const welcomeChannel = await sql.fetchColumn("guilds", "welcome channel")
            const welcomeImages = await sql.fetchColumn("guilds", "welcome bg images")
            const welcomeText = await sql.fetchColumn("guilds", "welcome bg text")
            const welcomeColor = await sql.fetchColumn("guilds", "welcome bg color")
            const welcomeBGToggle = await sql.fetchColumn("guilds", "welcome bg toggle")
            const channel = member.guild.channels.cache.find((c) => c.id.toString() === String(welcomeChannel)) as TextChannel

            const attachment = await image.createCanvas(member, welcomeImages, welcomeText, welcomeColor, false, false, welcomeBGToggle) as AttachmentBuilder

            const newMsg = String(welcomeMsg).replace(/user/g, `<@${member.user.id}>`).replace(/guild/g, member.guild.name)
            .replace(/tag/g, member.user.tag).replace(/name/g, member.displayName).replace(/count/g, member.guild.memberCount.toString())

            this.discord.channelSend(channel, newMsg, attachment)
        }

        welcomeMessages()

        const avatarBan = async (discord: Kisaragi) => {
            const banToggle = await sql.fetchColumn("guilds", "pfp ban toggle")
            const banEmbed = embeds.createEmbed()
            if (!(banToggle === "on")) return

            if (!member.user.avatarURL) {
                const channel = defaultChannel
                const reason = "Has the default discord avatar."
                banEmbed
                .setAuthor({name: "ban", iconURL: "https://kisaragi.moe/assets/embed/ban.png"})
                .setTitle(`**Member Banned** ${discord.getEmoji("kannaFU")}`)
                .setDescription(`${discord.getEmoji("star")}_Successfully banned <@${member.user.id}> for reason:_ **${reason}**`)
                if (channel) this.discord.channelSend(channel, banEmbed)
                banEmbed
                .setTitle(`**You Were Banned** ${discord.getEmoji("kannaFU")}`)
                .setDescription(`${discord.getEmoji("star")}_You were banned from ${member.guild.name} for reason:_ **${reason}**`)
                try {
                    await this.discord.dmSend(member.user, banEmbed)
                } catch (err) {
                    console.log(err)
                }
                await member.ban({reason})
            }
        }
        avatarBan(this.discord)

        const logJoin = async (member: GuildMember) => {
            const userLog = await sql.fetchColumn("guilds", "user log")
            if (userLog) {
                const joinChannel = member.guild?.channels.cache.get(userLog)! as TextChannel
                const joinEmbed = embeds.createEmbed()
                joinEmbed
                .setAuthor({name: "join", iconURL: "https://cdn.discordapp.com/emojis/588199024906207271.gif"})
                .setTitle(`**Member Join** ${discord.getEmoji("aquaUp")}`)
                .setThumbnail(member.displayAvatarURL({extension: "png"}) || null)
                .setDescription(
                    `${discord.getEmoji("star")}_Member:_ **<@!${member.id}> (${member.user.tag})**\n` +
                    `${discord.getEmoji("star")}_Member ID:_ \`${member.id}\`\n` +
                    `${discord.getEmoji("star")}_Bot Account:_ **${member.user.bot ? "Yes" : "No"}**\n` +
                    `${discord.getEmoji("star")}_Account Creation Date:_ **${Functions.formatDate(member.user.createdAt)}**\n` +
                    `${discord.getEmoji("star")}_Guild Members:_ **${member.guild.members.cache.size}**\n`
                )
                .setFooter({text: `${member.guild.name} • ${Functions.formatDate(member.joinedAt ?? new Date())}`, iconURL: member.guild.iconURL({extension: "png"}) ?? ""})
                await this.discord.channelSend(joinChannel, joinEmbed).catch(() => null)
            }
        }
        logJoin(member)
    }
}
