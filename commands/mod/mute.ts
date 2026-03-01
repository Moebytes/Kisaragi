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
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Mute extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Mutes the specified users.",
            help:
            `
            _Note: You must set a mute role first._
            \`mute @user1 @user2 reason?\` - Mutes the user(s) with an optional reason
            \`mute id1 id2 reason?\` - Mutes by user id instead of mention
            `,
            examples:
            `
            \`=>mute @user shush\`
            `,
            guildOnly: true,
            cachedGuildOnly: true,
            aliases: ["silence"],
            cooldown: 3,
            subcommandEnabled: true
        })
        const reasonOption = new SlashCommandOption()
            .setType("string")
            .setName("reason")
            .setDescription("The mute reason.")

        const userOption = new SlashCommandOption()
            .setType("user")
            .setName("user")
            .setDescription("The user to mute.")
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
        const sql = new SQLQuery(message)
        const perms = new Permission(discord, message)
        if (!await perms.checkMod()) return
        const muteEmbed = embeds.createEmbed()
        const mute = await sql.fetchColumn("guilds", "mute role")
        if (!mute) return this.reply("You need to set a mute role first!")
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
            const member = message.guild!.members.cache.find((m: GuildMember) => m.id === userArray[i]) as GuildMember
            if (!member) continue
            try {
                await member.roles.add(mute)
                const data = {type: "mute", user: member.id, executor: message.author.id, date: Date.now(), guild: message.guild?.id, reason, context: message.url}
                discord.emit("caseUpdate", data)
            } catch {
                return this.reply(`I need the **Manage Roles** permission ${discord.getEmoji("kannaFacepalm")}`)
            }
            members.push(`<@${member.id}>`)
            muteEmbed
            .setAuthor({name: "mute", iconURL: "https://kisaragi.moe/assets/embed/mute.png"})
            .setTitle(`**You Were Muted** ${discord.getEmoji("sagiriBleh")}`)
            .setDescription(`${discord.getEmoji("star")}_You were muted in ${message.guild!.name} for reason:_ **${reason}**`)
            const dm = await member.createDM().catch(() => null)
            if (dm) await discord.channelSend(dm, muteEmbed).catch(() => null)
        }
        if (!members[0]) return this.reply(`Invalid users ${discord.getEmoji("kannaFacepalm")}`)
        muteEmbed
        .setAuthor({name: "mute", iconURL: "https://kisaragi.moe/assets/embed/mute.png"})
        .setTitle(`**Member Muted** ${discord.getEmoji("sagiriBleh")}`)
        .setDescription(`${discord.getEmoji("star")}_Successfully muted ${members.join(", ")} for reason:_ **${reason}**`)
        return this.reply(muteEmbed)
    }
}
