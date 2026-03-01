 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Permission} from "../../structures/Permission"
import * as config from "./../../config.json"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class RedditOauth extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Authorize read and write access to your reddit account. **Requires oauth2**.",
            help:
            `
            \`redditoauth\` - Follow the url and click on "Authorize" to authorize your reddit account
            \`redditoauth revoke/delete\` - Deletes and revokes your reddit token
            `,
            examples:
            `
            \`=>redditoauth\`
            \`=>redditoauth revoke\`
            `,
            guildOnly: true,
            aliases: ["roauth"],
            cooldown: 10,
            unlist: true,
            subcommandEnabled: false
        })
        const revokeOption = new SlashCommandOption()
            .setType("string")
            .setName("revoke")
            .setDescription("Type revoke/delete to delete your token.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(revokeOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const embeds = new Embeds(discord, message)
        if (args[1] === "delete" || args[1] === "revoke") {
            await SQLQuery.revokeRedditOauth(message.author.id)
            const oauth2Embed = embeds.createEmbed()
            oauth2Embed
            .setAuthor({name: "reddit oauth", iconURL: "https://kisaragi.moe/assets/embed/redditoauth.png"})
            .setTitle(`**Reddit Oauth 2.0** ${discord.getEmoji("mexShrug")}`)
            .setDescription(`${discord.getEmoji("star")}Revoked your reddit token!`)
            return this.reply(oauth2Embed)
        }

        const state = Functions.randomString(16)
        const states = await SQLQuery.redisGet("state").then((s) => JSON.parse(s))
        states.push(state)
        await SQLQuery.redisSet("state", JSON.stringify(states))

        const url = `https://www.reddit.com/api/v1/authorize?client_id=${process.env.REDDIT_APP_ID}&response_type=code&state=${state}&redirect_uri=${config.redditRedirect}&duration=permanent&scope=identity,read,save,subscribe,submit,edit,vote,flair`
        const redditOauthEmbed = embeds.createEmbed()
        redditOauthEmbed
        .setAuthor({name: "reddit oauth", iconURL: "https://kisaragi.moe/assets/embed/redditoauth.png"})
        .setTitle(`**Reddit Oauth 2.0** ${discord.getEmoji("mexShrug")}`)
        .setDescription(`${discord.getEmoji("star")}Authorize Kisaragi Bot [**here**](${url}) in order to upvote, downvote, comment, and save posts and in order to subscribe to subreddits.`)
        return this.reply(redditOauthEmbed)
    }
}
