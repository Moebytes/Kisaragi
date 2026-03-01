/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {TextChannel, Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Topic extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Sets the topic on the current channel.",
          help:
          `
          \`topic newtopic\` - Sets the new topic
          `,
          examples:
          `
          \`=>topic general chat\`
          `,
          guildOnly: true,
          cachedGuildOnly: true,
          aliases: ["channeltopic"],
          cooldown: 5,
          subcommandEnabled: true
        })
        const topicOption = new SlashCommandOption()
            .setType("string")
            .setName("topic")
            .setDescription("The new topic.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(topicOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        if (!await perms.checkMod()) return

        const topic = Functions.combineArgs(args, 1).trim()
        if (!topic) return this.reply(`You need to specify what you want to set the topic to ${discord.getEmoji("kannaCurious")}`)

        await (message.channel as TextChannel).setTopic(topic, "Changed the channel topic to a better one.").catch(() => null)
        return this.reply(`Set the topic to: **${topic}** ${discord.getEmoji("aquaUp")}`)
    }
}
