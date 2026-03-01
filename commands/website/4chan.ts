 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "./../../structures/Permission"
import axios from "axios"

const nsfwBoards = ["b", "r9k", "pol", "bant", "soc", "s4s", "s", "hc", "hm", "h",
                    "e", "u", "d", "y", "t", "hr", "gif", "aco", "r"]

export default class $4chan extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for posts and images on 4chan.",
            help:
            `
            _Note: NSFW boards are restricted to nsfw channels._
            \`4chan images?\` - Default search is "a anime".
            \`4chan board query\` - Searches the specified board with the query.
            \`4chan images board query\` - Similar, but only sends all of the images.
            `,
            examples:
            `
            \`=>4chan\`
            \`=>4chan a kawaii\`
            \`=>4chan images c cute\`
            `,
            aliases: ["4", "4ch"],
            cooldown: 15,
            defer: true,
            subcommandEnabled: true
        })
        const query2Option = new SlashCommandOption()
            .setType("string")
            .setName("query2")
            .setDescription("Last chance to input the query.")

        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("Can be a query or board.")

        const boardOption = new SlashCommandOption()
            .setType("string")
            .setName("board")
            .setDescription("Can be a board or images.")

        this.subcommand = new SlashCommandSubcommand()
            .setName("4chan")
            .setDescription(this.options.description)
            .addOption(boardOption)
            .addOption(queryOption)
            .addOption(query2Option)
    }

    public nsfwBoards = (board: string) => {
        for (let i = 0; i < nsfwBoards.length; i++) {
            if (board === nsfwBoards[i]) {
                return true
            }
        }
        return false
    }

    public formatComment = (comment: string, post: string) => {
        let quote = ""
        if (comment.match(/(?<=<a).*?(?=<\/a>)/g)) {
            comment.replace(/(?<=<a).*?(?=<\/a>)/g, "")
            quote = `\n[>>${post.slice(-9)}](${post})`
        }
        comment = comment
        .replace(/&#039;/g, "'").replace(/<br>/g, "\n")
        .replace(/(?<=<a).*?(?=<\/a>)/g, "")
        .replace(/<a/g, "").replace(/<\/a>/g, "")
        .replace(/<s>/g, "||").replace(/<\/s>/g, "||")
        .replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"').replace(/&amp;/g, "&")
        .replace(/<span class="quote">/g, "").replace(/<\/span>/g, "\n")
        comment = Functions.checkChar(comment, 1800, ".")
        if (!comment) return ""
        return `${quote}\`\`\`yaml\n${comment}\`\`\``
    }

    public getThreads = async (board: string, query: string) => {
        query = query?.toLowerCase().trim() || ""
        const catalog = await axios.get(`https://a.4cdn.org/${board}/catalog.json`).then((r) => r.data)
        let threads = [] as any
        for (const page of catalog) {
            for (const thread of page.threads) {
                thread.url = `https://a.4cdn.org/${board}/thread/${thread.no}.json`
                if (query) {
                    if (thread.com?.toLowerCase().includes(query) ||
                        thread.sub?.toLowerCase().includes(query) ||
                        threads.semantic_url?.toLowerCase().includes(query)) threads.push(thread)
                } else {
                    threads.push(thread)
                }
            }
        }
        return threads
    }

    public getMediaLinks = async (url: string) => {
        let board = url.split("/")[3]
        let thread = await axios.get(url).then((r) => r.data)
        let links = [] as string[]
        for (const post of thread.posts) {
            if (post.ext) {
                links.push(`https://i.4cdn.org/${board}/${post.tim}${post.ext}`)
            }
        }
        return links
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
        const perms = new Permission(discord, message)
        const badChanEmbed = embeds.createEmbed()
        .setAuthor({name: "4chan", iconURL: "https://kisaragi.moe/assets/embed/4chan.png", url: "https://www.4chan.org/"})
        .setTitle(`**4chan Search** ${discord.getEmoji("vigneDead")}`)
        if (!perms.checkNSFW()) return

        if (args[1] === "images") {
            let board = args[2]
            let query = Functions.combineArgs(args, 3)
            if (!board) {
                board = "a"
                query = "anime"
            }
            if (!board || !query) {
                return this.noQuery(badChanEmbed, "The first parameter is the board name, the rest is the search query.")
            }
            if (this.nsfwBoards(board)) {
                if (!perms.checkNSFW()) return
                if (!perms.checkBotDev()) return
            }
            const threads = await this.getThreads(board, query)
            const random = Math.floor(Math.random() * threads.length)
            if (!threads[random]) {
                return this.invalidQuery(badChanEmbed, "Try searching for a different tag.")
            }
            const results = await this.getMediaLinks(threads[random].url)
            const rawUrl = `https://boards.4channel.org/${board}/thread/${threads[random].url.match(/\d+/g)}`
            const url = rawUrl.replace(/4,/g, "")
            const imageArray: EmbedBuilder[] = []
            for (const i in results) {
                const chanEmbed = embeds.createEmbed()
                chanEmbed
                .setAuthor({name: "4chan", iconURL: "https://kisaragi.moe/assets/embed/4chan.png", url: "https://www.4chan.org/"})
                .setTitle(`**4chan Image Search** ${discord.getEmoji("vigneDead")}`)
                .setURL(url)
                .setImage(results[i])
                imageArray.push(chanEmbed)
            }
            if (imageArray.length === 1) {
                return this.reply(imageArray[0])
            } else {
                return embeds.createReactionEmbed(imageArray, false, true)
            }
        }

        let board = args[1]
        let query = Functions.combineArgs(args, 2)
        if (!board) {
            board = "a"
            query = "anime"
        }
        if (board.match(/boards.4channel.org/)) {
            const b = board.match(/(?<=boards.4channel.org\/)(.*?)(?=\/)/)?.[0]
            const id =  board.match(/\d{5,}/)?.[0]
            const apiURL = `https://a.4cdn.org/${b}/thread/${id}.json`
            const json = await axios.get(apiURL, {headers})
            const posts = json.data.posts
            const url = `https://boards.4channel.org/${b}/thread/${id}`
            const chanArray: EmbedBuilder[] = []
            for (const i in posts) {
                const chanEmbed = embeds.createEmbed()
                .setAuthor({name: "4chan", iconURL: "https://kisaragi.moe/assets/embed/4chan.png", url: "https://www.4chan.org/"})
                chanEmbed
                .setTitle(`${posts[0].sub ? posts[0].sub : `**4chan Search**`} ${discord.getEmoji("vigneDead")}`)
                .setURL(`${url}#p${posts[i].no}`)
                .setImage(posts[i].tim ? `https://i.4cdn.org/${b}/${posts[i].tim}${posts[i].ext}` : url)
                .setDescription(
                    `${discord.getEmoji("star")}_Author:_ **${posts[i].name} ${posts[i].now} No. ${posts[i].no}**\n` +
                    `${discord.getEmoji("star")}_Image Info:_ ${posts[i].tim ? `File: ${posts[i].filename}${posts[i].ext} (${Math.floor(posts[i].fsize/1024)} KB, ${posts[i].w}x${posts[i].h})`: "None"}\n` +
                    `${discord.getEmoji("star")}_Comment:_ ${posts[i].com ? this.formatComment(posts[i].com, `${url}#p${posts[i].no}`) : "None"}\n`
                )
                chanArray.push(chanEmbed)
            }
            if (chanArray.length === 1) {
                return this.reply(chanArray[0])
            } else {
                return embeds.createReactionEmbed(chanArray, false, true)
            }
        }
        if (!board || !query) {
            return this.noQuery(badChanEmbed, "The first parameter is the board name, the rest is the search query. Try looking at the [**4chan Website**](https://www.4chan.org/)")
        }
        if (this.nsfwBoards(board)) {
            if (!perms.checkNSFW()) return
            if (!perms.checkBotDev()) return
        }

        const threads = await this.getThreads(board, query)
        const random = Math.floor(Math.random() * threads.length)
        if (!threads[random]) {
            this.invalidQuery(badChanEmbed, "Try searching for a different tag.")
            return
        }
        const json = await axios.get(threads[random].url, {headers})
        const posts = json.data.posts
        const rawUrl = `https://boards.4channel.org/${board}/thread/${threads[random].url.match(/\d+/g)}`
        const url = rawUrl.replace(/4,/g, "")
        const chanArray: EmbedBuilder[] = []
        for (const i in posts) {
            const chanEmbed = embeds.createEmbed()
            .setAuthor({name: "4chan", iconURL: "https://kisaragi.moe/assets/embed/4chan.png", url: "https://www.4chan.org/"})
            chanEmbed
            .setTitle(`${posts[0].sub ? posts[0].sub : threads[random].semantic_url} ${discord.getEmoji("vigneDead")}`)
            .setURL(`${url}#p${posts[i].no}`)
            .setImage(posts[i].tim ? `https://i.4cdn.org/${board}/${posts[i].tim}${posts[i].ext}` : url)
            .setDescription(
                `${discord.getEmoji("star")}_Author:_ **${posts[i].name} ${posts[i].now} No. ${posts[i].no}**\n` +
                `${discord.getEmoji("star")}_Image Info:_ ${posts[i].tim ? `File: ${posts[i].filename}${posts[i].ext} (${Math.floor(posts[i].fsize/1024)} KB, ${posts[i].w}x${posts[i].h})`: "None"}\n` +
                `${discord.getEmoji("star")}_Comment:_ ${posts[i].com ? this.formatComment(posts[i].com, `${url}#p${posts[i].no}`) : "None"}\n`
            )
            chanArray.push(chanEmbed)
        }
        if (chanArray.length === 1) {
            this.reply(chanArray[0])
        } else {
            embeds.createReactionEmbed(chanArray, false, true)
        }
    }
}
