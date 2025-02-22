import {GuildBasedChannel, ChannelType, Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Link extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Configure settings for linked channels.",
            help:
            `
            \`link\` - Shows the linked channels prompt.
            \`link #textchannel? voicechannel?\` - Sets the text and voice channel that are linked.
            \`link toggle setting\` - Enables or disables a setting.
            \`link edit setting #textchannel? voicechannel?\` - Edits an existing setting.
            \`link delete setting\` - Deletes a setting.
            \`link reset\` - Deletes all settings.
            `,
            examples:
            `
            \`=>link #music-commands music\`
            \`=>link #voice-chat voice\`
            `,
            aliases: ["links", "linked", "linkchannel"],
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
            .setDescription("Can be delete/edit/toggle/reset or setting input.")
            
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
            await linkPrompt(message)
            return
        }
        const linked = await sql.fetchColumn("guilds", "linked")
        const step = 3.0
        const increment = Math.ceil((linked ? linked.length : 1) / step)
        const linkArray: EmbedBuilder[] = []
        for (let i = 0; i < increment; i++) {
            let settings = ""
            for (let j = 0; j < step; j++) {
                if (linked) {
                    const k = (i*step)+j
                    if (!linked.join("")) settings = "None"
                    if (!linked[k]) break
                    const curr = JSON.parse(linked[k])
                    settings += `${k + 1} **=>**\n` +
                    `${discord.getEmoji("star")}_Text:_ **${curr.text ? `<#${curr.text}>` : "None"}**\n`+
                    `${discord.getEmoji("star")}_Voice:_ **${curr.voice ? `**<#${curr.voice}>**` : "None"}**\n`+
                    `${discord.getEmoji("star")}_State:_ **${curr.state ? curr.state : "None"}**\n`
                } else {
                    settings = "None"
                }
            }
            const linkEmbed = embeds.createEmbed()
            linkEmbed
            .setTitle(`**Linked Channels** ${discord.getEmoji("gabSip")}`)
            .setThumbnail(message.guild!.iconURL({extension: "png"})!)
            .setDescription(Functions.multiTrim(`
            Configure settings for linked channels. You can link a text channel to a voice channel so that only people in the voice channel can access it.
            In order for this to work, you should disable the **read messages** permission on the text channel for all member roles.
            newline
            **Status** - Either on or off. In order for the status to be on, both the voice and text channel must be set.
            newline
            __Current Settings:__
            ${settings}
            newline
            __Edit Settings:__
            ${discord.getEmoji("star")}_**Mention a text channel** to set the text channel._
            ${discord.getEmoji("star")}_**Type the name of the voice channel** to set the voice channel._
            ${discord.getEmoji("star")}_Type **toggle (setting number)** to toggle the status._
            ${discord.getEmoji("star")}_Type **edit (setting number)** to edit a setting._
            ${discord.getEmoji("star")}_Type **delete (setting number)** to delete a setting._
            ${discord.getEmoji("star")}_Type **reset** to delete all settings._
            ${discord.getEmoji("star")}_Type **cancel** to exit._
        `))
            linkArray.push(linkEmbed)
        }

        if (linkArray.length === 1) {
            this.reply(linkArray[0])
        } else {
            embeds.createReactionEmbed(linkArray)
        }

        async function linkPrompt(msg: Message) {
            let linked = await sql.fetchColumn("guilds", "linked")
            let [setText, setVoice] = [] as boolean[]
            if (!linked) linked = []
            const responseEmbed = embeds.createEmbed()
            responseEmbed.setTitle(`**Linked Channels** ${discord.getEmoji("gabSip")}`)
            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                return discord.send(msg, responseEmbed)
            }
            if (msg.content.toLowerCase() === "reset") {
                await sql.updateColumn("guilds", "linked", null)
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}All settings were reset!`)
                return discord.send(msg, responseEmbed)
            }
            if (msg.content.toLowerCase().includes("delete")) {
                const num = Number(msg.content.replace(/delete/gi, "").replace(/\s+/g, ""))
                if (num) {
                    if (linked[num - 1]) {
                        linked[num - 1] = ""
                        linked = linked.filter(Boolean)
                        await sql.updateColumn("guilds", "linked", linked)
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
            if (msg.content.toLowerCase().startsWith("toggle")) {
                const newMsg = Number(msg.content.replace(/toggle/g, "").trim())
                const num = newMsg - 1
                const testLink = await sql.fetchColumn("guilds", "linked")
                if (newMsg && testLink?.[num]) {
                        if (testLink[num].state === "off") {
                            testLink[num].state = "on"
                            await sql.updateColumn("guilds", "linked", testLink)
                            return discord.send(msg, responseEmbed.setDescription(`State of setting **${newMsg}** is now **on**!`))
                        } else {
                            testLink[num].state = "off"
                            await sql.updateColumn("guilds", "linked", testLink)
                            return discord.send(msg, responseEmbed.setDescription(`State of setting **${newMsg}** is now **off**!`))
                        }
                } else {
                    return discord.send(msg, responseEmbed.setDescription("You cannot use the toggle command on an unfinished setting!"))
                }
            }

            if (msg.content.toLowerCase().startsWith("edit")) {
                const newMsg = msg.content.replace(/edit/g, "").trim().split(" ")
                const tempMsg = newMsg.slice(1).join(" ")
                const num = Number(newMsg[0]) - 1
                if (tempMsg && linked?.[num]) {
                    linked[num] = JSON.parse(linked[num])
                    let editDesc = ""
                    const tempText = tempMsg.match(/(?<=<#)\d+(?=>)/g)?.[0] ?? ""
                    const tempVoice = tempMsg.replace(/<#\d+>/g, "").match(/\D+/gi)?.[0].trim() ?? ""
                    if (tempText) {
                        linked[num].text = tempText
                        editDesc += `${discord.getEmoji("star")}Text channel set to <#${tempText!}>!\n`
                    }
                    if (tempVoice) {
                        const channels = msg.guild!.channels.cache.filter((c: GuildBasedChannel) => {
                            const type = c.type === ChannelType.GuildVoice ? true : false
                            return type
                        })
                        const channel = channels.find((c: GuildBasedChannel) => {
                            const name = (c.name.toLowerCase().includes(tempVoice.toLowerCase())) ? true : false
                            return name
                        })
                        if (channel) {
                            linked[num].voice = channel.id
                            editDesc += `${discord.getEmoji("star")}Voice channel set to **<#${channel.id}>**!\n`
                        } else {
                            return discord.send(msg, responseEmbed.setDescription("Voice channel not found!"))
                        }
                    }
                    if (setText && setVoice) {
                        linked[num].state = "on"
                        editDesc += `${discord.getEmoji("star")}Status set to **on**!\n`
                    } else {
                        linked[num].state = "off"
                        editDesc += `${discord.getEmoji("star")}Status set to **off**!\n`
                    }
                    await sql.updateColumn("guilds", "linked", linked)
                    return discord.send(msg, responseEmbed.setDescription(editDesc))
                } else {
                    return discord.send(msg, responseEmbed.setDescription("No edits specified!"))
                }
            }

            const newText = msg.content.match(/(?<=<#)\d+(?=>)/g)?.[0] ?? ""
            const newVoice = msg.content.replace(/<#\d+>/g, "").match(/\D+/gi)?.[0].trim() ?? ""
            if (newText) setText = true
            if (newVoice) setVoice = true

            let description = ""
            const obj = {} as any

            if (setText) {
                obj.text = newText
                description += `${discord.getEmoji("star")}Text channel set to <#${newText!}>!\n`
            }

            if (setVoice) {
                const channels = msg.guild!.channels.cache.filter((c: GuildBasedChannel) => {
                    const type = c.type === ChannelType.GuildVoice ? true : false
                    return type
                })
                const channel = channels.find((c: GuildBasedChannel) => {
                    const name = (c.name.toLowerCase().includes(newVoice.toLowerCase())) ? true : false
                    return name
                })
                if (channel) {
                    obj.voice = channel.id
                    description += `${discord.getEmoji("star")}Voice channel set to **<#${channel.id}>**!\n`
                } else {
                    return discord.send(msg, responseEmbed.setDescription("Voice channel not found!"))
                }
            }

            if (setText && setVoice) {
                obj.state = "on"
                description += `${discord.getEmoji("star")}Status set to **on**!\n`
            } else {
                obj.state = "off"
                description += `${discord.getEmoji("star")}Status set to **off**!\n`
            }

            if (!description) description = `${discord.getEmoji("star")}Invalid arguments provided, canceled the prompt.`
            linked.push(obj)
            await sql.updateColumn("guilds", "linked", linked)
            responseEmbed
            .setDescription(description)
            return discord.send(msg, responseEmbed)
        }

        await embeds.createPrompt(linkPrompt)
    }
}
