/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {GuildMember, Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class VCKick extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Disconnects users from a voice channel.",
            help:
            `
            \`vckick @user1 @user2 reason?\` - Voice kicks the user(s) with an optional reason
            \`vckick id1 id2 reason?\` - Voice kicks by user id instead of mention
            `,
            examples:
            `
            \`=>vckick @user earrape\`
            `,
            guildOnly: true,
            cachedGuildOnly: true,
            aliases: ["vcdisconnect"],
            cooldown: 3,
            subcommandEnabled: true
        })
        const reasonOption = new SlashCommandOption()
            .setType("string")
            .setName("reason")
            .setDescription("The voice kick reason.")

        const userOption = new SlashCommandOption()
            .setType("user")
            .setName("user")
            .setDescription("The user to voice kick.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(userOption)
            .addOption(reasonOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        if (!await perms.checkMod()) return
        const vckickEmbed = embeds.createEmbed()
        const reasonArray: string[] = []
        const userArray: string[] = []

        for (let i = 1; i < args.length; i++) {
            if (args[i].match(/\d+/g)) {
                userArray.push(args[i].match(/\d+/g)![0])
            } else {
                reasonArray.push(args[i])
            }
        }

        const reason = reasonArray.join("") ? reasonArray.join(" ") : "None provided!"

        const members: string[] = []
        for (let i = 0; i < userArray.length; i++) {
            const member = message.guild!.members.cache.find((m: GuildMember) => m.id === userArray[i])
            if (member) {
                members.push(`<@${member.id}>`)
            } else {
                continue
            }
            vckickEmbed
            .setAuthor({name: "voice kick", iconURL: "https://kisaragi.moe/assets/embed/vckick.png"})
            .setTitle(`**You Were Voice Kicked** ${discord.getEmoji("tohruSmug")}`)
            .setDescription(`${discord.getEmoji("star")}_You were voice kicked from ${message.guild!.name} for reason:_ **${reason}**`)
            try {
                await member.voice.disconnect(reason)
                const data = {type: "vckick", user: member.id, executor: message.author.id, date: Date.now(), guild: message.guild?.id, reason, context: message.url}
                discord.emit("caseUpdate", data)
            } catch {
                return this.reply(`I need the **Move Members** permission, or this user is not in a voice channel ${discord.getEmoji("kannaFacepalm")}`)
            }
            const dm = await member.createDM().catch(() => null)
            if (dm) await discord.channelSend(dm, vckickEmbed).catch(() => null)
        }
        if (!members[0]) return this.reply(`Invalid users ${discord.getEmoji("kannaFacepalm")}`)
        vckickEmbed
        .setAuthor({name: "voice kick", iconURL: "https://kisaragi.moe/assets/embed/vckick.png"})
        .setTitle(`**Member Voice Kicked** ${discord.getEmoji("tohruSmug")}`)
        .setDescription(`${discord.getEmoji("star")}_Successfully voice kicked ${members.join(", ")} for reason:_ **${reason}**`)
        return this.reply(vckickEmbed)
    }
}
