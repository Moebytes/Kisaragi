 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {GuildEmoji, ApplicationEmoji, Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Functions} from "../../structures/Functions"

export default class React extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: `Adds a reaction to a message.`,
            help:
            `
            \`react emoji/name/id\` - Adds a reaction from this server
            \`react bot emoji/name/id\` - Adds a reaction from the bot's emojis.
            \`react global emoji/name/id\` - Finds a reaction from all servers that the bot is in.
            \`react msg/message id dev?/global? emoji/name/id\` - Adds a reaction to the specified message instead of the last one.
            `,
            examples:
            `
            \`=>react raphiOMG\`
            `,
            aliases: ["reaction"],
            cooldown: 5,
            subcommandEnabled: true
        })
        const fourthOption = new SlashCommandOption()
            .setType("string")
            .setName("emoji4")
            .setDescription("This is the emoji for the bot/global msg subcommand.")

        const thirdOption = new SlashCommandOption()
            .setType("string")
            .setName("emoji3")
            .setDescription("This can be an emoji or bot/global for the msg subcommand.")

        const secondOption = new SlashCommandOption()
            .setType("string")
            .setName("emoji2")
            .setDescription("This can be an emoji or message id for the msg subcommand.")

        const firstOption = new SlashCommandOption()
            .setType("string")
            .setName("emoji")
            .setDescription("This can be an emoji or bot/global/msg for additional subcommands.")
            .setRequired(true)

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(firstOption)
            .addOption(secondOption)
            .addOption(thirdOption)
            .addOption(fourthOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        if (!args[1]) return this.reply(`What reaction do you want to add ${discord.getEmoji("kannaFacepalm")}`)

        let lastMessage = await discord.getLastMessage(message)

        if (args[1] === "msg" || args[1] === "message") {
            const msg = await discord.fetchMessage(message, args[2]) as Message ?? message
            if (msg) {
                lastMessage = msg
            } else {
                return this.reply(`Can't find this message ${discord.getEmoji("kannaFacepalm")}`)
            }
            args.shift()
            args.shift()
        }
        let emoji: GuildEmoji | ApplicationEmoji | null
        switch (args[1]) {
            case "bot":
                if (!args[2]) return this.reply(`What reaction do you want to add ${discord.getEmoji("kannaFacepalm")}`)
                emoji = discord.getEmoji(args[2])
                break
            case "global":
                if (!args[2]) return this.reply(`What reaction do you want to add ${discord.getEmoji("kannaFacepalm")}`)
                emoji = discord.getEmojiGlobal(args[2], true)
                break
            default:
                emoji = discord.getEmojiServer(args[1], message, true)
        }
        if (!emoji) return this.reply(`Could not find this emoji ${discord.getEmoji("kannaFacepalm")}`)

        await lastMessage.react(emoji)
        Functions.deferDelete(message, 0)
    }
}
