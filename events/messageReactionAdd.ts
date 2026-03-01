/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {EmbedBuilder, Message, MessageReaction, PartialMessageReaction, TextChannel, User, PartialUser} from "discord.js"
import {Embeds} from "../structures/Embeds"
import {Kisaragi} from "../structures/Kisaragi"
import {Functions} from "../structures/Functions"
import {SQLQuery} from "../structures/SQLQuery"
const active = new Set()

export default class MessageReactionAdd {
    constructor(private readonly discord: Kisaragi) {}

    public run = async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
        const discord = this.discord
        if (user.id === discord.user!.id) return
        if (reaction.message.partial) reaction.message = await reaction.message.fetch()
        const sql = new SQLQuery(reaction.message as Message)
        const embeds = new Embeds(this.discord, reaction.message as Message)

        const retriggerEmbed = async (reaction: MessageReaction) => {
            if (reaction.message.partial) reaction.message = await reaction.message.fetch()
            if (user.partial) user = await user.fetch()
            if (reaction.message.author.id === discord.user!.id) {
                if (active.has(reaction.message.id)) return
                const newArray = await SQLQuery.selectColumn("collectors", "message", true)
                let cached = false
                for (let i = 0; i < newArray.length; i++) {
                    if (newArray[i] === reaction.message.id) {
                        cached = true
                    }
                }
                if (cached) {
                    const messageID = await sql.fetchColumn("collectors", "message", "message", reaction.message.id)
                    if (String(messageID)) {
                        const cachedEmbeds = await sql.fetchColumn("collectors", "embeds", "message", reaction.message.id)
                        const collapse = await sql.fetchColumn("collectors", "collapse", "message", reaction.message.id)
                        const page = await sql.fetchColumn("collectors", "page", "message", reaction.message.id)
                        const help = await sql.fetchColumn("collectors", "help", "message", reaction.message.id)
                        const download = await sql.fetchColumn("collectors", "download", "message", reaction.message.id)
                        const newEmbeds: EmbedBuilder[] = []
                        for (let i = 0; i < cachedEmbeds.length; i++) {
                            newEmbeds.push(new EmbedBuilder(JSON.parse(cachedEmbeds[i])))
                        }
                        active.add(reaction.message.id)
                        if (help && !download) {
                            embeds.editHelpEmbed(reaction.message as Message, reaction.emoji.name!, user, newEmbeds)
                        } else {
                            embeds.editReactionCollector(reaction.message as Message, reaction.emoji.name!, user, newEmbeds, Boolean(collapse), Boolean(download), Number(page))
                        }
                    }
                }
            }
        }
        if (reaction.partial) {
            reaction = await reaction.fetch()
            retriggerEmbed(reaction)
        }

        const addReactionRole = async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
            if (reaction.message.partial) reaction.message = await reaction.message.fetch()
            const reactionroles = await sql.fetchColumn("guilds", "reaction roles")
            if (!reactionroles?.[0]) return
            for (let i = 0; i < reactionroles.length; i++) {
                const reactionrole = JSON.parse(reactionroles[i])
                if (!reactionrole.state || reactionrole.state === "off") continue
                if (reactionrole.message !== reaction.message.id) continue
                let test = false
                if (reactionrole.emoji === reaction.emoji.id) test = true
                if (reactionrole.emoji === reaction.emoji.toString()) test = true
                if (test) {
                    try {
                        const roleName = reaction.message.guild?.roles.cache.get(reactionrole.role)?.name
                        const member = reaction.message.guild?.members.cache.get(user.id)
                        await member?.roles.add(reactionrole.role)
                        if (reactionrole.dm === "on") {
                            const dmEmbed = embeds.createEmbed()
                            dmEmbed
                            .setAuthor({name: "reaction role", iconURL: "https://cdn.discordapp.com/emojis/589152499617759232.gif"})
                            .setTitle(`**Reaction Role Add** ${this.discord.getEmoji("gabYes")}`)
                            .setDescription(`${this.discord.getEmoji("star")}Added the role **${roleName}** in the guild **${reaction.message.guild?.name}**`)
                            await this.discord.dmSend(user as User, dmEmbed).catch(() => null)
                        }
                    } catch {
                        const foundMsg = await this.discord.fetchMessage(reaction.message, reactionrole.message) as Message
                        try {
                            await this.discord.send(foundMsg, `I need the **Manage Roles** permission, or this role is above my highest role ${this.discord.getEmoji("kannaFacepalm")}`)
                        } catch {
                            await this.discord.dmSend(user as User, `I need the **Manage Roles** permission, or this role is above my highest role ${this.discord.getEmoji("kannaFacepalm")}`)
                            .catch(() => null)
                        }
                    }
                }
            }
        }
        addReactionRole(reaction, user)

        const starboard = async (reaction: MessageReaction | PartialMessageReaction) => {
            if (reaction.message.partial) reaction.message = await reaction.message.fetch()
            if (!reaction.count || !reaction.message.guild) return
            const starEmoji = await sql.fetchColumn("guilds", "star emoji")
            if (!starEmoji) return
            if (reaction.emoji.id === starEmoji.match(/\d+/)?.[0] || reaction.emoji.toString() === starEmoji) {
                const starThreshold = await sql.fetchColumn("guilds", "star threshold")
                if (!(reaction.count >= Number(starThreshold))) return
                let active = await SQLQuery.redisGet("starboard")
                active = JSON.parse(active)
                if (!active) active = []
                if (active.includes(reaction.message.id)) return
                const starChannelID = await sql.fetchColumn("guilds", "starboard")
                const starChannel = reaction.message.guild.channels.cache.get(starChannelID) as TextChannel
                const content = reaction.message.embeds?.[0] ? reaction.message.embeds[0].description : reaction.message.content
                const starEmbed = embeds.createEmbed()
                starEmbed
                .setAuthor({name: "star", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/160/microsoft/74/white-medium-star_2b50.png"})
                .setTitle(`**New Starboard Message!** ${discord.getEmoji("raphiSmile")}`)
                .setThumbnail(this.discord.displayAvatar(reaction.message) || null)
                .setURL(reaction.message.url)
                .setDescription(`[**Message Link**](${reaction.message.url})\n` + content)
                .setImage(reaction.message.attachments.first() ? reaction.message.attachments.first()!.url : null)
                .setFooter({text: `${reaction.message.author.tag} • #${(reaction.message.channel as TextChannel).name}`, iconURL: this.discord.displayAvatar(reaction.message)})
                await this.discord.channelSend(starChannel, starEmbed)
                active.push(reaction.message.id)
                await SQLQuery.redisSet("starboard", JSON.stringify(active))
            }
        }
        starboard(reaction)
    }
}
