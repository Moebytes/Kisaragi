 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder, TextChannel, Webhook, ChannelType} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"
import {SQLQuery} from "../../structures/SQLQuery"

export default class TwitchNotify extends Command {
    private readonly sql = new SQLQuery(this.message)
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Configure twitch livestream notifications.",
            help:
            `
            \`twitchnotify\` - Opens the twitch notify prompt
            \`twitchnotify name #channel @role/id?\` - Sets the text channel, text channel, and mention role (optional)
            \`twitchnotify delete setting\` - Deletes a setting
            \`twitchnotify edit setting @role/id?\` - Edits the role mention.
            \`twitchnotify reset\` - Deletes all settings.
            `,
            examples:
            `
            \`=>twitchnotify\`
            \`=>twitchnotify channel #updates\`
            `,
            aliases: ["twitchnotification", "twitchnotifications"],
            botPermission: "ManageWebhooks",
            guildOnly: true,
            cachedGuildOnly: true,
            cooldown: 15,
            defer: true,
            unlist: true,
            subcommandEnabled: false
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

    public getTwitch = async (channels: string[], reset?: boolean) => {
        let twitch: any[] = []
        if (channels) {
            for (let i = 0; i < channels.length; i++) {
                let config = await this.sql.fetchColumn("twitch", "config", "channel", channels[i])
                if (!config?.[0]) continue
                for (let j = 0; j < config.length; j++) {
                    const current = JSON.parse(config[j])
                    if (current.guild === this.message.guild?.id) {
                        twitch.push(current)
                        if (reset) {
                            config[j] = ""
                            config = config.filter(Boolean)
                            await this.sql.updateColumn("twitch", "config", config, "channel", channels[i])
                        }
                    }
                }
            }
        }
        if (!twitch?.[0]) twitch.push({guild: this.message.guild?.id, channel: null, text: null, mention: null, state: "Off"})
        twitch = Functions.removeDuplicates(twitch)
        return twitch
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const self = this
        const sql = this.sql
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        if (!await perms.checkMod()) return
        if (!message.channel.isSendable()) return
        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            await twitchPrompt(message)
            return
        }

        const channels = await sql.fetchColumn("guilds", "twitch channels")
        const twitch = await this.getTwitch(channels)
        const step = 3.0
        const increment = Math.ceil((twitch ? twitch.length : 1) / step)
        const twitchArray: EmbedBuilder[] = []
        for (let i = 0; i < increment; i++) {
            let twitchDesc = ""
            for (let j = 0; j < step; j++) {
                if (twitch?.[0].channel) {
                    const k = (i*step)+j
                    if (!twitch[k]) break
                    const channel = twitch[k]?.channel ? `[**${twitch[k].channel}**](https://www.twitch.tv/${twitch[k].channel})` : "None"
                    twitchDesc += `**${k + 1} =>**\n` +
                    `${discord.getEmoji("star")}Twitch Channel: ${channel}\n` +
                    `${discord.getEmoji("star")}Text Channel: ${twitch[k].text ? `<#${twitch[k].text}>` : "None"}\n` +
                    `${discord.getEmoji("star")}Role Mention: ${twitch[k].mention ? twitch[k].mention : "None"}\n` +
                    `${discord.getEmoji("star")}State: **${twitch[k].state ? twitch[k].state : "Off"}**\n`
                } else {
                    twitchDesc = "None"
                }
            }
            const twitchEmbed = embeds.createEmbed()
            twitchEmbed
            .setTitle(`**Twitch Notify** ${discord.getEmoji("chinoSmug")}`)
            .setThumbnail(message.author.displayAvatarURL({extension: "png"}))
            .setDescription(Functions.multiTrim(`
                Configure twitch livestream notifications.
                newline
                **Twitch Channel** - The channel to receive livestream notifications from.
                **Text Channel** - Where notifications are sent.
                **Role Mention** - Mentions a role whenever the channel is live (optional)
                newline
                __Current Settings__
                ${twitchDesc}
                newline
                __Edit Settings__
                ${discord.getEmoji("star")}**Type a channel id or name** to set the twitch channel (required).
                ${discord.getEmoji("star")}**Mention a text channel** to set the text channel (required).
                ${discord.getEmoji("star")}**Mention a role or type a role id** to set the role mention.
                ${discord.getEmoji("star")}Type **toggle (setting number)** to toggle the state.
                ${discord.getEmoji("star")}Type **delete (setting number)** to delete a setting.
                ${discord.getEmoji("star")}Type **edit (setting number)** to edit the role mention.
                ${discord.getEmoji("star")}Type **reset** to reset all settings.
                ${discord.getEmoji("star")}Type **cancel** to exit.
            `))
            twitchArray.push(twitchEmbed)
        }

