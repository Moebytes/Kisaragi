/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import Twitter from "twitter"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Status extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Updates your twitter profile description. **Requires twitteroauth**",
            help:
            `
            \`status content\` - Update your status
            `,
            examples:
            `
            \`=>status Visit my website at www.website.com\`
            `,
            aliases: [],
            cooldown: 5,
            unlist: true,
            subcommandEnabled: false
        })
        const contentOption = new SlashCommandOption()
            .setType("string")
            .setName("content")
            .setDescription("Your new status.")
            .setRequired(true)

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(contentOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const sql = new SQLQuery(message)
        const perms = new Permission(discord, message)
        const token = await sql.fetchColumn("oauth2", "twitter token", "user id", message.author.id)
        if (!token) return this.reply(`You need to give me read and writing permissions over your twitter account. See the **twitteroauth** command.`)
        const secret = await sql.fetchColumn("oauth2", "twitter secret", "user id", message.author.id)
        const twitterID = await sql.fetchColumn("oauth2", "twitter id", "user id", message.author.id)

        const twitter = new Twitter({
            consumer_key: process.env.TWITTER_API_KEY!,
            consumer_secret: process.env.TWITTER_API_SECRET!,
            access_token_key: token,
            access_token_secret: secret
        })

        const content = Functions.combineArgs(args, 1).trim()
        if (!content) return this.reply(`What do you want to update your status to ${discord.getEmoji("kannaFacepalm")}`)
        await twitter.post(`account/update_profile`, {description: content})
        return this.reply(`Updated your twitter status! ${discord.getEmoji("aquaUp")}`)
    }
}
