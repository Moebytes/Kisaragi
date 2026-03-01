/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {GuildMember, Message, Role} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Warn extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Gives users a warning.",
            help:
            `
            \`warn @user/id reason?\` - Warns the user for the reason
            `,
            examples:
            `
            \`=>warn @user stop spamming\`
            `,
            guildOnly: true,
            cachedGuildOnly: true,
            aliases: [],
            cooldown: 10,
            subcommandEnabled: true
        })
        const reasonOption = new SlashCommandOption()
            .setType("string")
            .setName("reason")
            .setDescription("The warn reason.")

        const userOption = new SlashCommandOption()
            .setType("user")
            .setName("user")
            .setDescription("The user to warn.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(userOption)
            .addOption(reasonOption)
    }

    public checkWarns = async (warnLog: any, userID: any, warnThreshold: string, warnPenalty: string, warnOneRole: any, warnTwoRole: any) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const sql = new SQLQuery(message)
        const member = message.guild!.members.cache.find((m: GuildMember) => m.id === userID)
        if (!member) return
        const warnReason = `Exceeded the threshold of ${warnThreshold} warns.`
        const dmEmbed = embeds.createEmbed()
        const guildEmbed = embeds.createEmbed()
        const dm = await member.createDM().catch(() => null)
        for (let i = 0; i < warnLog.length; i++) {
            if (warnLog[i].user === userID) {
                if (warnLog[i].warns.length >= 1) {
                    if (warnOneRole) {
                        if (!member.roles.cache.has(warnOneRole.id)) {
                            await member.roles.add(warnOneRole)
                            await this.send(`<@${userID}>, you were given the ${warnOneRole} role because you have one warn.`)
                        }
                    }
                }
                if (warnLog[i].warns.length >= 2) {
                    if (warnTwoRole) {
                        if (!member.roles.cache.has(warnTwoRole.id)) {
                            await member.roles.add(warnTwoRole)
                            await this.send(`<@${userID}>, you were given the ${warnTwoRole} role because you have two warns.`)
                        }
                    }
                }
                if (warnLog[i].warns.length >= Number(warnThreshold)) {
                    switch (warnPenalty.toLowerCase().trim()) {
                        case "ban":
                            dmEmbed
                            .setAuthor({name: "ban", iconURL: "https://kisaragi.moe/assets/embed/ban.png"})
                            .setTitle(`**You Were Banned** ${discord.getEmoji("kannaFU")}`)
                            .setDescription(`${discord.getEmoji("star")}_You were banned from ${message.guild!.name} for reason:_ **${warnReason}**`)
                            if (dm) await discord.channelSend(dm, dmEmbed).catch(() => null)
                            guildEmbed
                            .setAuthor({name: "ban", iconURL: "https://kisaragi.moe/assets/embed/ban.png"})
                            .setTitle(`**Member Banned** ${discord.getEmoji("kannaFU")}`)
                            .setDescription(`${discord.getEmoji("star")}_Successfully banned <@${userID}> for reason:_ **${warnReason}**`)
                            await member?.ban({reason: warnReason})
                            this.send(guildEmbed)
                            break
                        case "kick":
                            dmEmbed
                            .setAuthor({name: "kick", iconURL: "https://kisaragi.moe/assets/embed/kick.png"})
                            .setTitle(`**You Were Kicked** ${discord.getEmoji("kannaFU")}`)
                            .setDescription(`${discord.getEmoji("star")}_You were kicked from ${message.guild!.name} for reason:_ **${warnReason}**`)
                            if (dm) await discord.channelSend(dm, dmEmbed).catch(() => null)
                            guildEmbed
                            .setAuthor({name: "kick", iconURL: "https://kisaragi.moe/assets/embed/kick.png"})
                            .setTitle(`**Member Kicked** ${discord.getEmoji("kannaFU")}`)
                            .setDescription(`${discord.getEmoji("star")}_Successfully kicked <@${userID}> for reason:_ **${warnReason}**`)
                            await member?.kick(warnReason).catch(() => null)
                            this.send(guildEmbed)
                            break
                        case "mute":
                            const mute = await sql.fetchColumn("guilds", "mute role")
                            if (!mute) {
                                message.reply(`Failed to mute <@${userID}>. You do not have a mute role set!`)
                                return false
                            }
                            await member?.roles.add(mute)
                            dmEmbed
                            .setAuthor({name: "mute", iconURL: "https://kisaragi.moe/assets/embed/mute.png"})
                            .setTitle(`**You Were Muted** ${discord.getEmoji("sagiriBleh")}`)
                            .setDescription(`${discord.getEmoji("star")}_You were muted from ${message.guild!.name} for reason:_ **${warnReason}**`)
                            if (dm) await discord.channelSend(dm, dmEmbed).catch(() => null)
                            guildEmbed
                            .setAuthor({name: "mute", iconURL: "https://kisaragi.moe/assets/embed/mute.png"})
                            .setTitle(`**Member Muted** ${discord.getEmoji("sagiriBleh")}`)
                            .setDescription(`${discord.getEmoji("star")}_Successfully muted <@${userID}> for reason:_ **${warnReason}**`)
                            this.send(guildEmbed)
                            break
                        default:
                    }
                }
            }
        }
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const sql = new SQLQuery(message)
        if (!await perms.checkMod()) return
        const warnThreshold = await sql.fetchColumn("guilds", "warn threshold")
        const warnPenalty = await sql.fetchColumn("guilds", "warn penalty")
        const warnOne = await sql.fetchColumn("guilds", "warn one")
        const warnTwo = await sql.fetchColumn("guilds", "warn two")
        let warnLog = await sql.fetchColumn("guilds", "warn log") as any
        if (!warnLog) warnLog = []

        let warnOneRole, warnTwoRole
        if (warnOne) warnOneRole = message.guild!.roles.cache.find((r: Role) => r.id === warnOne)
        if (warnTwo) warnTwoRole = message.guild!.roles.cache.find((r: Role) => r.id === warnTwo)

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
        const modLog = await sql.fetchColumn("guilds", "mod log")

        for (let i = 0; i < userArray.length; i++) {
            const hash = Functions.randomString(16)
            const data = {type: "warn", reason, hash, user: userArray[i], date: Date.now(), executor: message.author.id, executorTag: message.author.tag, guild: message.guild?.id, context: message.url}
            let found = false
            for (let j = 0; j < warnLog.length; j++) {
                if (!warnLog[j]) break
                warnLog[j] = JSON.parse(warnLog[j])
                if (userArray[i] === warnLog[j].user) {
                    warnLog[j].warns.push(data)
                    found = true
                }
            }
            if (!found) {
                warnLog.push({user: `${userArray[i]}`, warns: [data]})
            }
            if (modLog) discord.emit("caseUpdate", data)
            await this.checkWarns(warnLog, userArray[i], warnThreshold, warnPenalty, warnOneRole, warnTwoRole)
        }

        await sql.updateColumn("guilds", "warn log", warnLog)

        let users = ""
        for (let i = 0; i < userArray.length; i++) {
            users += `<@${userArray[i]}> `
            const warnDMEmbed = embeds.createEmbed()
            warnDMEmbed
            .setAuthor({name: "warn", iconURL: "https://kisaragi.moe/assets/embed/warn.png"})
            .setTitle(`**You Were Warned** ${discord.getEmoji("raphi")}`)
            .setDescription(
                `${discord.getEmoji("star")}_You were warned in ${message.guild!.name} for reason: **${reason}**_`
            )
            const member = message.guild!.members.cache.find((m: GuildMember) => m.id === userArray[i])
            try {
                await discord.dmSend(member!, warnDMEmbed)
            } catch {
                continue
            }
        }

        const warnEmbed = embeds.createEmbed()
        warnEmbed
        .setAuthor({name: "warn", iconURL: "https://kisaragi.moe/assets/embed/warn.png"})
        .setTitle(`**Member Warned** ${discord.getEmoji("raphi")}`)
        .setDescription(
            `${discord.getEmoji("star")}_Successfully warned ${users} for reason: **${reason}**_`
        )
        this.reply(warnEmbed)
    }
}
