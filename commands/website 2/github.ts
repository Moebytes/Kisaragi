 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import type {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

const GitHub = require("github-api")

export default class Github extends Command {
    private user = null as any
    private repo = null as any
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for github repositories and users.",
            help:
            `
            \`github query\` - Searches for repositories with the query
            \`github user query\` - Searches for users with the query
            `,
            examples:
            `
            \`=>github anime\`
            \`=>github user github\`
            `,
            aliases: ["gh"],
            random: "string",
            cooldown: 30,
            defer: true,
            subcommandEnabled: true
        })
        const query2Option = new SlashCommandOption()
            .setType("string")
            .setName("query2")
            .setDescription("The query in the user subcommand.")

        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("Can be a query or user.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(queryOption)
            .addOption(query2Option)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
        const github = new GitHub()

        if (args[1]?.match(/github.com/)) {
            const matches = args[1].replace("www.", "").replace("https://github.com", "").match(/(?<=\/)(.*?)(?=$|\/)/g)
            this.user = matches?.[0]
            this.repo = matches?.[1]
            if (this.user.includes("search")) {
                this.repo = matches?.[0].replace("search?q=", "")
            }
        }

        if ((this.user && !this.repo) || args[1]?.toLowerCase() === "user") {
            const input = this.user || Functions.combineArgs(args, 2)
            if (!input) {
                return this.noQuery(embeds.createEmbed()
                .setAuthor({name: "github", iconURL: "https://kisaragi.moe/assets/embed/github.png", url: "https://github.com/"})
                .setTitle(`**Github Search** ${discord.getEmoji("raphi")}`))
            }
            const user = github.getUser(input.trim())
            const json = await user.getProfile()
            const result = json.data
            const githubEmbed = embeds.createEmbed()
            githubEmbed
            .setAuthor({name: "github", iconURL: "https://kisaragi.moe/assets/embed/github.png", url: "https://github.com/"})
            .setTitle(`**Github Search** ${discord.getEmoji("raphi")}`)
            .setURL(result.html_url)
            .setDescription(
                `${discord.getEmoji("star")}_Name:_ **${result.login}**\n` +
                `${discord.getEmoji("star")}_Link:_ **${result.html_url}**\n` +
                `${discord.getEmoji("star")}_Creation Date:_ **${Functions.formatDate(result.created_at)}**\n` +
                `${discord.getEmoji("star")}_Updated:_ **${Functions.formatDate(result.updated_at)}**\n` +
                `${discord.getEmoji("star")}_Location:_ **${result.location}**\n` +
                `${discord.getEmoji("star")}_Repositories:_ **${result.public_repos}**\n` +
                `${discord.getEmoji("star")}_Followers:_ **${result.followers}**\n` +
                `${discord.getEmoji("star")}_Following:_ **${result.following}**\n` +
                `${discord.getEmoji("star")}_Email:_ **${result.email ? result.email : "None"}**\n` +
                `${discord.getEmoji("star")}_Bio:_ ${result.bio}\n`
            )
            .setThumbnail(result.avatar_url)
            return this.reply(githubEmbed)
        }

        const input = this.repo || Functions.combineArgs(args, 1)
        if (!input) {
            return this.noQuery(embeds.createEmbed()
            .setAuthor({name: "github", iconURL: "https://kisaragi.moe/assets/embed/github.png", url: "https://github.com/"})
            .setTitle(`**Github Search** ${discord.getEmoji("raphi")}`))
        }
        const search = github.search({q: input.trim()})
        const json = await search.forRepositories().catch(() => {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "github", iconURL: "https://kisaragi.moe/assets/embed/github.png", url: "https://github.com/"})
            .setTitle(`**Github Search** ${discord.getEmoji("raphi")}`))
        })
        const result = json.data
        const githubArray: EmbedBuilder[] = []
        for (let i = 0; i < Math.min(10, result.length); i++) {
            // const source = await axios.get(result[i].html_url, {headers})
            const regex = /(?<=name="twitter:image:src" content=")(.*?)(?=" \/\>)/
            // const image = regex.exec(source.data)
            const githubEmbed = embeds.createEmbed()
            githubEmbed
            .setAuthor({name: "github", iconURL: "https://kisaragi.moe/assets/embed/github.png", url: "https://github.com/"})
            .setTitle(`**Github Search** ${discord.getEmoji("raphi")}`)
            .setURL(result[i].html_url)
            .setDescription(
                `${discord.getEmoji("star")}_Name:_ **${result[i].name}**\n` +
                `${discord.getEmoji("star")}_Author:_ **${result[i].owner.login}**\n` +
                `${discord.getEmoji("star")}_Link:_ **${result[i].html_url}**\n` +
                `${discord.getEmoji("star")}_Language:_ **${result[i].language}**\n` +
                `${discord.getEmoji("star")}_Stargazers:_ **${result[i].stargazers_count}**\n` +
                `${discord.getEmoji("star")}_Forks:_ **${result[i].forks_count}**\n` +
                `${discord.getEmoji("star")}_Open Issues:_ **${result[i].open_issues}**\n` +
                `${discord.getEmoji("star")}_Watchers:_ **${result[i].watchers_count}**\n` +
                `${discord.getEmoji("star")}_Creation Date:_ **${Functions.formatDate(result[i].created_at)}**\n` +
                `${discord.getEmoji("star")}_Updated:_ **${Functions.formatDate(result[i].updated_at)}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${result[i].description}\n`
            )
            .setThumbnail(result[i].owner.avatar_url || null)
            // .setImage(image?.[0] || null)
            githubArray.push(githubEmbed)
        }
        return embeds.createReactionEmbed(githubArray, false, true)
    }
}
