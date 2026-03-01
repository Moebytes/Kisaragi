 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"
import {Points} from "../../structures/Points"

export default class Zero extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Resets your points back to zero (no undo).",
            help:
            `
            \`zero\` - Resets your points
            \`zero @user/id\` - Reset someones points (Moderator only)
            `,
            examples:
            `
            \`=>zero\`
            `,
            guildOnly: true,
            cachedGuildOnly: true,
            aliases: ["resetpoints", "pointreset"],
            cooldown: 10,
            subcommandEnabled: true
        })
        const userOption = new SlashCommandOption()
            .setType("user")
            .setName("user")
            .setDescription("User to zero out points.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(userOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const points = new Points(discord, message)
        const perms = new Permission(discord, message)
        let user = message.author.id
        if (args[1]?.match(/\d+/)) {
            if (!await perms.checkMod()) return
            user = args[1].match(/\d+/)![0]
        }
        try {
            await points.zero(user)
        } catch {
            return this.reply(`This server has no scores ${discord.getEmoji("kannaFacepalm")}`)
        }

        const zeroEmbed = embeds.createEmbed()
        zeroEmbed
        .setAuthor({name: "zero", iconURL: "https://kisaragi.moe/assets/embed/zero.png"})
        .setTitle(`**Point Reset** ${discord.getEmoji("kaosWTF")}`)
        .setDescription(
            `${discord.getEmoji("star")}Reset <@${user}>'s points back to **0**!`
        )
        return this.reply(zeroEmbed)
    }
}