        if (twitchArray.length === 1) {
            this.reply(twitchArray[0])
        } else {
            embeds.createReactionEmbed(twitchArray)
        }

        async function twitchPrompt(msg: Message) {
            let channels = await sql.fetchColumn("guilds", "twitch channels")
            if (!channels) channels = []
            const twitch = channels[0] ? await self.getTwitch(channels) : []
            const responseEmbed = embeds.createEmbed()
            .setTitle(`**Twitch Notify** ${discord.getEmoji("chinoSmug")}`)

            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                return discord.send(msg, responseEmbed)
            }
            if (msg.content.toLowerCase() === "reset") {
                await sql.updateColumn("guilds", "twitch channels", null)
                await self.getTwitch(channels, true)
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Twitch notify settings were wiped!`)
                return discord.send(msg, responseEmbed)
            }

            if (msg.content.toLowerCase().includes("delete")) {
                const num = Number(msg.content.replace(/delete/gi, "").replace(/\s+/g, ""))
                if (Number.isNaN(num)) return msg.reply("Invalid setting number!")
                if (twitch ? twitch[num - 1] : false) {
                    const channel = twitch[num - 1].channel
                    const index = channels.findIndex((c: string) => c === channel)
                    channels[index] = ""
                    channels = channels.filter(Boolean)
                    await sql.updateColumn("guilds", "twitch channels", channels)
                    await self.getTwitch([channel], true)
                    responseEmbed
                    .setDescription(`${discord.getEmoji("star")}Setting ${num} was deleted!`)
                    return discord.send(msg, responseEmbed)
                } else {
                    responseEmbed
                    .setDescription(`${discord.getEmoji("star")}Setting not found!`)
                    return discord.send(msg, responseEmbed)
                }
            }
            if (msg.content.toLowerCase().includes("toggle")) {
                const num = Number(msg.content.replace(/toggle/gi, "").replace(/\s+/g, ""))
                if (Number.isNaN(num)) return msg.reply("Invalid setting number!")
                if (twitch ? twitch[num - 1] : false) {
                    let desc = ""
                    const current = twitch[num - 1]
                    if (current.state === "On") {
                        current.state = "Off"
                        desc += `${discord.getEmoji("star")}Setting ${num} was toggled **off**!`
                    } else {
                        current.state = "On"
                        desc += `${discord.getEmoji("star")}Setting ${num} was toggled **on**!`
                    }
                    const config = await sql.fetchColumn("twitch", "config", "channel", current.channel)
                    const index = config.findIndex((c: any) => {
                        if (c.guild === current.guild && c.text === current.text && c.mention === current.mention) return true
                    })
                    config[index] = current
                    await sql.updateColumn("twitch", "config", config, "channel", current.channel)
                    responseEmbed.setDescription(desc)
                    return discord.send(msg, responseEmbed)
                } else {
                    responseEmbed
                    .setDescription(`${discord.getEmoji("star")}Setting not found!`)
                    return discord.send(msg, responseEmbed)
                }
            }
            if (msg.content.toLowerCase().includes("edit")) {
                const newMsg = msg.content.replace(/edit/g, "").trim().split(" ")
                const tempMsg = newMsg.slice(1).join(" ")
                const num = Number(newMsg[0])
                if (Number.isNaN(num)) return msg.reply("Invalid setting number!")
                if (twitch ? twitch[num - 1] : false) {
                    const current = twitch[num - 1]
                    let desc = ""
                    const nRole = tempMsg.match(/\d{10,}/)?.[0] ?? ""
                    if (nRole) {
                        const found = message.guild?.roles.cache.get(nRole)
                        if (!found) return msg.reply(`Invalid role ${discord.getEmoji("kannaFacepalm")}`)
                        current.mention = `<@&${nRole}>`
                        desc += `${discord.getEmoji("star")}Role mention set to <@&${nRole}>!\n`
                    } else {
                        current.mention = ""
                        desc += `${discord.getEmoji("star")}Role mentions removed!\n`
                    }
                    const config = await sql.fetchColumn("twitch", "config", "channel", current.channel)
                    const index = config.findIndex((c: any) => {
                        if (c.guild === current.guild && c.text === current.text && c.state === current.state) return true
                    })
                    config[index] = current
                    await sql.updateColumn("twitch", "config", config, "channel", current.channel)
                    responseEmbed.setDescription(desc)
                    return discord.send(msg, responseEmbed)
                } else {
                    responseEmbed
                    .setDescription(`${discord.getEmoji("star")}Setting not found!`)
                    return discord.send(msg, responseEmbed)
                }
            }

            let [setChannel, setText, setRole] = [false, false, false]

            const newText = msg.content.match(/(?<=<#)(.*?)(?=>)/)?.[0] ?? ""
            const newRole = msg.content.replace(newText, "").match(/\d{10,}/)?.[0] ?? ""
            const newChannel = msg.content.replace(newRole, "").replace(/(<#)(.*?)(>)/, "")?.trim() ?? ""

            if (newText) setText = true
            if (newRole) setRole = true
            if (newChannel) setChannel = true

            let description = ""
            const request = {} as any
            request.guild = message.guild?.id

            if (channels.length >= 5) {
                return discord.send(msg, responseEmbed.setDescription("You can set a maximum of 5 twitch channels!"))
            }

            if (setChannel) {
                const found = channels.find((c: string) => c === newChannel)
                if (!found) channels.push(newChannel)
                try {
                    await SQLQuery.insertInto("twitch", "channel", newChannel)
                } catch {
                    // Do nothing
                } finally {
                    request.channel = newChannel
                    description += `${discord.getEmoji("star")}Twitch channel set to [**${newChannel}**](https://www.twitch.tv/${newChannel})!\n`
                }
            }

