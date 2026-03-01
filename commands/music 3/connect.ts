 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, VoiceChannel, ChannelType} from "discord.js"
import {joinVoiceChannel} from "@discordjs/voice"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Connect extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Connects to a voice channel.",
            help:
            `
            \`connect channel/mention/id?\` - Joins the channel you are in, or the channel mentioned.
            `,
            examples:
            `
            \`=>connect\`
            `,
            aliases: ["join"],
            guildOnly: true,
            cachedGuildOnly: true,
            cooldown: 10,
            subcommandEnabled: true
        })
        const channelOption = new SlashCommandOption()
            .setType("channel")
            .setName("channel")
            .setDescription("The voice channel to connect to (if not specified it's the one you are in).")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(channelOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        if (!message.guild) return

        let voiceChannel = null as unknown as VoiceChannel

        if (message.member?.voice.channel) {
            voiceChannel = message.member.voice.channel as VoiceChannel
        } else if (!message.member?.voice.channel) {
            if (!args[1]) {
                voiceChannel = message.guild?.channels.cache.find((c) => c.type === ChannelType.GuildVoice) as VoiceChannel
                if (!voiceChannel) return this.reply("Could not find a channel to join!")
            } else {
                if (args[1].match(/\d{15,}/)) {
                    voiceChannel = message.guild?.channels.cache.find((c) => c.id === args[1].match(/\d{15,}/)?.[0]) as VoiceChannel
                    if (!voiceChannel) return this.reply("Could not find a channel to join!")
                } else {
                    voiceChannel = message.guild?.channels.cache.find((c) => c.name.toLowerCase().includes(args[1].toLowerCase()) && c.type === ChannelType.GuildVoice) as VoiceChannel
                    if (!voiceChannel) return this.reply("Could not find a channel to join!")
                }
            }

        }
        try {
            joinVoiceChannel({guildId: message.guild.id, channelId: voiceChannel.id, adapterCreator: message.guild.voiceAdapterCreator, selfDeaf: false})
        } catch {
            return this.reply(`This is not a voice channel, or I don't have the **Connect** permission. ${discord.getEmoji("kannaFacepalm")}`)
        }
        return this.reply(`Connected to the channel **<#${voiceChannel.id}>**!`)
    }
}
