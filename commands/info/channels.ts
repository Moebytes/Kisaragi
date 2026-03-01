/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder, GuildBasedChannel} from "discord.js"
import {SlashCommandSubcommand} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Channels extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Info on all channels.",
            help:
            `
            \`channels\` - Posts all of the channels
            `,
            examples:
            `
            \`=>channels\`
            `,
            guildOnly: true,
            aliases: [],
            random: "none",
            cooldown: 3,
            subcommandEnabled: true
        })
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const channels = message.guild!.channels
        const channelArray = channels.cache.map((t: GuildBasedChannel) => t.name)
        const idArray = channels.cache.map((t: GuildBasedChannel) => t.id)
        const createdArray = channels.cache.map((t: GuildBasedChannel) => t.createdAt)
        const step = 7.0
        const increment = Math.ceil(channels.cache.size / step)
        const userEmbedArray: EmbedBuilder[] = []
        for (let i = 0; i < increment; i++) {
            const userEmbed = embeds.createEmbed()
            let description = ""
            for (let j = 0; j < step; j++) {
                const value = (i*step)+j
                if (!channelArray[value]) break
                description += `${discord.getEmoji("star")}_Channel:_ **${channelArray[value]}**\n` +
                `${discord.getEmoji("star")}_Channel ID:_ \`${idArray[value]}\`\n` +
                `${discord.getEmoji("star")}_Creation Date:_ ${Functions.formatDate(createdArray[value]!)}\n`
            }
            userEmbed
            .setAuthor({name: "channels", iconURL: "https://kisaragi.moe/assets/embed/info.png"})
            .setTitle(`**${message.guild!.name}'s Channels** ${discord.getEmoji("vigneDead")}`)
            .setThumbnail(message.guild!.iconURL({extension: "png"}) as string)
            .setDescription(`${discord.getEmoji("star")}_Channel Count:_ **${channelArray.length}**\n` + description)
            userEmbedArray.push(userEmbed)
        }
        embeds.createReactionEmbed(userEmbedArray)
    }
}
