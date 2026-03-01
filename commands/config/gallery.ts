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

export default class Gallery extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Configures gallery (image only) channels.",
            help:
            `
            \`gallery\` - Opens the gallery prompt
            \`gallery #channel1 #channel2\` - Add gallery channels
            \`gallery delete setting\` - Deletes a channel
            \`gallery reset\` - Deletes all channels
            `,
            examples:
            `
            \`=>gallery #channel\`
            `,
            guildOnly: true,
            cachedGuildOnly: true,
            aliases: [],
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
            .setDescription("Can be #channel/delete/reset.")
            
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
        if (!message.channel.isSendable()) return
        if (!await perms.checkAdmin()) return
        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            await galleryPrompt(message)
            return
        }

        const gallery = await sql.fetchColumn("guilds", "gallery")
        const step = 5.0
        const increment = Math.ceil((gallery ? gallery.length : 1) / step)
        const galleryArray: EmbedBuilder[] = []
        for (let i = 0; i < increment; i++) {
            let description = ""
            for (let j = 0; j < step; j++) {
                if (gallery) {
                    const k = (i*step)+j
                    if (!gallery[k]) break
                    description += `**${k + 1} =>**\n` +
                    `${discord.getEmoji("star")}Channel: <#${gallery[k]}>\n`
                } else {
                    description = "None"
                }
            }
            const galleryEmbed = embeds.createEmbed()
            galleryEmbed
            .setTitle(`**Gallery Channels** ${discord.getEmoji("raphiOMG")}`)
            .setThumbnail(message.guild!.iconURL({extension: "png"})!)
            .setDescription(Functions.multiTrim(`
                Add gallery (image only) channels.
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
            galleryArray.push(galleryEmbed)
        }

        if (galleryArray.length > 1) {
            embeds.createReactionEmbed(galleryArray)
        } else {
            this.reply(galleryArray[0])
        }

        async function galleryPrompt(msg: Message) {
            let gallery = await sql.fetchColumn("guilds", "gallery")
            const responseEmbed = embeds.createEmbed()
            responseEmbed.setTitle(`**Gallery Channels** ${discord.getEmoji("raphiOMG")}`)
            if (!gallery) gallery = []
            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                discord.send(msg, responseEmbed)
                return
            }
            if (msg.content.toLowerCase() === "reset") {
                await sql.updateColumn("guilds", "gallery", null)
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}All settings were **reset**!`)
                discord.send(msg, responseEmbed)
                return
            }
            if (msg.content.toLowerCase().startsWith("delete")) {
                const newMsg = Number(msg.content.replace(/delete/g, "").trim())
                const num = newMsg - 1
                if (newMsg) {
                    gallery[num] = ""
                    gallery = gallery.filter(Boolean)
                    await sql.updateColumn("guilds", "gallery", gallery)
                    return discord.send(msg, responseEmbed.setDescription(`Setting **${newMsg}** was deleted!`))
                } else {
                    return discord.send(msg, responseEmbed.setDescription("Setting not found!"))
                }
            }

            const newChan = msg.content.match(/(?<=<#)(.*?)(?=>)/g)
            if (!newChan?.join("")) return msg.reply("You did not mention any channels!")

            let description = ""

            for (let i = 0; i < newChan.length; i++) {
                gallery.push(newChan[i])
                description += `${discord.getEmoji("star")}Added <#${newChan[i]}>!\n`
            }
            await sql.updateColumn("guilds", "gallery", gallery)
            responseEmbed
            .setDescription(description)
            return discord.send(msg, responseEmbed)
        }

        await embeds.createPrompt(galleryPrompt)
    }
}
