 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, PermissionsBitField, PermissionsString, Role, TextChannel, User} from "discord.js"
import blacklist from "../assets/json/blacklist.json"
import config from "../config.json"
import {Kisaragi} from "./Kisaragi"
import {SQLQuery} from "./SQLQuery"
import {Functions} from "./Functions"
import {Embeds} from "./Embeds"
import axios from "axios"

export class Permission {
    private readonly sql: SQLQuery
    constructor(private readonly discord: Kisaragi, private readonly message: Message) {
        this.sql = new SQLQuery(this.message)
    }

    /** Check Mod */
    public checkMod = async (noMsg?: boolean) => {
        if (this.message.author.id === process.env.OWNER_ID) return true
        if (this.message.author.id === this.discord.user!.id) return true
        const mod = await this.sql.fetchColumn("guilds", "mod role")
        if (!mod) {
            if (noMsg) return false
            this.discord.reply(this.message, "In order to use moderator commands, you must first " +
            "configure the server's moderator role using the **mod** command!")
            return false
        } else {
            const modRole = this.message.member!.roles.cache.find((r: Role) => r.id === String(mod))
            if (!modRole) {
                const admin = await this.sql.fetchColumn("guilds", "admin role")
                const adminRole = this.message.member!.roles.cache.find((r: Role) => r.id === String(admin))
                if (adminRole) return true
                if (noMsg) return false
                this.discord.reply(this.message, "In order to use moderator commands, you must have " +
                `the mod role which is currently set to <@&${mod}>!`)
                return false
            } else {
                return true
            }
        }
    }

    /** Check Admin */
    public checkAdmin = async (noMsg?: boolean) => {
        if (this.message.author.id === process.env.OWNER_ID) return true
        if (this.message.author.id === this.discord.user?.id) return true
        const admin = await this.sql.fetchColumn("guilds", "admin role")
        if (!admin) {
            if (noMsg) return false
            this.discord.reply(this.message, "In order to use administrator commands, you must first " +
            "configure the server's administrator role using the **mod** command!")
            return false
        } else {
            const adminRole = this.message.member!.roles.cache.find((r: Role) => r.id === String(admin))
            if (!adminRole) {
                if (noMsg) return false
                this.discord.reply(this.message, "In order to use administrator commands, you must have " +
                `the admin role which is currently set to <@&${admin}>!`)
                return false
            } else {
                return true
            }
        }
    }

    /** Check Bot Dev */
    public checkBotDev = (noMsg?: boolean) => {
        if (this.message.author.id === process.env.OWNER_ID) {
            return true
        } else {
            if (noMsg) return false
            this.discord.reply(this.message, `Sorry, only the bot developer can use this command. ${this.discord.getEmoji("sagiriBleh")}`)
            return false
        }
    }

    /** Check Permission */
    public checkPerm = (perm: string) => {
        if (this.message.author.id === process.env.OWNER_ID) return true
        perm = perm.replace(/\s+/g, "")
        const permission =  new PermissionsBitField(perm as PermissionsString)
        if (this.message.member!.permissions.has(permission)) {
            return true
        } else {
            this.discord.reply(this.message, `You must have the ${perm} permission in order to use this command.`)
            return false
        }
    }

    public checkAudioPermission = async (user: User, requesterID: string) => {
        if (user.id === process.env.OWNER_ID) return true
        if (user.id === requesterID) return true
        const mod = await this.sql.fetchColumn("guilds", "mod role")
        if (!mod) {
            return false
        } else {
            const member = await this.message.guild?.members.fetch(requesterID)
            const modRole = member?.roles.cache.find((r: Role) => r.id === String(mod))
            if (!modRole) {
                const admin = await this.sql.fetchColumn("guilds", "admin role")
                const adminRole = member?.roles.cache.find((r: Role) => r.id === String(admin))
                if (adminRole) return true
                return false
            } else {
                return true
            }
        }
    }

    /** Check NSFW */
    public checkNSFW = (noMsg?: boolean) => {
        if (!this.message.guild) return true
        const channel = this.message.channel as TextChannel
        if (channel.nsfw) {
            return true
        } else {
            if (noMsg) return false
            this.discord.reply(this.message, `Because this command might output sensitive content, you may only use it in **age-restricted channels**! ${this.discord.getEmoji("madokaLewd")}`)
            return false
        }
    }

    /** Check Premium */
    public checkPremium = (noMsg?: boolean) => {
        return true
        const botDev = this.checkBotDev(true)
        if (botDev) return true
        if (false) {
            return true
        } else {
            if (noMsg) return false
            this.discord.reply(this.message, `To use this command, you must have a **premium subscription active**! ${this.discord.getEmoji("hoshinoBonk")}`)
            return false
        }
    }

    /** Check Premium Feature */
    public checkPremiumFeature = async (noMsg?: boolean) => {
        const result = this.checkPremium(true)
        if (result) {
            return true
        } else {
            if (noMsg) return false
            const rep = await this.discord.send(this.message, `<@${this.message.author.id}> To use this feature, you must have a **premium subscription active**! ${this.discord.getEmoji("hoshinoBonk")}`)
            await Functions.deferDelete(rep, 3000)
            return false
        }
    }

