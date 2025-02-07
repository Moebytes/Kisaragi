// @ts-nocheck - osmosis not installed
import axios from "axios"
import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
// import osmosis from "osmosis"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "./../../structures/Permission"

export default class Newgrounds extends Command {
    private readonly headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for audio, art, movies, games, and users on newgrounds.",
            help:
            `
            \`newgrounds query\` - Searches newgrounds and returns the results.
            \`newgrounds art query\` - Searches for art on newgrounds.
            \`newgrounds audio query\` - Searches for audio on newgrounds.
            \`newgrounds movie query\` - Searches for movies on newgrounds.
            \`newgrounds game query\` - Searches for games on newgrounds.
            \`newgrounds user query\` - Searches for users on newgrounds.
            \`newgrounds url\` - Gets the submission from the url.
            `,
            examples:
            `
            \`=>newgrounds audio tenpi\`
            \`=>newgrounds art anime\`
            \`=>newgrounds user tenpi\`
            `,
            aliases: ["ng"],
            random: "string",
            cooldown: 10,
            nsfw: true,
            unlist: true,
            subcommandEnabled: false
        })
        const query2Option = new SlashCommandOption()
            .setType("string")
            .setName("query2")
            .setDescription("query in subcommands.")

        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("can be query/art/audio/movie/game/user/url.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(queryOption)
            .addOption(query2Option)
    }

    public getArtImage = async (url: string, thumbnail: string) => {
        const id = thumbnail.match(/(?<=thumbnails\/)(.*?)(?=\.|_)/) ? thumbnail.match(/(?<=thumbnails\/)(.*?)(?=\.|_)/)![0] : ""
        const args = url.match(/(?<=view\/)(.*?)($)/) ? url.match(/(?<=view\/)(.*?)($)/)![0].split("/") : ""
        if (!id || !args) return thumbnail
        const link = `https://art.ngfiles.com/images/${id}_${args[0]}_${args[1]}`
        try {
            await axios.get(`${link}.png`, {headers: this.headers})
            return `${link}.png`
        } catch {
            try {
                await axios.get(`${link}.jpg`, {headers: this.headers})
                return `${link}.jpg`
            } catch {
                return `${link}.gif`
            }
        }
    }

    public getType = (url: string): string => {
        if (url.match(/audio/)) {
            return "Audio"
        } else if (url.match(/art/)) {
            return "Art"
        } else {
            return "Movie/Game"
        }
    }

    public searchData = async (query: string, search: string, skipAudio?: boolean) => {
        const self = this
        const data: any[] = []
        let data2: any[] = []
        await new Promise<void>((resolve) => {
            const titleFind = skipAudio ? "div > div > div > h4" : "div > div > div > div > h4"
            const authorFind = skipAudio ? "div > div > div > span > strong" : "div > div > div > div > span > strong"
            osmosis.get(`${search}${query}`).headers(this.headers)
            .find("ul > li > a")
            .set({url: "@href", image: "div > div > img > @src", title: titleFind, author: authorFind,
                  desc: "div > div > div.detail-description", score: "div > div > div > @title", views: "div > div > dl > dd:nth-child(2)", rating: "div > div > dl > dd:nth-child(3) > span > @class"})
            .data(function(d) {
                if (d.image) {
                    if (!d.url?.startsWith("https:")) d.url = "https:" + d.url
                    if (!d.image?.startsWith("https:")) d.image = "https:" + d.image
                    if (!d.desc) d.desc = "None"
                    if (!d.score) d.score = "Not found"
                    if (!d.views) d.views = "Not found"
                    d.type = self.getType(d.url)
                    data2.push(d)
                }
                resolve()
            })
        })
        if (!skipAudio) {
            data2 = await Functions.promiseTimeout(10000, this.audioData(search, query)).catch(() => {
                data2 = []
            }) as any
        }
        const newData = [...data, ...data2]
        return Functions.sortObjectArray(newData, "views", "desc")
    }

    public audioData = async (search: string, query: string) => {
        const self = this
        const data: any[] = []
        await new Promise<void>((resolve) => {
            osmosis.get(`${search}${query}`).headers(this.headers)
            .find("ul > li > div > a")
            .set({url: "@href", image: "div > div > img > @src", title: "div > div > div > div > h4", author: "div > div > div > div > span > strong",
                  desc: "div > div > div.detail-description", score: "div > div > div > @title", genre: "div > div > dl > dd:nth-child(2)", views: "div > div > dl > dd:nth-child(3)"})
            .data(function(d) {
                if (d.image) {
                    if (!d.url?.startsWith("https:")) d.url = "https:" + d.url
                    if (!d.image?.startsWith("https:")) d.image = "https:" + d.image
                    if (!d.desc) d.desc = "None"
                    if (!d.score) d.score = "Not found"
                    if (!d.views) d.views = "Not found"
                    d.type = self.getType(d.url)
                    data.push(d)
                }
                resolve()
            })
        })
        return data
    }

    public linkData = async (link: string, type: string) => {
        const id = link.match(/\d+/) ? link.match(/\d+/)![0] : 0
        const voteDiv = type === "Audio" ? "div > div > div > div > dl > dd:nth(3)" : "div > div > div > div > dl > dd:nth(2)"
        const dateDiv = type === "Audio" ? "div > div > div > div > dl > dd:nth(5)" : "div > div > div > div > dl > dd:nth(4)"
        let data: any
        await new Promise<void>((resolve) => {
            osmosis.get(link).headers(this.headers)
            .find("div.body-center > div > div")
            // > dl:nth-child(1) > dd:nth-child(1)
            .set({author: "div > div > div > div > div > div > h4 > a", authorIcon: "div > div > div > div > a > div > img > @src", desc: "div > div > div#author_comments",
                  views: "div > div > div > div > dl > dd", faves: "div > div > div > div > dl > dd > a", votes: voteDiv,
                  score: "div > div > div > div > dl > dd > span", date: dateDiv, image: "div > div > div > div.image > img > @src", title: "div > div > div > h2"})
            .data(function(d) {
                if (d.score) d.score = d.score + " / 5.00"
                if (!d.image && id) d.image = `https://aicon.ngfiles.com/${id.slice(0, 3)}/${id}.png`
                if (!d.score) d.score = "Not found"
                if (!d.views) d.views = "Not found"
                if (!d.votes) d.votes = "Not found"
                if (!d.authorIcon?.startsWith("https:")) d.authorIcon = "https:" + d.authorIcon
                data = d
                resolve()
            })
        })
        if (type === "Art" && !data.image) {
            await new Promise<void>((resolve) => {
                osmosis.get(link).headers(this.headers)
                .find("div.body-center > div > div")
                .set({image: "div > div > div > div.image > a > img > @src"})
                .data(function(d) {
                    data.image = d.image
                    resolve()
                })
            })
        }
        return data
    }

    public fetchLink = async (link: string) => {
        const discord = this.discord
        const embeds = new Embeds(this.discord, this.message)
        const type = this.getType(link)
        const result = await Functions.promiseTimeout(15000, this.linkData(link, type)).catch(() => {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "newgrounds", iconURL: "https://upload.wikimedia.org/wikipedia/en/thumb/8/85/Newgrounds_Tankman_logo.png/220px-Newgrounds_Tankman_logo.png", url: "https://www.newgrounds.com/"})
            .setTitle(`**Newgrounds Search** ${discord.getEmoji("PoiHug")}`))
        }) as any
        if (!result) return
        const ngEmbed = embeds.createEmbed()
        ngEmbed
        .setAuthor({name: "newgrounds", iconURL: "https://upload.wikimedia.org/wikipedia/en/thumb/8/85/Newgrounds_Tankman_logo.png/220px-Newgrounds_Tankman_logo.png", url: "https://www.newgrounds.com/"})
        .setTitle(`**Newgrounds Search** ${discord.getEmoji("PoiHug")}`)
        .setThumbnail(result.authorIcon)
        .setImage(result.image)
        .setURL(link)
        .setDescription(
            `${discord.getEmoji("star")}_Title:_ **${result.title}**\n` +
            `${discord.getEmoji("star")}_Author:_ **${result.author}**\n` +
            `${discord.getEmoji("star")}_Type:_ **${type}**\n` +
            `${discord.getEmoji("star")}_Creation Date:_ **${result.date}**\n` +
            `${discord.getEmoji("star")}_Faves:_ **${result.faves}**\n` +
            `${discord.getEmoji("star")}_Score:_ **${result.score.replace("Score: ", "")}**\n` +
            `${discord.getEmoji("star")}_Votes:_ **${result.votes}**\n` +
            `${discord.getEmoji("star")}_Views:_ **${result.views}**\n` +
            `${discord.getEmoji("star")}_Description:_ ${Functions.checkChar(result.desc, 1500, " ")}\n`
        )
        return this.reply(ngEmbed)
    }

    public artData = async (query: string) => {
        const data: any[] = []
        let i = 1
        let done = false
        while (!done) {
            await new Promise<void>((resolve) => {
                osmosis.get(`https://www.newgrounds.com/search/conduct/art?suitabilities=etma&terms=${query}`).headers(this.headers)
                .find("div.portalitem-art-icons-medium")
                .set({url: `div:nth-child(${i}) > a > @href`, image: `div:nth-child(${i}) > a > div > img > @src`, title: `div:nth-child(${i}) > a > h4`, author: `div:nth-child(${i}) > a > span`})
                .data(function(d) {
                    if (!d.url || !d.image) {
                        done = true
                        resolve()
                    } else {
                        d.author = d.author?.replace(/By/i, "").trim()
                        if (!d.url?.startsWith("https:")) d.url = "https:" + d.url
                        data.push(d)
                        resolve()
                    }
                })
            })
            i++
        }
        return data
    }

    public fetchArtSearch = async (query: string) => {
        const discord = this.discord
        const embeds = new Embeds(discord, this.message)
        const results = await this.artData(query)
        const ngArray: EmbedBuilder[] = []
        for (let i = 0; i < results.length; i++) {
            const image = await this.getArtImage(results[i].url, results[i].image)
            const ngEmbed = embeds.createEmbed()
            .setAuthor({name: "newgrounds", iconURL: "https://upload.wikimedia.org/wikipedia/en/thumb/8/85/Newgrounds_Tankman_logo.png/220px-Newgrounds_Tankman_logo.png", url: "https://www.newgrounds.com/"})
            .setTitle(`**Newgrounds Search** ${discord.getEmoji("PoiHug")}`)
            .setImage(image)
            .setURL(results[i].url)
            .setDescription(
                `${discord.getEmoji("star")}_Title:_ **${results[i].title}**\n` +
                `${discord.getEmoji("star")}_Author:_ **${results[i].author}**\n` +
                `${discord.getEmoji("star")}_Link:_ ${results[i].url}\n`
            )
            ngArray.push(ngEmbed)
        }
        if (ngArray.length === 1) {
            this.reply(ngArray[0])
        } else {
            embeds.createReactionEmbed(ngArray, true, true)
        }
        return
    }

    public userData = async (username: string) => {
        const html = await axios.get(`https://${username}.newgrounds.com`, {headers: this.headers}).then((r) => r.data)
        const images = html.match(/(?<=\/)(u?img.ngfiles.com)(.*?)(.(png|jpg|gif))/g) as string[]
        const banner = "https://" + images.find((i: string) => i.includes("banner"))
        const avatar = "https://" + images.find((i: string) => i.includes("profile"))
        const text = html.match(/(?<=<blockquote class="general fill-space text-content">)(.*?)(?=<\/blockquote>)/gm)[0]
        const rawHead = html.match(/(?<=div class="user-header-buttons">)((.|\n)*?)(?=<div class="body-main userbody">)/gm)[0]
        const categories = rawHead.match(/(?<=<span>)((.|\n)*?)(?=<\/span>)/gm).map((m: string) => m)
        const categoriesValue = rawHead.match(/(?<=<strong>)((.|\n)*?)(?=<\/strong>)/gm).map((m: string) => m)
        const rawLinks = html.match(/(?<=<div class="pod-body" id="user_links">)((.|\n)*?)(?=<div class="pod-body">)/gm)[0]
        const links = rawLinks.match(/(?<=href=")((.|\n)*?)(?=")/gm).map((m: string) => m)
        const linkNames = rawLinks.match(/(?<=<strong class="link">)((.|\n)*?)(?=<\/strong>)/gm).map((m: string) => m)
        const data = {} as any
        data.banner = banner.replace(/\\/g, "")
        data.avatar = avatar
        data.text = text
        data.categories = categories
        data.categoriesValue = categoriesValue
        data.links = links
        data.linkNames = linkNames
        return data
    }

    public fetchUser = async (username: string) => {
        const discord = this.discord
        const embeds = new Embeds(discord, this.message)
        const result = await Functions.promiseTimeout(10000, this.userData(username))
        .catch(() => {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "newgrounds", iconURL: "https://upload.wikimedia.org/wikipedia/en/thumb/8/85/Newgrounds_Tankman_logo.png/220px-Newgrounds_Tankman_logo.png", url: "https://www.newgrounds.com/"})
            .setTitle(`**Newgrounds Search** ${discord.getEmoji("PoiHug")}`))
        }) as any
        let categoryDesc = ""
        for (let i = 0; i < result.categories.length; i++) {
            categoryDesc += `${discord.getEmoji("star")}_${Functions.toProperCase(result.categories[i])}:_ **${result.categoriesValue[i]}**\n`
        }
        let linkDesc = ""
        for (let i = 0; i < result.links.length; i++) {
            linkDesc += `[**${result.linkNames[i]}**](${result.links[i]})\n`
        }
        const ngEmbed = embeds.createEmbed()
        ngEmbed
        .setAuthor({name: "newgrounds", iconURL: "https://upload.wikimedia.org/wikipedia/en/thumb/8/85/Newgrounds_Tankman_logo.png/220px-Newgrounds_Tankman_logo.png", url: "https://www.newgrounds.com/"})
        .setTitle(`**Newgrounds Search** ${discord.getEmoji("PoiHug")}`)
        .setImage(result.banner)
        .setURL(`https://${username}.newgrounds.com`)
        .setThumbnail(result.avatar)
        .setDescription(
            `${discord.getEmoji("star")}_User:_ **${Functions.toProperCase(username)}**\n` +
            categoryDesc +
            `${discord.getEmoji("star")}_Links:_ \n${Functions.checkChar(linkDesc, 500, "\n")}` +
            `${discord.getEmoji("star")}_About:_ ${Functions.checkChar(result.text, 1000, " ")}\n`
        )
        return this.reply(ngEmbed)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        if (!perms.checkNSFW()) return

        if (args[1]?.match(/newgrounds.com/)) {
            return this.fetchLink(args[1])
        }

        if (args[1] === "art") {
            const query = Functions.combineArgs(args, 2)
            if (!query) {
                return this.noQuery(embeds.createEmbed()
                .setAuthor({name: "newgrounds", iconURL: "https://upload.wikimedia.org/wikipedia/en/thumb/8/85/Newgrounds_Tankman_logo.png/220px-Newgrounds_Tankman_logo.png", url: "https://www.newgrounds.com/"})
                .setTitle(`**Newgrounds Search** ${discord.getEmoji("PoiHug")}`))
            }
            return this.fetchArtSearch(query.trim())
        } else if (args[1] === "user") {
            const username = args[2]
            if (!username) {
                return this.noQuery(embeds.createEmbed()
                .setAuthor({name: "newgrounds", iconURL: "https://upload.wikimedia.org/wikipedia/en/thumb/8/85/Newgrounds_Tankman_logo.png/220px-Newgrounds_Tankman_logo.png", url: "https://www.newgrounds.com/"})
                .setTitle(`**Newgrounds Search** ${discord.getEmoji("PoiHug")}`))
            }
            return this.fetchUser(username)
        }

        let query: string | undefined
        let searchURL = `https://www.newgrounds.com/search/summary?suitabilities=etma&terms=`
        let skip = false
        if (args[1] === "movie") {
            query = Functions.combineArgs(args, 2)
            searchURL = `https://www.newgrounds.com/search/conduct/movies?suitabilities=etma&terms=`
            skip = true
        } else if (args[1] === "game") {
            query = Functions.combineArgs(args, 2)
            searchURL = `https://www.newgrounds.com/search/conduct/games?suitabilities=etma&terms=`
            skip = true
        } else if (args[1] === "audio") {
            query = Functions.combineArgs(args, 2)
            searchURL = `https://www.newgrounds.com/search/conduct/audio?suitabilities=etma&terms=`
        } else {
            query = Functions.combineArgs(args, 1)
        }
        if (!query) {
            return this.noQuery(embeds.createEmbed()
            .setAuthor({name: "newgrounds", iconURL: "https://upload.wikimedia.org/wikipedia/en/thumb/8/85/Newgrounds_Tankman_logo.png/220px-Newgrounds_Tankman_logo.png", url: "https://www.newgrounds.com/"})
            .setTitle(`**Newgrounds Search** ${discord.getEmoji("PoiHug")}`))
        }
        const result = await Functions.promiseTimeout(15000, this.searchData(query.trim(), searchURL, skip))
        .catch(() => {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "newgrounds", iconURL: "https://upload.wikimedia.org/wikipedia/en/thumb/8/85/Newgrounds_Tankman_logo.png/220px-Newgrounds_Tankman_logo.png", url: "https://www.newgrounds.com/"})
            .setTitle(`**Newgrounds Search** ${discord.getEmoji("PoiHug")}`))
        }) as any

        if (!result) return
        const ngArray: EmbedBuilder[] = []
        for (let i = 0; i < result.length; i++) {
            const rating = result[i].rating ? `${discord.getEmoji("star")}_Rating:_ **${result[i].rating.replace("rated-", "").toUpperCase()}**\n` : ""
            const genre = result[i].genre ? `${discord.getEmoji("star")}_Genre:_ **${result[i].genre}**\n` : ""
            let img: string
            if (result[i].type === "Art") {
                img = await this.getArtImage(result[i].url, result[i].image)
            } else {
                img = ""
            }
            const ngEmbed = embeds.createEmbed()
            ngEmbed
            .setAuthor({name: "newgrounds", iconURL: "https://upload.wikimedia.org/wikipedia/en/thumb/8/85/Newgrounds_Tankman_logo.png/220px-Newgrounds_Tankman_logo.png", url: "https://www.newgrounds.com/"})
            .setTitle(`**Newgrounds Search** ${discord.getEmoji("PoiHug")}`)
            .setImage(img)
            .setThumbnail(result[i].image)
            .setURL(result[i].url)
            .setDescription(
                `${discord.getEmoji("star")}_Title:_ **${result[i].title}**\n` +
                `${discord.getEmoji("star")}_Author:_ **${result[i].author}**\n` +
                `${discord.getEmoji("star")}_Type:_ **${result[i].type}**\n` +
                genre +
                rating +
                `${discord.getEmoji("star")}_Score:_ **${result[i].score.replace("Score: ", "")}**\n` +
                `${discord.getEmoji("star")}_Views:_ **${result[i].views}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${result[i].desc}\n`
            )
            ngArray.push(ngEmbed)
        }

        if (ngArray.length === 1) {
            this.reply(ngArray[0])
        } else {
            embeds.createReactionEmbed(ngArray, false, true)
        }
        return
  }
}