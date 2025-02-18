import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import snoowrap from "snoowrap"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Oauth2} from "./../../structures/Oauth2"
import {Permission} from "./../../structures/Permission"

export default class Reddit extends Command {
    private sub = null as any
    private postID = null as any
    private user = null as any
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches posts on a reddit subreddit.",
            help:
            `
            \`reddit\` - Gets a random post
            \`reddit subreddit query?\` - Searches for posts in the subreddit or gets random ones
            \`reddit subreddit hot/new/top/rising/controversial\` - Gets hot, new, top, etc. posts in the board
            \`reddit user query\` - Searches for users
            \`reddit url\` - Gets the post from the url
            `,
            examples:
            `
            \`=>reddit\`
            \`=>reddit anime cute\`
            \`=>reddit animemes hot\`
            `,
            aliases: ["r"],
            random: "none",
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("Can be a query or hot/new/top/rising/controversial.")

        const subredditOption = new SlashCommandOption()
            .setType("string")
            .setName("subreddit")
            .setDescription("Can be a subreddit/user or url.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(subredditOption)
            .addOption(queryOption)
    }

    public getSubmissions = async <T extends boolean | undefined = false>(reddit: snoowrap, postIDS: string[], imagesOnly?: boolean, descOnly?: T): Promise<T extends true ? string : EmbedBuilder[]> => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const redditArray: EmbedBuilder[] = []
        for (let i = 0; i < postIDS.length; i++) {
            if (!postIDS[i]) break
            // @ts-ignore
            const post = await reddit.getSubmission(postIDS[i]).fetch() as snoowrap.Submission
            if (imagesOnly && post.selftext) continue
            if (post.over_18) {
                if (!perms.checkNSFW(true)) continue
                if (!perms.checkBotDev(true)) continue
            }
            const commentArray: string[] = []
            for (let j = 0; j < 3; j++) {
                if (!post.comments[j]) break
                commentArray.push(`**${post.comments[j].author ? post.comments[j].author.name : "Deleted"}**: ${(Functions.checkChar(post.comments[j].body, 150, "") as string).replace(/(\r\n|\n|\r)/gm, " ")}`)
            }
            const selfText = post.selftext ? `${discord.getEmoji("star")}_Selftext:_ ${(Functions.checkChar(post.selftext, 800, "") as string).replace(/(\r\n|\n|\r)/gm, " ")}\n` : ""
            const redditEmbed = embeds.createEmbed()
            redditEmbed
            .setAuthor({name: "reddit", iconURL: "https://kisaragi.moe/assets/embed/reddit.png", url: "https://www.reddit.com/"})
            .setTitle(`**${Functions.checkChar(post.title, 200, " ")}** ${discord.getEmoji("aquaUp")}`)
            .setURL(`https://www.reddit.com/${post.permalink}`)
            .setDescription(
                `${discord.getEmoji("star")}_Subreddit:_ **${post.subreddit.display_name}**\n` +
                `${discord.getEmoji("star")}_Subscribers:_ **${post.subreddit_subscribers}**\n` +
                `${discord.getEmoji("star")}_Author:_ **${post.author ? post.author.name : "Deleted"}**\n` +
                `${discord.getEmoji("star")}${discord.getEmoji("thumbsUp")} **${Math.ceil(post.ups / post.upvote_ratio)}** ${discord.getEmoji("thumbsDown")} **${Math.ceil(post.ups / post.upvote_ratio) - post.ups}**\n` +
                 selfText +
                `${discord.getEmoji("star")}_Comments:_ ${commentArray.join("") ? commentArray.join("\n") : "None"}\n`
            )
            .setImage(post.url)
            .setThumbnail(post.thumbnail.startsWith("https") ? post.thumbnail : `https://www.redditstatic.com/icon.png`)
            if (descOnly) return redditEmbed.data.description as any
            redditArray.push(redditEmbed)
        }
        return redditArray as any
    }

    public noResults = async () => {
        const embeds = new Embeds(this.discord, this.message)
        const redditEmbed = embeds.createEmbed()
        redditEmbed
        .setAuthor({name: "reddit", iconURL: "https://kisaragi.moe/assets/embed/reddit.png", url: "https://www.reddit.com/"})
        .setTitle(`**Reddit Search** ${this.discord.getEmoji("aquaUp")}`)
        .setDescription("No results were found. Try searching on the reddit website: " +
        "[Reddit Website](https://www.reddit.com)")
        return this.reply(redditEmbed)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const oauth2 = new Oauth2(discord, message)
        if (!perms.checkNSFW()) return

        const reddit = new snoowrap({
            userAgent: "kisaragi bot v1.0",
            clientId: process.env.REDDIT_APP_ID,
            clientSecret: process.env.REDDIT_APP_SECRET,
            refreshToken: process.env.REDDIT_REFRESH_TOKEN
        })

        if (args[1]?.match(/reddit.com/)) {
            this.sub = args[1].match(/(?<=r\/)(.*?)(?=\/)/) ? args[1].match(/(?<=r\/)(.*?)(?=\/)/)?.[0] : null
            this.postID = args[1].match(/(?<=comments\/)(.*?)(?=\/)/) ? args[1].match(/(?<=comments\/)(.*?)(?=\/)/)?.[0] : null
            this.user = args[1].match(/(?<=user\/)(.*?)(?=$|\/)/) ? args[1].match(/(?<=user\/)(.*?)(?=$|\/)/)?.[0] : null
            if (this.postID) {
                const redditArray = await this.getSubmissions(reddit, [this.postID])
                if (!redditArray[0]) return message.reply(`No search results found.`)
                return this.reply(redditArray[0])
            }
        }

        if (this.user || args[1] === "user") {
            const query = this.user || Functions.combineArgs(args, 2)
            if (!query) {
                return this.noQuery(embeds.createEmbed()
                .setAuthor({name: "reddit", iconURL: "https://kisaragi.moe/assets/embed/reddit.png", url: "https://www.reddit.com/"})
                .setTitle(`**Reddit User** ${discord.getEmoji("aquaUp")}`)
                )
            }
            let userQuery = query.trim().startsWith("u/") ? query.trim() : `u/${query.trim()}`
            // @ts-ignore
            const user = await reddit.getUser(userQuery).fetch()
            const redditEmbed = embeds.createEmbed()
            redditEmbed
            .setAuthor({name: "reddit", iconURL: "https://kisaragi.moe/assets/embed/reddit.png", url: "https://www.reddit.com/"})
            .setTitle(`**${user.name}** ${discord.getEmoji("aquaUp")}`)
            .setURL(`https://www.reddit.com${user.subreddit.display_name.url}`)
            .setImage(user.subreddit.display_name.banner_img || null)
            .setThumbnail(user.subreddit.display_name.icon_img || null)
            .setDescription(
                `${discord.getEmoji("star")}_Link Karma:_ **${user.link_karma}**\n` +
                `${discord.getEmoji("star")}_Comment Karma:_ **${user.comment_karma}**\n` +
                `${discord.getEmoji("star")}_Friends:_ **${user.num_friends ?? "None"}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${user.subreddit.display_name.public_description}\n`
            )
            const msg = await this.reply(redditEmbed)
            await oauth2.redditOptions(msg)
            return
        }

        let posts = {} as snoowrap.Listing<snoowrap.Submission>
        let subreddit = ""
        if (!args[1]) {
            // @ts-ignore
            posts = [await reddit.getHot()] as snoowrap.Listing<snoowrap.Submission>
        } else {
            subreddit = this.sub || args[1]
        }
        if (subreddit) {
            if (args[2]) {
                const query = Functions.combineArgs(args, 2).trim()
                if (args[2].toLowerCase() === "hot" || !query) {
                    posts = await reddit.getSubreddit(subreddit).getHot()
                } else if (args[2].toLowerCase() === "new") {
                    posts = await reddit.getSubreddit(subreddit).getNew()
                } else if (args[2].toLowerCase() === "top") {
                    posts = await reddit.getSubreddit(subreddit).getTop({time: "all"})
                } else if (args[2].toLowerCase() === "rising") {
                    posts = await reddit.getSubreddit(subreddit).getRising()
                } else if (args[2].toLowerCase() === "controversial") {
                    posts = await reddit.getSubreddit(subreddit).getControversial()
                } else {
                    posts = await reddit.getSubreddit(subreddit).search({query, time: "all", sort: "relevance"})
                }
            } else {
                try {
                    // @ts-ignore
                    posts = await reddit.getSubreddit(subreddit).getHot()
                } catch {
                    return this.invalidQuery(embeds.createEmbed()
                    .setAuthor({name: "reddit", iconURL: "https://kisaragi.moe/assets/embed/reddit.png", url: "https://www.reddit.com/"})
                    .setTitle(`**Reddit Search** ${discord.getEmoji("aquaUp")}`)
                    .setDescription("No results were found. Try searching on the reddit website: " +
                    "[Reddit Website](https://www.reddit.com)"))
                }
            }
        }
        const postIDS: string[] = []
        for (let i = 0; i < posts.length; i++) {
            if (posts[i]) {
                postIDS.push(posts[i].id)
            }
        }
        if (!postIDS.join("")) return this.noResults()
        const redditArray = await this.getSubmissions(reddit, postIDS)
        if (!redditArray[0]) return this.noResults()
        let msg: Message
        if (redditArray.length === 1) {
            msg = await this.reply(redditArray[0])
        } else {
            msg = await embeds.createReactionEmbed(redditArray, true, true)
        }
        await oauth2.redditOptions(msg)
    }
}
