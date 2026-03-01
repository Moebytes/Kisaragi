/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, TextChannel, ChannelType, HexColorString} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Create extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Create channels, roles, and emojis.",
            help:
            `
            \`create channel name above? reason?\` - Creates a new channel with the name above the current one, or above the "above" channel.
            \`create role role-name? #color? position? hoisted? mentionable?\` - Creates a role with these properties. Dashes and underscores in the name are replaced by spaces.
            \`create emoji name imageLink? reason?\` - Creates a new emoji with the name, if no image link is provided the last sent image is used (if found).
            `,
            examples:
            `
            \`=>create channel anime-chat gamer-chat\`
            \`=>create role Members #bf4dff 10 true true\`
            \`=>create emoji smugFace\`
            `,
            aliases: [],
            guildOnly: true,
            cachedGuildOnly: true,
            cooldown: 10,
            subcommandEnabled: true
        })
        const reasonOption = new SlashCommandOption()
            .setType("string")
            .setName("reason")
            .setDescription("Optional reason for creation.")

        const nameOption = new SlashCommandOption()
            .setType("string")
            .setName("name")
            .setDescription("Name and other options.")

        const typeOption = new SlashCommandOption()
            .setType("string")
            .setName("type")
            .setDescription("Can be channel/role/emoji.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(typeOption)
            .addOption(nameOption)
            .addOption(reasonOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const embeds = new Embeds(discord, message)
        if (!await perms.checkAdmin()) return
        if (!args[1]) return this.reply(`You need to specify whether you are creating a **channel**, **role**, or **emoji** ${discord.getEmoji("kannaCurious")}`)

        if (args[1] === "channel") {
            const channel = message.channel as TextChannel
            let position = (channel.position === 0) ? channel.position - 1 : 0
            const parent = channel.parent ? channel.parent : undefined
            const newArgs = Functions.combineArgs(args, 2).split(" ")
            const name = newArgs[0]
            const above = newArgs[1]?.toLowerCase()
            const reason = newArgs[2] ? Functions.combineArgs(newArgs, 2).trim() : "None provided!"
            if (above) {
                position = (message.guild!.channels.cache.find((c) => c.name.toLowerCase().includes(above)) as TextChannel)!.position + 1
            }
            if (position < 0) position = 0
            if (!name) return this.reply("You must provide a name for the channel.")
            try {
                const nChannel = await message.guild!.channels.create({name, position, parent, reason, type: ChannelType.GuildText})
                const createEmbed = embeds.createEmbed()
                createEmbed
                .setAuthor({name: "create", iconURL: "https://kisaragi.moe/assets/embed/create.png"})
                .setTitle(`**Channel Creation** ${discord.getEmoji("gabYes")}`)
                .setDescription(`The channel **<#${nChannel.id}>** was created for reason: **${reason}**`)
                return this.reply(createEmbed)
            } catch {
                return this.reply("Could not create this channel, I need the **Manage Channels** permission.")
            }
        }

        if (args[1] === "role") {
            let name = "New Role"
            let color = "#ff4dde" as HexColorString
            let position =  1
            let hoist = false
            let mentionable = false
            const newArgs = Functions.combineArgs(args, 2).split(" ")
            if (newArgs[0]) name = newArgs[0]
            if (newArgs[1]) color = newArgs[1] as HexColorString
            if (newArgs[2]) position = Number(newArgs[2])
            if (newArgs[3]) hoist = Boolean(newArgs[3])
            if (newArgs[4]) mentionable = Boolean(newArgs[4])
            try {
                const nRole = await message.guild!.roles.create({name, position, color, hoist, mentionable})
                const createEmbed = embeds.createEmbed()
                createEmbed
                .setAuthor({name: "create", iconURL: "https://kisaragi.moe/assets/embed/create.png"})
                .setTitle(`**Role Creation** ${discord.getEmoji("gabYes")}`)
                .setDescription(`The role **<@&${nRole.id}>** was created!`)
                return this.reply(createEmbed)
            } catch {
                return this.reply("Could not create this role, I need the **Manage Roles** permission.")
            }
        }

        if (args[1] === "emoji") {
            const newArgs = Functions.combineArgs(args, 2).split(" ")
            const name = newArgs[0]
            let image: string | undefined = newArgs[1]
            const reason = newArgs[2] ? Functions.combineArgs(newArgs, 2).trim() : "None provided!"
            if (!image) image = await discord.fetchLastAttachment(message)
            if (!name || !image) return this.reply(`You must provide a name for the emoji and an image link (I will also try searching for recently sent images.)`)
            try {
                const nEmoji = await message.guild!.emojis.create({attachment: image, name, reason})
                const emojiTag = nEmoji.animated ? `<${nEmoji.identifier}>` : `<:${nEmoji.identifier}>`
                const createEmbed = embeds.createEmbed()
                createEmbed
                .setAuthor({name: "create", iconURL: "https://kisaragi.moe/assets/embed/create.png"})
                .setTitle(`**Emoji Creation** ${discord.getEmoji("gabYes")}`)
                .setDescription(`The emoji **${emojiTag}** was created for reason: **${reason}**`)
                return this.reply(createEmbed)
            } catch {
                return this.reply("Could not create this emoji, I need the **Manage Emojis** permission.")
            }
        }
    }
}
