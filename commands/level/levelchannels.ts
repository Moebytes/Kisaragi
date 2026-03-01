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

export default class LevelChannels extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Sets the channels where no xp will be awarded.",
            help:
            `
            \`levelchannels\` - Opens the level channels prompt
            \`levelchannels #channel1 #channel2\` - Sets channels ignored by xp gaining
            \`levelchannels delete setting\` - Deletes a channel
            \`levelchannels reset\` - Deletes all channels
            `,
            examples:
            `
            \`=>levelchannels #spam\`
            `,
            guildOnly: true,
            cachedGuildOnly: true,
            aliases: ["pointchannels"],
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const settingOption = new SlashCommandOption()
            .setType("string")
            .setName("setting")
            .setDescription("Setting to delete in the delete subcommand.")

        const channelOption = new SlashCommandOption()
            .setType("string")
            .setName("channel")
            .setDescription("Can be delete/reset or a channel.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(channelOption)
            .addOption(settingOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const sql = new SQLQuery(message)
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        if (!message.channel.isSendable()) return
        if (!await perms.checkMod()) return
        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            await detectPrompt(message)
            return
        }

        const channels = await sql.fetchColumn("guilds", "level channels")
        const step = 5.0
        const increment = Math.ceil((channels ? channels.length : 1) / step)
        const levelChannelArr: EmbedBuilder[] = []
        for (let i = 0; i < increment; i++) {
            let description = ""
            for (let j = 0; j < step; j++) {
                if (channels) {
                    const k = (i*step)+j
                    if (!channels[k]) break
                    description += `**${k + 1} =>**\n` +
                    `${discord.getEmoji("star")}Channel: <#${channels[k]}>\n`
                } else {
                    description = "None"
                }
            }
            const levelEmbed = embeds.createEmbed()
            levelEmbed
            .setTitle(`**Level Channels** ${discord.getEmoji("think")}`)
            .setThumbnail(message.guild!.iconURL({extension: "png"})!)
            .setDescription(Functions.multiTrim(`
                Channels in this list are ignored from xp gain.
                newline
                __Current Settings__
                ${description}
                newline
                __Edit Settings__
                ${discord.getEmoji("star")}_**Mention channels** to add channels._
                ${discord.getEmoji("star")}_Type **delete (setting number)** to remove a channel._
                ${discord.getEmoji("star")}_Type **reset** to delete all channels._
                ${discord.getEmoji("star")}_Type **cancel** to exit._
            `))
            levelChannelArr.push(levelEmbed)
        }

        if (levelChannelArr.length > 1) {
            embeds.createReactionEmbed(levelChannelArr)
        } else {
            this.reply(levelChannelArr[0])
        }

        async function detectPrompt(msg: Message) {
            let channels = await sql.fetchColumn("guilds", "level channels")
            const responseEmbed = embeds.createEmbed()
            responseEmbed.setTitle(`**Level Channels** ${discord.getEmoji("think")}`)
            if (!channels) channels = []
            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                discord.send(msg, responseEmbed)
                return
            }
            if (msg.content.toLowerCase() === "reset") {
                await sql.updateColumn("guilds", "level channels", null)
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}All settings were **reset**!`)
                discord.send(msg, responseEmbed)
                return
            }

            if (msg.content.toLowerCase().startsWith("delete")) {
                const newMsg = Number(msg.content.replace(/delete/g, "").trim())
                const num = newMsg - 1
                if (newMsg) {
                    channels[num] = ""
                    channels = channels.filter(Boolean)
                    await sql.updateColumn("guilds", "level channels", channels)
                    return discord.send(msg, responseEmbed.setDescription(`Setting **${newMsg}** was deleted!`))
                } else {
                    return discord.send(msg, responseEmbed.setDescription("Setting not found!"))
                }
            }

            const newChan = msg.content.match(/(?<=<#)(.*?)(?=>)/g)
            if (!newChan?.join("")) return msg.reply("You did not mention any channels!")

            let description = ""

            for (let i = 0; i < newChan!.length; i++) {
                channels.push(newChan[i])
                description += `${discord.getEmoji("star")}Added <#${newChan[i]}>!\n`
            }
            await sql.updateColumn("guilds", "level channels", channels)
            responseEmbed
            .setDescription(description)
            return discord.send(msg, responseEmbed)
        }

        await embeds.createPrompt(detectPrompt)
    }
}
