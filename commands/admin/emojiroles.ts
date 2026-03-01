 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class EmojiRoles extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Restricts an emoji to certain roles (Bot exclusive feature).",
            help:
            `
            \`emojiroles\` - Shows the linked channels prompt.
            \`emojiroles emoji? @role1? @role2? whitelist/blacklist?\` - Sets the restricted roles, and whether it's treated as a whitelist or blacklist.
            \`emojiroles edit setting emoji? @role1? @role2? whitelist/blacklist?\` - Edits an existing setting.
            \`emojiroles delete setting\` - Deletes a setting.
            \`emojiroles reset\` - Deletes all settings.
            `,
            examples:
            `
            \`=>emojiroles supervip @admin whitelist\`
            `,
            aliases: ["er", "eroles"],
            guildOnly: true,
            cachedGuildOnly: true,
            cooldown: 3,
            defer: true,
            subcommandEnabled: true
        })
        const editOption = new SlashCommandOption()
            .setType("string")
            .setName("edit")
            .setDescription("Setting input in the edit subcommand.")

        const settingOption = new SlashCommandOption()
            .setType("string")
            .setName("setting")
            .setDescription("Can be a setting number.")

        const optOption = new SlashCommandOption()
            .setType("string")
            .setName("opt")
            .setDescription("Can be delete/edit/reset or setting input.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(optOption)
            .addOption(settingOption)
            .addOption(editOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const embeds = new Embeds(discord, message)
        const sql = new SQLQuery(message)
        if (!message.channel.isSendable()) return
        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)
        if (!await perms.checkAdmin()) return
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            return linkPrompt(message)
        }
        const emojiRoles = await sql.fetchColumn("guilds", "emoji roles")
        const step = 3.0
        const increment = Math.ceil((emojiRoles ? emojiRoles.length : 1) / step)
        const emojiArray: EmbedBuilder[] = []
        for (let i = 0; i < increment; i++) {
            let settings = ""
            for (let j = 0; j < step; j++) {
                if (emojiRoles) {
                    const k = (i*step)+j
                    if (!emojiRoles.join("")) settings = "None"
                    if (!emojiRoles[k]) break
                    const curr = JSON.parse(emojiRoles[k])
                    settings += `${k + 1} **=>**\n` +
                    `${discord.getEmoji("star")}_Emoji:_ **${curr.emoji ? curr.emoji : "None"}**\n`+
                    `${discord.getEmoji("star")}_Roles:_ **${curr.roles ? `${curr.roles.map((r: string) => `<@&${r}>`).join(", ")}` : "None"}**\n`+
                    `${discord.getEmoji("star")}_Type:_ **${curr.type ? curr.type : "None"}**\n`
                } else {
                    settings = "None"
                }
            }
            const emojiEmbed = embeds.createEmbed()
            emojiEmbed
            .setTitle(`**Emoji Roles** ${discord.getEmoji("kannaBear")}`)
            .setThumbnail(message.guild!.iconURL({extension: "png"})!)
            .setDescription(Functions.multiTrim(`
            Restrict an emoji to certain roles. This feature is only available to bots.
            newline
            __Current Settings:__
            ${settings}
            newline
            __Edit Settings:__
            ${discord.getEmoji("star")}_Post an **emoji** to set the emoji._
            ${discord.getEmoji("star")}_**Mention roles** to add roles to the filter._
            ${discord.getEmoji("star")}_Type **whitelist** or **blacklist** to set the filter type._
            ${discord.getEmoji("star")}_Type **edit (setting number)** to edit a setting._
            ${discord.getEmoji("star")}_Type **delete (setting number)** to delete a setting._
            ${discord.getEmoji("star")}_Type **reset** to delete all settings._
            ${discord.getEmoji("star")}_Type **cancel** to exit._
        `))
            emojiArray.push(emojiEmbed)
        }

        if (emojiArray.length === 1) {
            this.reply(emojiArray[0])
        } else {
            embeds.createReactionEmbed(emojiArray)
        }

        async function linkPrompt(msg: Message) {
            let emojiRoles = await sql.fetchColumn("guilds", "emoji roles")
            let [setEmoji, setRole, setType] = [] as boolean[]
            if (!emojiRoles) emojiRoles = []
            const responseEmbed = embeds.createEmbed()
            responseEmbed.setTitle(`**Emoji Roles** ${discord.getEmoji("kannaBear")}`)
            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                return discord.send(msg, responseEmbed)
            }
            if (msg.content.toLowerCase() === "reset") {
                for (let i = 0; i < emojiRoles.length; i++) {
                    const emojiID = JSON.parse(emojiRoles[i]).emoji.match(/\d+/)?.[0]
                    const e = msg.guild?.emojis.cache.find((e) => e.id === emojiID)
                    await e?.edit({roles: msg.guild?.roles.cache})
                }
                await sql.updateColumn("guilds", "emoji roles", null)
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}All settings were reset!`)
                return discord.send(msg, responseEmbed)
            }
            if (msg.content.toLowerCase().includes("delete")) {
                const num = Number(msg.content.replace(/delete/gi, "").replace(/\s+/g, ""))
                if (num) {
                    if (emojiRoles[num - 1]) {
                        const emojiID = JSON.parse(emojiRoles[num - 1]).emoji.match(/\d+/)?.[0]
                        const e = msg.guild?.emojis.cache.find((e) => e.id === emojiID)
                        await e?.edit({roles: msg.guild?.roles.cache})
                        emojiRoles[num - 1] = ""
                        emojiRoles = emojiRoles.filter(Boolean)
                        await sql.updateColumn("guilds", "emoji roles", emojiRoles)
                        responseEmbed
                        .setDescription(`${discord.getEmoji("star")}Setting ${num} was deleted!`)
                        return discord.send(msg, responseEmbed)
                    }
                } else {
                    responseEmbed
                    .setDescription(`${discord.getEmoji("star")}Setting not found!`)
                    return discord.send(msg, responseEmbed)
                }
            }

            if (msg.content.toLowerCase().startsWith("edit")) {
                const newMsg = msg.content.replace(/edit/g, "").trim().split(" ")
                const tempMsg = newMsg.slice(1).join(" ")
                const num = Number(newMsg[0]) - 1
                if (tempMsg && emojiRoles?.[num]) {
                    emojiRoles[num] = JSON.parse(emojiRoles[num])
                    let editDesc = ""
                    const tempRoles = msg.content.match(/(?<=<@&)(.*?)(?=>)/g)
                    const tempType = msg.content.match(/whitelist|blacklist/)?.[0] ?? ""
                    let tempEmoji = msg.content.replace(/(<@&)(.*?)(>)/g, "").replace(/whitelist/g, "").replace(/blacklist/g, "").trim()
                    if (tempEmoji) {
                        if (!/\d+/.test(tempEmoji)) {
                            const e = msg.guild?.emojis.cache.find((e) => e.name?.toLowerCase().includes(tempEmoji.toLowerCase()))
                            if (!e) return message.reply(`Invalid emoji ${discord.getEmoji("kannaFacepalm")}`)
                            tempEmoji = e.animated ? `<${e.identifier}>` : `<:${e.identifier}>`
                        }
                        emojiRoles[num].emoji = tempEmoji
                        editDesc += `${discord.getEmoji("star")}Emoji set to ${tempEmoji}!\n`
                    }
                    if (tempRoles) {
                        emojiRoles[num].roles = tempRoles?.map((r) => r)
                        editDesc += `${discord.getEmoji("star")}Roles set to ${tempRoles?.map((r) => `<@&${r}>`).join(", ")}!\n`
                    }
                    if (tempType) {
                        if (tempType.toLowerCase() === "whitelist") {
                            emojiRoles[num].type = "whitelist"
                            editDesc += `${discord.getEmoji("star")}Filter type set to **whitelist**!\n`
                        } else if (tempType.toLowerCase() === "blacklist") {
                            emojiRoles[num].type = "blacklist"
                            editDesc += `${discord.getEmoji("star")}Filter type set to **blacklist**!\n`
                        }
                    }
                    if (tempEmoji && tempRoles && tempType) {
                        const emojiID = tempEmoji.match(/\d+/)?.[0]
                        const emoji = msg.guild?.emojis.cache.find((e) => e.id === emojiID)
                        const discordRole = message.guild?.members.me?.roles.cache.find((r) => r.managed)
                        if (tempType.toLowerCase() === "whitelist") {
                            await emoji?.edit({roles: [discordRole!, ...tempRoles!.map((e) => e)]})
                        } else {
                            await emoji?.edit({roles: msg.guild?.roles.cache.filter((r) => {
                                if (r.id === discordRole?.id) return true
                                if (tempRoles?.includes(r.id)) return false
                                return true
                            })})
                        }
                        editDesc += `${discord.getEmoji("star")}These settings were **applied**!\n`
                    }
                    if (!editDesc) return discord.send(msg, responseEmbed.setDescription(`No edits specified! ${discord.getEmoji("kannaFacepalm")}`))
                    await sql.updateColumn("guilds", "emoji roles", emojiRoles)
                    return discord.send(msg, responseEmbed.setDescription(editDesc))
                } else {
                    return discord.send(msg, responseEmbed.setDescription(`No edits specified! ${discord.getEmoji("kannaFacepalm")}`))
                }
            }

            const newRoles = msg.content.match(/(?<=<@&)(.*?)(?=>)/g)
            const newType = msg.content.match(/whitelist|blacklist/)?.[0] ?? ""
            let newEmoji = msg.content.replace(/(<@&)(.*?)(>)/g, "").replace(/whitelist/g, "").replace(/blacklist/g, "").trim()
            if (newRoles) setRole = true
            if (newType) setType = true
            if (newEmoji) {
                setEmoji = true
                if (!/\d+/.test(newEmoji)) {
                    const e = msg.guild?.emojis.cache.find((e) => e.name?.toLowerCase().includes(newEmoji.toLowerCase()))
                    if (!e) return message.reply(`Invalid emoji ${discord.getEmoji("kannaFacepalm")}`)
                    newEmoji = e.animated ? `<${e.identifier}>` : `<:${e.identifier}>`
                }
            }

            let description = ""
            const obj = {} as any

            if (setEmoji) {
                obj.emoji = newEmoji
                description += `${discord.getEmoji("star")}Emoji set to ${newEmoji}!\n`
            }

            if (setRole) {
                obj.roles = newRoles?.map((r) => r)
                description += `${discord.getEmoji("star")}Roles set to ${newRoles?.map((r) => `<@&${r}>`).join(", ")}!\n`
            }

            if (setType) {
                if (newType.toLowerCase() === "whitelist") {
                    obj.type = "whitelist"
                    description += `${discord.getEmoji("star")}Filter type set to **whitelist**!\n`
                } else {
                    obj.type = "blacklist"
                    description += `${discord.getEmoji("star")}Filter type set to **blacklist**!\n`
                }
            }

            if (setEmoji && setRole && setType) {
                const emojiID = newEmoji.match(/\d+/)?.[0]
                const emoji = msg.guild?.emojis.cache.find((e) => e.id === emojiID)
                const discordRole = message.guild?.members.me?.roles.cache.find((r) => r.managed)
                if (newType.toLowerCase() === "whitelist") {
                    await emoji?.edit({roles: [discordRole!, ...newRoles!.map((e) => e)]})
                } else {
                    await emoji?.edit({roles: msg.guild?.roles.cache.filter((r) => {
                        if (r.id === discordRole?.id) return true
                        if (newRoles?.includes(r.id)) return false
                        return true
                    })})
                }
                description += `${discord.getEmoji("star")}These settings were **applied**!\n`
            }

            if (!description) description = `${discord.getEmoji("star")}Invalid arguments provided, canceled the prompt. ${discord.getEmoji("kannaFacepalm")}`
            emojiRoles.push(obj)
            await sql.updateColumn("guilds", "emoji roles", emojiRoles)
            responseEmbed
            .setDescription(description)
            return discord.send(msg, responseEmbed)
        }

        await embeds.createPrompt(linkPrompt)
    }
}
