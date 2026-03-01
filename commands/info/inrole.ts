 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder, Role} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class InRole extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Lists all users in a role.",
            help:
            `
            \`inrole name/@role/id\` - Gets all users in this role
            `,
            examples:
            `
            \`=>inrole @kawaii\`
            `,
            guildOnly: true,
            aliases: ["roleinfo"],
            cooldown: 5,
            subcommandEnabled: true
        })
        const roleOption = new SlashCommandOption()
            .setType("role")
            .setName("role")
            .setDescription("The role to list users in.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(roleOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        let role: Role | undefined
        if (args[1]?.match(/\d{17,}/)) {
            role = message.guild?.roles.cache.find((r) => r.id === args[1]?.match(/\d{17,}/)![0])
        } else {
            const query = Functions.combineArgs(args, 1)?.trim()
            role = message.guild?.roles.cache.find((r) => r.name.toLowerCase().includes(query.toLowerCase()))
        }
        if (!role) return this.reply("Could not find this role!")
        const userArray = role.members.map((m) => m.user.tag)
        const step = 20.0
        const increment = Math.ceil(role.members.size! / step)
        const inRoleArray: EmbedBuilder[] = []
        for (let i = 0; i < increment; i++) {
            let description = ""
            for (let j = 0; j < step; j++) {
                const value = (i*step)+j
                if (!userArray[value]) break
                description += `\`${userArray[value]}\`\n`
            }
            const roleEmbed = embeds.createEmbed()
            roleEmbed
            .setAuthor({name: "inrole", iconURL: "https://kisaragi.moe/assets/embed/info.png"})
            .setThumbnail(message.guild!.iconURL({extension: "png"}) ?? "")
            .setTitle(`**Role Info** ${discord.getEmoji("kannaPat")}`)
            .setDescription(
            `${discord.getEmoji("star")}_Role:_ **<@&${role.id}>**\n` +
            `${discord.getEmoji("star")}_Creation Date:_ **${Functions.formatDate(role.createdAt)}**\n` +
            `${discord.getEmoji("star")}_Member Count:_ **${role.members.size}**\n` +
            `${discord.getEmoji("star")}_Members:_ ${description ? description : "None"}`
            )
            inRoleArray.push(roleEmbed)
        }
        if (!inRoleArray[0]) return this.reply(`No one is in this role ${discord.getEmoji("kannaFacepalm")}`)
        if (inRoleArray.length === 1) {
            this.reply(inRoleArray[0])
        } else {
            embeds.createReactionEmbed(inRoleArray)
        }
    }
}
