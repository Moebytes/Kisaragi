 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import nekoClient from "nekos.life"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Pat extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Pats someone.",
            help:
            `
            \`pat @user\` - Pats the user.
            \`pat\` - Pats no one...
            `,
            examples:
            `
            \`=>hug @user\`
            `,
            aliases: [],
            cooldown: 3,
            subcommandEnabled: true
        })
        const userOption = new SlashCommandOption()
            .setType("mentionable")
            .setName("user")
            .setDescription("User to pat.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(userOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        if (discord.checkMuted(message)) if (!perms.checkNSFW()) return
        const neko = new nekoClient()

        let name = "someone"
        if (args[1]) {
            const userID = args[1].match(/\d+/)?.[0] || ""
            const user = await message.guild?.members.fetch(userID)
            if (user) {
                name = user.user.username
                if (user.id === message.author.id) name = "themselves"
                if (user.id === discord.user!.id) name = "me"
            }
        }

        let flavorText = `${discord.getEmoji("kannaPat")}`
        if (name === "themselves") flavorText = `It's ok... ${discord.getEmoji("kannaPat")}`
        if (name === "someone") flavorText = `Free pats ${discord.getEmoji("aquaWut")}`
        if (name === "me") flavorText = `Thanks ${discord.getEmoji("yes")}`

        const image = await neko.pat()

        const patEmbed = embeds.createEmbed()
        patEmbed
        .setURL(image.url)
        .setTitle(`**Pat** ${discord.getEmoji("kannaPat")}`)
        .setDescription(`**${message.author.username}** pats **${name}**! ${flavorText}`)
        .setImage(image.url)
        return this.reply(patEmbed)
    }
}
