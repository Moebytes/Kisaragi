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
import {Images} from "./../../structures/Images"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Tweet extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Posts a new tweet onto your account, on your behalf. **Requires twitteroauth**",
            help:
            `
            \`tweet content\` - Posts a new tweet
            `,
            examples:
            `
            \`=>tweet posted by Kisaragi Bot!\`
            `,
            aliases: [],
            cooldown: 5,
            unlist: true,
            subcommandEnabled: false
        })
        const contentOption = new SlashCommandOption()
            .setType("string")
            .setName("content")
            .setDescription("Tweet to post.")
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
        const images = new Images(discord, message)
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

        const content = Functions.combineArgs(args, 1).trim().replace(/(<@)(.*?)(>)/g, "").replace(/(http)(.*?)(?= |$)/g, "")
        let links = Functions.combineArgs(args, 1).trim().match(/(http)(.*?)(?= |$)/)
        if (!links) links = await discord.fetchLastAttachment(message, false, /.(png|jpg|gif|mp4)/, 5, true) as any
        let mediaIDs = ""
        if (links) {
            for (let i = 0; i < links.length; i++) {
                if (links[0].endsWith(".gif") || links[0].endsWith(".mp4")) {
                    mediaIDs = await images.uploadTwitterMedia(twitter, links[0])
                    break
                }
                if (mediaIDs.length === 4) break
                if (links[i].endsWith(".jpg") || links[i].endsWith(".png")) {
                    const mediaID = await images.uploadTwitterMedia(twitter, links[i])
                    if (i === 0) {
                        mediaIDs += mediaID
                    } else {
                        mediaIDs += `,${mediaID}`
                    }
                }
            }
        }
        await twitter.post("statuses/update", {
            status: content,
            media_ids: mediaIDs
        })

        const user = await twitter.get("users/lookup", {user_id: twitterID}).then((u) => u[0])
        const twitterEmbed = embeds.createEmbed()
        twitterEmbed
        .setAuthor({name: "twitter", iconURL: "https://kisaragi.moe/assets/embed/tweet.png", url: "https://twitter.com/"})
        .setTitle(`**Tweet Posted** ${discord.getEmoji("gabYes")}`)
        .setURL(`https://twitter.com/${user.screen_name}/status/${user.status.id_str}`)
        .setDescription(
            `${discord.getEmoji("star")}_Username:_ [**${user.screen_name}**](https://twitter.com/${user.screen_name})\n` +
            `${discord.getEmoji("star")}_Posted:_ **${Functions.formatDate(user.status.created_at)}**\n` +
            `${discord.getEmoji("star")}_Tweet:_ ${user.status.text}\n`
            )
        .setThumbnail(user.profile_image_url)
        .setImage(user.status.entities.media ? user.status.entities.media[0].media_url : user.profile_banner_url)
        return this.reply(twitterEmbed)
    }
}
