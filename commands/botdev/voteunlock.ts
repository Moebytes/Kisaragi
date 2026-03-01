 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {SQLQuery} from "../../structures/SQLQuery"

export default class VoteUnlock extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Manually unlocks voting for a user.",
            help:
            `
            \`voteunlock user id\` - Unlock the user's voting
            `,
            examples:
            `
            \`=>voteunlock <user id>\`
            `,
            aliases: [],
            cooldown: 3,
            botdev: true,
            subcommandEnabled: true
        })
        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("id")
            .setDescription("The user id.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(queryOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const embeds = new Embeds(discord, message)
        const sql = new SQLQuery(message)
        if (!perms.checkBotDev()) return
        const id = args[1]
        if (!id) return this.reply("No user id provided...")
        const now = new Date().toISOString()
        await sql.updateColumn("misc", "last voted", now, "user id", id)

        const user = discord.users.cache.get(id)
        const voteEmbed = embeds.createEmbed()
            .setAuthor({name: "vote unlock", iconURL: "https://kisaragi.moe/assets/embed/voteunlock.png"})
            .setTitle(`**Voting Unlocked** ${this.discord.getEmoji("uniHurt")}`)
            .setDescription(`Unlocked the voting for \`${user ? user.username : id}\`!`)
        return this.reply(voteEmbed)
    }
}