    /** Check Vote Locked */
    public checkVoteLocked = async (noMsg?: boolean) => {
        const premium = this.checkPremium(true)
        // if (premium) return true
        const result = await SQLQuery.fetchColumn("misc", "last voted", "user id", this.message.author.id)
        let voted = false
        if (result) {
            const timestamp = new Date(result).getTime()
            const now = Date.now()
            if (now - timestamp <= 48 * 60 * 60 * 1000) voted = true
        }
        if (!voted) {
            const headers = {"Authorization": process.env.TOP_GG_TOKEN}
            const response = await axios.get(`https://top.gg/api/bots/${this.discord.user!.id}/check?userId=${this.message.author.id}`, {headers}).then((r) => r.data)
            voted = Boolean(response.voted)
            if (voted) {
                try {
                    await SQLQuery.insertInto("misc", "user id", this.message.author.id)
                    await SQLQuery.updateColumn("misc", "username", this.message.author.username, "user id", this.message.author.id)
                } finally {
                    const now = new Date().toISOString()
                    await SQLQuery.updateColumn("misc", "last voted", now, "user id", this.message.author.id)
                }
            }
        }
        if (voted) {
            return true
        } else {
            if (noMsg) return false
            const embeds = new Embeds(this.discord, this.message)
            const voteEmbed = embeds.createEmbed()
            .setTitle(`**Voting Required** ${this.discord.getEmoji("uniHurt")}`)
            .setDescription(
                `To use this command you must vote for us! You will gain access to all the vote-locked commands for **48 hours**.\n` +
                `[**Voting Link**](${config.vote})\n`
            )
            await this.discord.reply(this.message, voteEmbed)
            return false
        }
    }

    /** Booru content filter */
    public booruFilter = (tags: string) => {
        for (let i = 0; i < blacklist.booru.length; i++) {
            if (tags.includes(blacklist.booru[i])) return true
        }
        return false
    }

    /** Continue temporary bans */
    public continueTempBans = async () => {
        let tempArr = await SQLQuery.redisGet(`${this.message.guild?.id}_tempban`)
        tempArr = JSON.parse(tempArr)
        if (tempArr) {
            for (let i = 0; i < tempArr.length; i++) {
                const current = tempArr[i]
                setInterval(async () => {
                    let newArr = await SQLQuery.redisGet(`${this.message.guild?.id}_tempban`)
                    newArr = JSON.parse(newArr)
                    if (!newArr) return
                    const index = newArr.findIndex((i: any) => i.member === current.id)
                    if (index === -1) return
                    const curr = newArr[index]
                    const time = Number(curr.time)-60000
                    if (time <= 0) {
                        await this.message.guild?.members.unban(current.id, current.reason).catch(() => null)
                        newArr[index] = null
                        newArr = newArr.filter(Boolean)?.[0] ?? null
                        await SQLQuery.redisSet(`${this.message.guild?.id}_tempban`, newArr)
                        // @ts-expect-error
                        clearInterval()
                        return
                    }
                    newArr[index] = {...curr, time}
                    await SQLQuery.redisSet(`${this.message.guild?.id}_tempban`, JSON.stringify(newArr))
                }, 60000)
                setTimeout(async () => {
                    await this.message.guild?.members.unban(current.id, current.reason).catch(() => null)
                    tempArr[i] = null
                    tempArr = tempArr.filter(Boolean)?.[0] ?? null
                    await SQLQuery.redisSet(`${this.message.guild?.id}_tempban`, tempArr)
                }, current.time)
            }
        }
    }

    /** Continue temporary mute */
    public continueTempMutes = async () => {
        const mute = await this.sql.fetchColumn("guilds", "mute role")
        if (!mute) return
        let tempArr = await SQLQuery.redisGet(`${this.message.guild?.id}_tempmute`)
        tempArr = JSON.parse(tempArr)
        if (tempArr) {
            for (let i = 0; i < tempArr.length; i++) {
                const current = tempArr[i]
                setInterval(async () => {
                    let newArr = await SQLQuery.redisGet(`${this.message.guild?.id}_tempmute`)
                    newArr = JSON.parse(newArr)
                    if (!newArr) return
                    const index = newArr.findIndex((i: any) => i.member === current.id)
                    if (index === -1) return
                    const curr = newArr[index]
                    const time = Number(curr.time)-60000
                    if (time <= 0) {
                        const member = this.message.guild?.members.cache.get(curr.id)
                        await member?.roles.remove(mute).catch(() => null)
                        newArr[index] = null
                        newArr = newArr.filter(Boolean)?.[0] ?? null
                        await SQLQuery.redisSet(`${this.message.guild?.id}_tempmute`, newArr)
                        // @ts-expect-error
                        clearInterval()
                        return
                    }
                    newArr[index] = {...curr, time}
                    await SQLQuery.redisSet(`${this.message.guild?.id}_tempmute`, JSON.stringify(newArr))
                }, 60000)
                setTimeout(async () => {
                    const member = this.message.guild?.members.cache.get(current.id)
                    await member?.roles.remove(mute).catch(() => null)
                    tempArr[i] = null
                    tempArr = tempArr.filter(Boolean)?.[0] ?? null
                    await SQLQuery.redisSet(`${this.message.guild?.id}_tempmute`, tempArr)
                }, current.time)
            }
        }
    }
}
