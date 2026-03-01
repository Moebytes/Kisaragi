 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder, Role} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Roles extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Info on all roles.",
            help:
            `
            \`roles\` - Posts all of the roles
            `,
            examples:
            `
            \`=>roles\`
            `,
            guildOnly: true,
            random: "none",
            aliases: [],
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
        const roles = message.guild!.roles
        const roleArray = roles.cache.map((r: Role) => r.name)
        const idArray = roles.cache.map((r: Role) => r.id)
        const createdArray = roles.cache.map((r: Role) => r.createdAt)
        const step = 7.0
        const increment = Math.ceil(roles.cache.size / step)
        const userEmbedArray: EmbedBuilder[] = []
        for (let i = 0; i < increment; i++) {
            const userEmbed = embeds.createEmbed()
            let description = ""
            for (let j = 0; j < step; j++) {
                const value = (i*step)+j
                if (!roleArray[value]) break
                description += `${discord.getEmoji("star")}_Role:_ **${roleArray[value]}**\n` +
                `${discord.getEmoji("star")}_Role ID:_ \`${idArray[value]}\`\n` +
                `${discord.getEmoji("star")}_Creation Date:_ ${Functions.formatDate(createdArray[value])}\n`
            }
            userEmbed
            .setAuthor({name: "roles", iconURL: "https://kisaragi.moe/assets/embed/info.png"})
            .setTitle(`**${message.guild!.name}'s Roles** ${discord.getEmoji("vigneDead")}`)
            .setThumbnail(message.guild!.iconURL({extension: "png"}) as string)
            .setDescription(`${discord.getEmoji("star")}_Role Count:_ **${roleArray.length}**\n` + description)
            userEmbedArray.push(userEmbed)
        }
        return embeds.createReactionEmbed(userEmbedArray)
    }
}
