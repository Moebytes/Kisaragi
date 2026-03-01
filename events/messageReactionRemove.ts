 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, MessageReaction, PartialMessageReaction, User, PartialUser} from "discord.js"
import {Embeds} from "./../structures/Embeds"
import {Kisaragi} from "./../structures/Kisaragi"
import {SQLQuery} from "./../structures/SQLQuery"

export default class MessageReactionRemove {
    constructor(private readonly discord: Kisaragi) {}

    public run = (reaction: MessageReaction, user: User) => {
        const removeReactionRole = async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
            if (user.id === this.discord.user!.id) return
            if (reaction.message.partial) reaction.message = await reaction.message.fetch()
            const sql = new SQLQuery(reaction.message as Message)
            const embeds = new Embeds(this.discord, reaction.message as Message)
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
                        await member?.roles.remove(reactionrole.role)
                        if (reactionrole.dm === "on") {
                            const dmEmbed = embeds.createEmbed()
                            dmEmbed
                            .setAuthor({name: "reaction role", iconURL: "https://cdn.discordapp.com/emojis/585938418572328981.gif"})
                            .setTitle(`**Reaction Role Remove** ${this.discord.getEmoji("gabuTank")}`)
                            .setDescription(`${this.discord.getEmoji("star")}Removed the role **${roleName}** in the guild **${reaction.message.guild?.name}**`)
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
        removeReactionRole(reaction, user)
    }
}
