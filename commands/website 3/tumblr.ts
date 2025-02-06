import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import Tumblr from "tumblr.js"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"

export default class TumblrCommand extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for tumblr posts and blogs.",
            help:
            `
            \`tumblr query\` - Searches for posts.
            \`tumblr blog name\` - Gets all posts from the blog.
            `,
            examples:
            `
            \`=>tumblr anime\`
            `,
            aliases: [],
            random: "none",
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const query2Option = new SlashCommandOption()
            .setType("string")
            .setName("query2")
            .setDescription("Query in the blog subcommand.")

        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("Can be a query/blog.")

        this.subcommand = new SlashCommandSubcommand()
            .setName("tumblr")
            .setDescription(this.options.description)
            .addOption(queryOption)
            .addOption(query2Option)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const tumblr = Tumblr.createClient({consumer_key: process.env.TUMBLR_API_KEY, returnPromises: true})

        const tumblrArray: EmbedBuilder[] = []
        let posts: any
        let avatar = ""
        let setAvatar = false
        if (args[1] === "blog") {
            const blog = args[2]
            if (!blog) {
                return this.noQuery(embeds.createEmbed()
                .setAuthor({name: "tumblr", iconURL: "https://kisaragi.moe/assets/embed/tumblr.png", url: "https://www.tumblr.com/"})
                .setTitle(`**Tumblr Search** ${discord.getEmoji("chinoSmug")}`), "You must provide a blog name.")
            }
            const data = await (tumblr.blogPosts(blog) as any)
            const info = data.blog
            avatar = info.avatar?.[0]?.url
            const tumblrEmbed = embeds.createEmbed()
            tumblrEmbed
            .setAuthor({name: "tumblr", iconURL: "https://kisaragi.moe/assets/embed/tumblr.png", url: "https://www.tumblr.com/"})
            .setTitle(`**Tumblr Search** ${discord.getEmoji("chinoSmug")}`)
            .setURL(info.url)
            .setImage(info.theme.header_image || null)
            .setThumbnail(avatar)
            .setDescription(
                `${discord.getEmoji("star")}_Blog:_ **${info.title}**\n` +
                `${discord.getEmoji("star")}_Name:_ **${info.name}**\n` +
                `${discord.getEmoji("star")}_Posts:_ **${info.posts}**\n` +
                `${discord.getEmoji("star")}_Updated:_ **${Functions.formatDate(new Date(1000*info.updated))}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${Functions.cleanHTML(info.description)}\n`
            )
            tumblrArray.push(tumblrEmbed)
            posts = data.posts
            setAvatar = true
        } else {
            let tag = Functions.combineArgs(args, 1)
            if (!tag) tag = "anime"
            // @ts-ignore
            posts = await (tumblr.taggedPosts(tag) as any)
        }
        if (!posts?.[0]) {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "tumblr", iconURL: "https://kisaragi.moe/assets/embed/tumblr.png", url: "https://www.tumblr.com/"})
            .setTitle(`**Tumblr Search** ${discord.getEmoji("chinoSmug")}`))
        }
        for (let i = 0; i < posts.length; i++) {
            const post = posts[i]
            // @ts-ignore
            if (!setAvatar) avatar = await (tumblr.blogAvatar(post.blog.name) as any).then((a: any) => a.avatar_url)
            const image = post.type === "photo" ? post.photos[0].original_size.url : (post.type === "video" ? post.thumbnail_url : "")
            const link = post.link_url ? post.link_url : (post.type === "photo" ? post.image_permalink : (post.type === "video" ? post.permalink_url : post.short_url))
            const tumblrEmbed = embeds.createEmbed()
            tumblrEmbed
            .setAuthor({name: "tumblr", iconURL: "https://kisaragi.moe/assets/embed/tumblr.png", url: "https://www.tumblr.com/"})
            .setTitle(`**Tumblr Search** ${discord.getEmoji("chinoSmug")}`)
            .setImage(image || null)
            .setThumbnail(avatar)
            .setURL(post.short_url)
            .setDescription(
                `${discord.getEmoji("star")}_Blog:_ [**${post.blog.title}**](${post.blog.url})\n` +
                `${discord.getEmoji("star")}_Blog Desc:_ ${Functions.cleanHTML(post.blog.description)}\n` +
                `${discord.getEmoji("star")}_Creation Date:_ **${Functions.formatDate(post.date)}**\n` +
                `${discord.getEmoji("star")}_Link:_ **${link}**\n` +
                `${discord.getEmoji("star")}_Summary:_ ${Functions.checkChar(post.summary, 1000, " ")}\n` +
                `${discord.getEmoji("star")}_Tags:_ ${Functions.checkChar(post.tags.map((t: any) => `#${t}`).join(", "), 500, ",")}\n`
            )
            tumblrArray.push(tumblrEmbed)
        }
        if (tumblrArray.length === 1) {
            return this.reply(tumblrArray[0])
        } else {
            return embeds.createReactionEmbed(tumblrArray, true, true)
        }
    }
}
