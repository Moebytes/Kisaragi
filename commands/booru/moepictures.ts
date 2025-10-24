import axios from "axios"
import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "./../../structures/Permission"

type PostType =
    | "all"
    | "image"
    | "animation"
    | "video"
    | "comic"
    | "audio"
    | "model"
    | "live2d"

type PostRating =
    | "all"
    | "all+h"
    | "cute" 
    | "sexy" 
    | "ecchi" 
    | "hentai"

type PostStyle =
    | "all"
    | "all+s"
    | "2d"
    | "3d"
    | "pixel"
    | "chibi"
    | "daki"
    | "sketch"
    | "lineart"
    | "promo"

interface PostMirrors {
    pixiv?: string
    soundcloud?: string
    sketchfab?: string
    twitter?: string
    deviantart?: string
    artstation?: string
    danbooru?: string
    gelbooru?: string
    safebooru?: string
    yandere?: string
    konachan?: string
    zerochan?: string
    youtube?: string
    bandcamp?: string
}

interface Image {
    imageID: string
    postID: string
    type: PostType
    order: number
    filename: string
    upscaledFilename: string
    width: number
    height: number
    upscaledWidth: number
    upscaledHeight: number
    size: number
    upscaledSize: number
    duration: number
    thumbnail: string
    hash: string
    pixelHash: string
}

interface Post {
    postID: string
    type: PostType
    rating: PostRating
    style: PostStyle
    parentID: string | null
    uploader: string
    uploadDate: string
    updater: string
    updatedDate: string
    title: string
    englishTitle: string
    slug: string
    artist: string
    posted: string
    source: string
    commentary: string
    englishCommentary: string
    mirrors: PostMirrors | null
    bookmarks: number
    buyLink: string | null
    approver: string
    approveDate: string
    hasOriginal: boolean
    hasUpscaled: boolean
    hidden: boolean | null
    locked: boolean | null
    private: boolean | null
    images: Image[]
    deleted: boolean | null
    deletionDate: string | null
}

export default class Moepictures extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for anime pictures on moepictures.",
            help:
            `
            \`moepictures\` - Get random images.
            \`moepictures tags\` - Gets images with the tags.
            \`moepictures link/id\` - Gets the image from the link.
            `,
            examples:
`
            \`=>moepictures\`
            \`=>moepictures usada pekora\`
            `,
            aliases: ["m", "moe"],
            random: "none",
            cooldown: 20,
            defer: true,
            subcommandEnabled: true
        })
        const tagOption = new SlashCommandOption()
            .setType("string")
            .setName("tags")
            .setDescription("tags or link to search")
        
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(tagOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)

        const moepicturesEmbed = embeds.createEmbed()
        .setAuthor({name: "moepictures", iconURL: "https://moepictures.net/favicon.png"})
        .setTitle(`**Moepictures Search** ${discord.getEmoji("qiqiSip")}`)

        let tags = Functions.combineArgs(args, 1).split(",").filter(Boolean)

        let tagArray: string[] = []
        for (let i = 0; i < tags.length; i++) {
            tagArray.push(tags[i].trim().replace(/ /g, "-"))
        }

        let id = tags.join("").match(/\d\d+/g)
        if (id) tagArray = [`id:${id}`]

        let query = tagArray.join(" ")

        let posts = await axios.get(`https://moepictures.moe/api/search/posts`, {params: {query}, 
        headers: {"x-api-key": process.env.MOEPICTURES_API_KEY}}).then((r) => r.data) as Post[]

        const moepicturesArray: EmbedBuilder[] = []
        for (let i = 0; i < posts.length; i++) {
            const post = posts[i]
            if (post.rating !== "cute" && post.rating !== "sexy") {
                if (!perms.checkNSFW(true)) continue
            }
            const moepicturesEmbed = embeds.createEmbed()
            .setAuthor({name: "moepictures", iconURL: "https://moepictures.net/favicon.png"})
            .setTitle(`**Moepictures Search** ${discord.getEmoji("qiqiSip")}`)
            .setURL(`https://moepictures.moe/post/${post.postID}/${post.slug}`)
            .setDescription(
                `${discord.getEmoji("star")}_Title:_ **${post.englishTitle || post.title}**\n` +
                `${discord.getEmoji("star")}_Artist:_ **${post.artist}**\n` +
                `${discord.getEmoji("star")}_Posted:_ **${Functions.formatDate(post.posted)}**\n` +
                `${discord.getEmoji("star")}_Source:_ ${post.source}\n` +
                `${discord.getEmoji("star")}_Commentary:_ ${Functions.checkChar(post.englishCommentary || post.commentary, 2048, " ")}\n`
            )
            .setImage(`https://moepictures.moe/social-preview/${post.postID}.jpg`)
            moepicturesArray.push(moepicturesEmbed)
        }
        if (!moepicturesArray[0]) {
            return this.invalidQuery(moepicturesEmbed)
        }
        if (moepicturesArray.length === 1) {
            return this.reply(moepicturesArray[0])
        } else {
            return embeds.createReactionEmbed(moepicturesArray, true, true)
        }
    }
}
