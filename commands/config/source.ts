/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"
import {SQLQuery} from "../../structures/SQLQuery"

export default class Source extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Configure auto image reverse search channels.",
            help:
            `
            \`source\` - Opens the source prompt
            \`source #channel1 #channel2\` - Add source channels
            \`source delete setting\` - Deletes a channel
            \`source reset\` - Deletes all channels
            `,
            examples:
            `
            \`=>source #channel\`
            `,
            guildOnly: true,
            cachedGuildOnly: true,
            aliases: ["autosaucenao"],
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const settingOption = new SlashCommandOption()
            .setType("string")
            .setName("setting")
            .setDescription("Can be a setting number.")

        const optOption = new SlashCommandOption()
            .setType("string")
            .setName("opt")
            .setDescription("Can be delete/reset or #channel.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(optOption)
            .addOption(settingOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const sql = new SQLQuery(message)
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        if (!await perms.checkAdmin()) return
        if (!message.channel.isSendable()) return
        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            await sourcePrompt(message)
            return
        }

        const sources = await sql.fetchColumn("guilds", "sources")
        const step = 5.0
        const increment = Math.ceil((sources ? sources.length : 1) / step)
        const sourceArray: EmbedBuilder[] = []
        for (let i = 0; i < increment; i++) {
            let description = ""
            for (let j = 0; j < step; j++) {
                if (sources) {
                    const k = (i*step)+j
                    if (!sources[k]) break
                    description += `**${k + 1} =>**\n` +
                    `${discord.getEmoji("star")}Channel: <#${sources[k]}>\n`
                } else {
                    description = "None"
                }
            }
            const sourceEmbed = embeds.createEmbed()
            sourceEmbed
            .setTitle(`**Source Channels** ${discord.getEmoji("tohruThumbsUp2")}`)
            .setThumbnail(message.guild!.iconURL({extension: "png"})!)
            .setDescription(Functions.multiTrim(`
                Channels added to this list will have all images reverse-searched on saucenao. This is only effective on anime artwork.
                newline
                __Current Settings__
                ${description}
                newline
                __Edit Settings__
                ${discord.getEmoji("star")}**Mention channels** to add channels.
                ${discord.getEmoji("star")}Type **reset** to delete all settings.
                ${discord.getEmoji("star")}Type **delete (setting number)** to delete a channel.
                ${discord.getEmoji("star")}Type **cancel** to exit.
            `))
            sourceArray.push(sourceEmbed)
        }

        if (sourceArray.length > 1) {
            embeds.createReactionEmbed(sourceArray)
        } else {
            this.reply(sourceArray[0])
        }

        async function sourcePrompt(msg: Message) {
            let sources = await sql.fetchColumn("guilds", "sources")
            const responseEmbed = embeds.createEmbed()
            responseEmbed.setTitle(`**Source Channels** ${discord.getEmoji("tohruThumbsUp2")}`)
            if (!sources) sources = []
            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                discord.send(msg, responseEmbed)
                return
            }
            if (msg.content.toLowerCase() === "reset") {
                await sql.updateColumn("guilds", "sources", null)
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}All settings were **reset**!`)
                discord.send(msg, responseEmbed)
                return
            }
            if (msg.content.toLowerCase().startsWith("delete")) {
                const newMsg = Number(msg.content.replace(/delete/g, "").trim())
                const num = newMsg - 1
                if (newMsg) {
                    sources[num] = ""
                    sources = sources.filter(Boolean)
                    await sql.updateColumn("guilds", "sources", sources)
                    return discord.send(msg, responseEmbed.setDescription(`Setting **${newMsg}** was deleted!`))
                } else {
                    return discord.send(msg, responseEmbed.setDescription("Setting not found!"))
                }
            }

            const newChan = msg.content.match(/(?<=<#)(.*?)(?=>)/g)
            if (!newChan?.join("")) return msg.reply("You did not mention any channels!")

            let description = ""

            for (let i = 0; i < newChan.length; i++) {
                sources.push(newChan[i])
                description += `${discord.getEmoji("star")}Added <#${newChan[i]}>!\n`
            }
            await sql.updateColumn("guilds", "sources", sources)
            responseEmbed
            .setDescription(description)
            return discord.send(msg, responseEmbed)
        }

        await embeds.createPrompt(sourcePrompt)
    }
}
