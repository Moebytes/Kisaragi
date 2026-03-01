/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Starboard extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Forwards messages that exceed a threshold of star reactions to a starboard channel.",
            help:
            `
            _Note: The star threshold must be at least 1._
            \`starboard\` - Opens the pinboard prompt
            \`starboard #channel num?\` - Sets the starboard channel and star threshold
            \`starboard reset\` - Resets all settings.
            `,
            examples:
            `
            \`=>starboard #starboard\`
            \`=>starboard 5\`
            `,
            aliases: [],
            guildOnly: true,
            cachedGuildOnly: true,
            botPermission: "ManageWebhooks",
            cooldown: 15,
            defer: true,
            subcommandEnabled: true
        })
        const numOption = new SlashCommandOption()
            .setType("string")
            .setName("threshold")
            .setDescription("Sets the star threshold.")

        const channelOption = new SlashCommandOption()
            .setType("string")
            .setName("channel")
            .setDescription("Can be #channel or reset.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(channelOption)
            .addOption(numOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const sql = new SQLQuery(message)
        const perms = new Permission(discord, message)
        if (!await perms.checkMod()) return
        if (!message.channel.isSendable()) return
        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            await pinboardPrompt(message)
            return
        }

        const starboard = await sql.fetchColumn("guilds", "starboard")
        const starThreshold = await sql.fetchColumn("guilds", "star threshold")
        const starEmoji = await sql.fetchColumn("guilds", "star emoji")

        const pinboardEmbed = embeds.createEmbed()
        pinboardEmbed
        .setTitle(`**Starboard** ${discord.getEmoji("tohruSmug")}`)
        .setThumbnail(message.guild!.iconURL({extension: "png"})!)
        .setDescription(Functions.multiTrim(`
            Edit starboard settings.
            newline
            **Starboard** - The channel where starred messages are posted.
            **Star Threshold** - The amount of star reactions a message needs.
            **Star Emoji** - The reaction that counts towards the star threshold.
            newline
            __Current Settings__
            ${discord.getEmoji("star")}Starboard: ${starboard ? `<#${starboard}>` : "None"}
            ${discord.getEmoji("star")}Star Threshold: ${starThreshold}
            ${discord.getEmoji("star")}Star Emoji: ${starEmoji}
            newline
            __Edit Settings__
            ${discord.getEmoji("star")}**Mention or type a channel id** to set the starboard channel.
            ${discord.getEmoji("star")}Type a **number** to set the star threshold.
            ${discord.getEmoji("star")}Post an **emoji or emoji name** to set the star emoji.
            ${discord.getEmoji("star")}Type **reset** to reset all settings.
            ${discord.getEmoji("star")}Type **cancel** to exit.
        `))

        this.reply(pinboardEmbed)

        async function pinboardPrompt(msg: Message) {
            const responseEmbed = embeds.createEmbed()
            .setTitle(`**Starboard** ${discord.getEmoji("tohruSmug")}`)

            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                return discord.send(msg, responseEmbed)
            }
            if (msg.content.toLowerCase() === "reset") {
                await sql.updateColumn("guilds", "starboard", null)
                await sql.updateColumn("guilds", "star threshold", 3)
                await sql.updateColumn("guilds", "star emoji", "⭐")
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Starboard settings were reset!`)
                return discord.send(msg, responseEmbed)
            }

            let [setStar, setThreshold, setEmoji] = [false, false, false]
            let newEmoji = msg.content.match(/(<a?:)(.*?)(>)/)?.[0] ?? ""
            const newStar = msg.content.replace(newEmoji, "").match(/\d{15,}/)?.[0] ?? ""
            const newThreshold = msg.content.replace(newEmoji, "").replace(newStar, "").match(/\d+/)?.[0] ?? ""
            const newMsg = msg.content.replace(newEmoji, "").replace(newThreshold, "").replace(newStar, "").replace(/<#|<a?:/g, "").replace(/>/g, "").replace(/(.*?):/g, "").trim()
            if (!newEmoji) {
                if (Functions.unicodeEmoji(newMsg)) {
                    newEmoji = newMsg
                } else {
                    const e = msg.guild?.emojis.cache.find((e) => e.name?.toLowerCase() === newMsg.toLowerCase())
                    if (e) newEmoji = e.animated ? `<${e.identifier}>` : `<:${e.identifier}>`
                }
            }

            if (Number(newStar)) setStar = true
            if (Number(newThreshold)) setThreshold = true
            if (newEmoji) setEmoji = true

            let description = ""

            if (setStar) {
                const channelTest = msg.guild?.channels.cache.get(newStar)
                if (!channelTest) return msg.reply(`Invalid starboard channel!`)
                await sql.updateColumn("guilds", "starboard", newStar)
                description += `${discord.getEmoji("star")}Starboard channel set to <#${newStar}>!\n`
            }

            if (setThreshold) {
                if (Number(newThreshold) < 1) return message.reply(`The star threshold must be at least 1 ${discord.getEmoji("sagiriBleh")}`)
                await sql.updateColumn("guilds", "star threshold", Number(newThreshold))
                description += `${discord.getEmoji("star")}Star threshold set to **${newThreshold}**!\n`
            }

            if (setEmoji) {
                await sql.updateColumn("guilds", "star emoji", newEmoji)
                description += `${discord.getEmoji("star")}Star emoji set to ${newEmoji}!\n`
            }

            if (!description) return msg.reply(`No additions were made, canceled ${discord.getEmoji("kannaFacepalm")}`)
            responseEmbed
            .setDescription(description)
            return discord.send(msg, responseEmbed)
        }

        await embeds.createPrompt(pinboardPrompt)
    }
}
