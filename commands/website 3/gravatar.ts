/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {DMChannel, Message, TextChannel} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import md5 from "md5"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Gravatar extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Gets the profile picture of a gravatar email.",
            help:
            `
            _Note: The invocation of this command is removed for privacy reasons._
            \`gravatar email\` - Gets the profile picture of the email
            `,
            examples:
            `
            \`=>gravatar someone@gmail.com\`
            `,
            aliases: [],
            random: "none",
            cooldown: 10,
            subcommandEnabled: true
        })
        const emailOption = new SlashCommandOption()
            .setType("string")
            .setName("email")
            .setDescription("Gets the avatar of this email.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(emailOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const email = args[1]
        if (!email) return this.reply(`You must provide an email address ${discord.getEmoji("kannaCurious")}`)
        if (message instanceof Message && message.channel instanceof TextChannel) await message.channel.bulkDelete(2)
        const hash = md5(email.trim().toLowerCase())
        const gravatarEmbed = embeds.createEmbed()
        .setAuthor({name: "gravatar", iconURL: "https://kisaragi.moe/assets/embed/gravatar.png", url: "https://en.gravatar.com/"})
        .setTitle(`**Gravatar Profile Picture** ${discord.getEmoji("kannaSpook")}`)
        .setImage(`https://www.gravatar.com/avatar/${hash}?size=500`)
        await this.reply("Here is your gravatar profile picture")
        return this.send(gravatarEmbed)
    }
}