            if (setText) {
                request.text = newText
                description += `${discord.getEmoji("star")}Text channel set to <#${newText}>!\n`
            }

            if (setRole) {
                request.mention = `<@&${newRole}>`
                description += `${discord.getEmoji("star")}Role mention set to <@&${newRole}>!\n`
            }

            if (setChannel && setText) {
                const text = message.guild?.channels.cache.get(newText) as TextChannel
                if (!text || text.type !== ChannelType.GuildText) return message.reply(`Invalid text channel ${discord.getEmoji("kannaFacepalm")}`)
                try {
                    const webhooks = await text.fetchWebhooks()
                    let webhook: Webhook
                    if (webhooks.first()?.name === "Twitch") {
                        webhook = webhooks.first()!
                    } else {
                        webhook = await text.createWebhook({name: "Twitch", avatar: discord.user!.displayAvatarURL({extension: "png"})})
                    }
                    request.id = webhook.id
                    request.token = webhook.token
                    request.state = "On"
                    description += `${discord.getEmoji("star")}State is **on**!\n`
                    let config = await sql.fetchColumn("twitch", "config", "channel", newChannel)
                    if (!config) config = []
                    config.push(request)
                    await sql.updateColumn("twitch", "config", config, "channel", newChannel)
                } catch {
                    return message.reply(`I need the **Manage Webhooks** permission in order to send livestream notifications ${discord.getEmoji("kannaFacepalm")}`)
                }
            } else {
                return message.reply(`Setting both the twitch channel and text channel is required.`)
            }
            if (!description) return message.reply(`No edits were made ${discord.getEmoji("kannaFacepalm")}`)
            await sql.updateColumn("guilds", "twitch channels", channels)
            responseEmbed.setDescription(description)
            return discord.send(msg, responseEmbed)
        }
        await embeds.createPrompt(twitchPrompt)
    }
}
