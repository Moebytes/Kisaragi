import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {OAuth} from "oauth"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Permission} from "../../structures/Permission"
import * as config from "./../../config.json"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class TwitterOauth extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Authorize read and write access to your twitter account. **Requires oauth2**.",
            help:
            `
            \`twitteroauth\` - Follow the url and click on "Authorize" to authorize your twitter account
            \`twitteroauth revoke/delete\` - Deletes your twitter oauth token. To revoke it, you have to go into your application settings.
            `,
            examples:
            `
            \`=>twitteroauth\`
            \`=>twitteroauth delete\`
            `,
            guildOnly: true,
            aliases: ["toauth"],
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
            await SQLQuery.revokeTwitterOauth(message.author.id)
            const oauth2Embed = embeds.createEmbed()
            oauth2Embed
            .setAuthor({name: "twitter oauth", iconURL: "https://kisaragi.moe/assets/embed/twitteroauth.png"})
            .setTitle(`**Twitter Oauth 1.0a** ${discord.getEmoji("gabYes")}`)
            .setDescription(`${discord.getEmoji("star")}Deleted the local copy of your twitter token. To invalidate this token, revoke access in your [**application settings**](https://twitter.com/settings/applications).`)
            return this.reply(oauth2Embed)
        }

        const callback = process.env.TESTING === "yes" ? config.twitterRedirectTesting : config.twitterRedirect
        const oauth = new OAuth(
            "https://api.twitter.com/oauth/request_token",
            "https://api.twitter.com/oauth/access_token",
            process.env.TWITTER_API_KEY!,
            process.env.TWITTER_API_SECRET!,
            "1.0A",
            callback,
            "HMAC-SHA1"
        )

        let oauthToken = ""
        let oauthSecret = ""
        await new Promise<void>((resolve) => {
            oauth.getOAuthRequestToken((e, token, secret) => {
                oauthToken = token
                oauthSecret = secret
                resolve()
            })
        })

        const url = `https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`
        const twitterOauthEmbed = embeds.createEmbed()
        twitterOauthEmbed
        .setAuthor({name: "twitter oauth", iconURL: "https://kisaragi.moe/assets/embed/twitteroauth.png"})
        .setTitle(`**Twitter Oauth 1.0a** ${discord.getEmoji("gabYes")}`)
        .setDescription(`${discord.getEmoji("star")}Authorize Kisaragi Bot [**here**](${url}) to post, like, and retweet tweets on your behalf. This only gives reading and writing permissions of public data (not private, such as direct messages).`)
        return this.reply(twitterOauthEmbed)
    }
}
