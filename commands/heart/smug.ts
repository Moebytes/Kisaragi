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

export default class Smug extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Posts a smug face.",
            help:
            `
            \`smug @user\` - Be smug to someone.
            \`smug\` - Posts a smug image.
            `,
            examples:
            `
            \`=>smug @user\`
            `,
            aliases: [],
            cooldown: 3,
            subcommandEnabled: true
        })
        const userOption = new SlashCommandOption()
            .setType("mentionable")
            .setName("user")
            .setDescription("User to send a smug face.")
            
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

        let flavorText = `${discord.getEmoji("smugFace")}`
        if (name === "themselves") flavorText = `Nice... ${discord.getEmoji("aquaUp")}`
        if (name === "someone") flavorText = `Cool ${discord.getEmoji("raphi")}`
        if (name === "me") flavorText = `Hmm alright ${discord.getEmoji("tohruThink")}`

        const image = await neko.smug()

        const smugEmbed = embeds.createEmbed()
        smugEmbed
        .setURL(image.url)
        .setTitle(`**Smug** ${discord.getEmoji("chinoSmug")}`)
        .setDescription(`**${message.author.username}** is being smug to **${name}**! ${flavorText}`)
        .setImage(image.url)
        return this.reply(smugEmbed)
    }
}
