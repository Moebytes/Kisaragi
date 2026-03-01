/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import axios from "axios"
import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import GoogleImages from "google-images"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "./../../structures/Permission"

let pinArray: EmbedBuilder[] = []

export default class Pinterest extends Command {
    private user = null as any
    private board = null as any
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for images on pinterest.",
            help:
            `
            \`pinterest query\` - Searches pinterest for the query
            \`pinterest user username\` - Searches for pins by the user
            \`pinterest board username boardname\` - Searches for pins in a user's board
            `,
            examples:
            `
            \`=>pinterest anime\`
            \`=>pinterest user name\`
            \`=>pinterest board name anime\`
            `,
            aliases: ["pint"],
            random: "string",
            cooldown: 15,
            defer: true,
            subcommandEnabled: true
        })
        const boardOption = new SlashCommandOption()
            .setType("string")
            .setName("boardname")
            .setDescription("Boardname in the board subcommand.")

        const usernameOption = new SlashCommandOption()
            .setType("string")
            .setName("username")
            .setDescription("Can be a username.")

        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("Can be a query/user/board.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(queryOption)
            .addOption(usernameOption)
            .addOption(boardOption)
    }

    public pinterestError = (discord: Kisaragi, message: Message, embeds: Embeds, msg?: string) => {
        if (!msg) msg = ""
        const pinterestEmbed = embeds.createEmbed()
        pinterestEmbed
        .setAuthor({name: "pinterest", iconURL: "https://kisaragi.moe/assets/embed/pinterest.png", url: "https://www.pinterest.com/"})
        .setTitle(`**Pinterest Search** ${discord.getEmoji("aquaUp")}`)
        .setDescription(`No results were found. ${msg}Try searching on the pinterest website: ` +
        "[Pinterest Website](https://www.pinterest.com/)")
        this.reply(pinterestEmbed)
    }

    public pinterestPin = (discord: Kisaragi, message: Message, response: any) => {
        const embeds = new Embeds(discord, message)
        const pinterestEmbed = embeds.createEmbed()
        pinterestEmbed
        .setAuthor({name: "pinterest", iconURL: "https://kisaragi.moe/assets/embed/pinterest.png", url: "https://www.pinterest.com/"})
        .setTitle(`**Pinterest Search** ${discord.getEmoji("aquaUp")}`)
        .setURL(response.url)
        .setImage(response.image.original.url)
        .setDescription(
            `${discord.getEmoji("star")}_Creator:_ **${response.creator.url}**\n` +
            `${discord.getEmoji("star")}_Board:_ **${response.board.url}**\n` +
            `${discord.getEmoji("star")}_Creation Date:_ **${Functions.formatDate(response.created_at)}**\n` +
            `${discord.getEmoji("star")}_Saves:_ **${response.counts.saves}**\n` +
            `${discord.getEmoji("star")}_Comments:_ **${response.counts.comments}**\n` +
            `${discord.getEmoji("star")}_Source:_ **${response.link ? response.link : "None"}**\n` +
            `${discord.getEmoji("star")}_Note:_ ${response.note ? response.note : "None"}\n`
        )
        pinArray.push(pinterestEmbed)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
        const images = new GoogleImages(process.env.PINTEREST_SEARCH_ID!, process.env.GOOGLE_API_KEY!)
        pinArray = []
        if (args[1]?.match(/pinterest.com/)) {
            const matches = args[1].replace("www.", "").replace("https://pinterest.com", "").match(/(?<=\/)(.*?)(?=\/)/g)
            if (matches?.[0] && matches[0] !== "pin") {
                this.user = matches[0]
                if (matches[1]) this.board = matches[1]
            }
        }

        if (this.board || args[1] === "board") {
            const user = this.user || args[2]
            const board = this.board || args[3]
            if (!user || !board) return this.pinterestError(discord, message, embeds, "You need to specify a user and a board. ")
            // const json = await axios.get(`https://api.pinterest.com/v1/boards/${user}/${board}/pins/?access_token=${accessToken}&fields=id,link,url,creator,board,created_at,note,color,counts,media,attribution,image,metadata`)
            const json = await axios.get(`https://feed2json.org/convert?url=https://www.pinterest.com/${user}/${board}.rss`, {headers})
            const response = json.data
            const boardname = response.title
            for (let i = 0; i < response.items.length; i++) {
                const pinUrl = response.items[i].url
                const pinTitle = response.items[i].title ? response.items[i].title : "None"
                const pinImage = (response.items[i].content_html as string).match(/(?<=img src=")(.*?)(?=")/)![0]
                const pinDate = response.items[i].date_published
                const pinEmbed = embeds.createEmbed()
                pinEmbed
                .setAuthor({name: "pinterest", iconURL: "https://kisaragi.moe/assets/embed/pinterest.png", url: "https://www.pinterest.com/"})
                .setTitle(`**Pinterest Search** ${discord.getEmoji("aquaUp")}`)
                .setURL(pinUrl)
                .setImage(pinImage ? pinImage : "")
                .setDescription(
                    `${discord.getEmoji("star")}_Title:_ **${pinTitle}**\n` +
                    `${discord.getEmoji("star")}_Board:_ **${boardname}**\n` +
                    `${discord.getEmoji("star")}_Date:_ **${Functions.formatDate(pinDate)}**\n`
                )
                pinArray.push(pinEmbed)
            }
            if (!pinArray.join("")) {
                return this.pinterestError(discord, message, embeds)
            }
            if (pinArray.length === 1) {
                return this.reply(pinArray[0])
            } else {
                return embeds.createReactionEmbed(pinArray, true, true)
            }
        }

        if (this.user || args[1] === "user") {
            const user = this.user || args[2]
            if (!args[2]) return this.pinterestError(discord, message, embeds, "You need to specify the user. ")
            const json = await axios.get(`https://feed2json.org/convert?url=https://www.pinterest.com/${user}/feed.rss`, {headers})
            const response = json.data
            const username = response.title
            for (let i = 0; i < response.items.length; i++) {
                const pinUrl = response.items[i].url
                const pinTitle = response.items[i].title ? response.items[i].title : "None"
                const pinImage = (response.items[i].content_html as string).match(/(?<=img src=")(.*?)(?=")/)![0]
                const pinDate = response.items[i].date_published
                const pinEmbed = embeds.createEmbed()
                pinEmbed
                .setAuthor({name: "pinterest", iconURL: "https://kisaragi.moe/assets/embed/pinterest.png", url: "https://www.pinterest.com/"})
                .setTitle(`**Pinterest Search** ${discord.getEmoji("aquaUp")}`)
                .setURL(pinUrl)
                .setImage(pinImage ? pinImage : "")
                .setDescription(
                    `${discord.getEmoji("star")}_Title:_ **${pinTitle}**\n` +
                    `${discord.getEmoji("star")}_Pinner:_ **${username}**\n` +
                    `${discord.getEmoji("star")}_Date:_ **${Functions.formatDate(pinDate)}**\n`
                )
                pinArray.push(pinEmbed)
            }
            if (!pinArray.join("")) return this.pinterestError(discord, message, embeds)
            if (pinArray.length === 1) {
                return this.reply(pinArray[0])
            } else {
                return embeds.createReactionEmbed(pinArray, true, true)
            }
        }

        let query = Functions.combineArgs(args, 1)
        if (!query) query = "anime"
        const imageResult = await images.search(query) as any
        const rand = Math.floor(Math.random() * imageResult.length)
        const randPin = imageResult[rand]?.parentPage
        /*
        for (let i = 0; i < imageResult.length; i++) {
            const pinEmbed = embeds.createEmbed()
            pinEmbed
            .setAuthor("pinterest", "https://kisaragi.moe/assets/embed/pinterest.png")
            .setTitle(`**Pinterest Search** ${discord.getEmoji("aquaUp")}`)
            .setURL(imageResult[i].parentPage)
            .setImage(imageResult[i].url)
            .setDescription(
                `${discord.getEmoji("star")}_Description:_ ${imageResult[i].description}`
            )
            pinArray.push(pinEmbed)
        }*/
        /*
        const json = await axios.get(`https://api.pinterest.com/v1/pins/${pin}/?access_token=${accessToken}&fields=id,link,url,creator,board,created_at,note,color,counts,media,attribution,image,metadata`)
        const response = json.data.data
        console.log(response)
        const board = response.board.url.slice(25)
        const response2 = await axios.get(`https://api.pinterest.com/v1/boards/${board}/pins/?access_token=${accessToken}&fields=id,link,url,creator,board,created_at,note,color,counts,media,attribution,image,metadata`)
        const random2 = Math.floor(Math.random() * response2.data.length)
        this.pinterestPin(discord, message, response2.data[random2])
        */

        const res = await axios.get(randPin, {headers})
        const usernames = res.data.match(/(?<="username":")(.*?)(?=",")/g)

        const exists = new Set<string>()

        for (let j = 0; j < usernames.length; j++) {
            if (pinArray.length > 500) break
            const user = usernames[j]
            let json: any
            try {
                json = await axios.get(`https://feed2json.org/convert?url=https://www.pinterest.com/${user}/feed.rss`)
            } catch {
                continue
            }
            const response = json.data
            const username = response.title
            for (let i = 0; i < response.items.length; i++) {
                const pinUrl = response.items[i].url
                if (exists.has(pinUrl)) continue
                exists.add(pinUrl)
                const pinTitle = response.items[i].title ? response.items[i].title : "None"
                const pinImage = (response.items[i].content_html as string).match(/(?<=img src=")(.*?)(?=")/)![0]
                const pinDate = response.items[i].date_published
                const pinEmbed = embeds.createEmbed()
                pinEmbed
                .setAuthor({name: "pinterest", iconURL: "https://kisaragi.moe/assets/embed/pinterest.png", url: "https://www.pinterest.com/"})
                .setTitle(`**Pinterest Search** ${discord.getEmoji("aquaUp")}`)
                .setURL(pinUrl)
                .setImage(pinImage ? pinImage : "")
                .setDescription(
                    `${discord.getEmoji("star")}_Title:_ **${pinTitle}**\n` +
                    `${discord.getEmoji("star")}_Pinner:_ **${username}**\n` +
                    `${discord.getEmoji("star")}_Date:_ **${Functions.formatDate(pinDate)}**\n`
                )
                pinArray.push(pinEmbed)
            }
        }

        pinArray = Functions.shuffleArray(pinArray)

        if (!pinArray.join("")) return this.pinterestError(discord, message, embeds)
        if (pinArray.length === 1) {
            return this.reply(pinArray[0])
        } else {
            return embeds.createReactionEmbed(pinArray, true, true)
        }
    }
}
