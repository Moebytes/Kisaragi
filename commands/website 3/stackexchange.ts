/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class StackExchange extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for questions on a stack exchange site, use alias \`stackoverflow\` for stack overflow.",
            help:
            `
            _Note: You must use the stackoverflow alias in order to search on stackoverflow._
            \`stackoverflow query\` - Gets questions and answers from stack overflow
            \`stackexchange site query\` - Gets questions and answers from the stack exchange site
            `,
            examples:
            `
            \`=>stackoverflow typescript\`
            \`=>stackexchange anime slice of life\`
            `,
            aliases: ["stack", "stackoverflow"],
            random: "none",
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const query2Option = new SlashCommandOption()
            .setType("string")
            .setName("query2")
            .setDescription("Query in the site subcommand.")

        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("Can be a query/site.")

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
        const stackexchange = require("stackexchange")
        const stack = new stackexchange({version: 2.2})
        let query = ""
        let site = "stackoverflow"
        if (args[0] === "stackoverflow") {
            query = Functions.combineArgs(args, 1)
        } else {
            query = Functions.combineArgs(args, 2)
            site = args[1]
        }
        if (!site || !query) return message.reply(`What do you want to search for ${discord.getEmoji("kannaCurious")}`)
        const filter = {
            key: process.env.STACK_EXCHANGE_API_KEY,
            pagesize: 30,
            intitle: query,
            filter: "withbody",
            site
        }
        let result = "" as any
        let answerResult = "" as any
        await new Promise<void>((resolve) => {
            stack.search.search({...filter, sort: "relevance"}, (err: any, res: any) => {
                result = res
                resolve()
            })
        })
        const ids = result.items.map((q) => q.question_id)
        await new Promise<void>((resolve) => {
            stack.questions.answers({...filter, sort: "votes"}, (err: any, res: any) => {
                answerResult = res
                resolve()
            }, ids)
        })
        let questions = result.items
        questions = Functions.sortObjectArray(questions, "view_count", "desc")
        const stackArray: EmbedBuilder[] = []
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i]
            let answer = answerResult.items.find((a: any) => a.question_id === question.question_id) ?? "None"
            if (answer === "undefined") answer = "None"
            const desc = Functions.decodeEntities(Functions.cleanHTML(Functions.checkChar(question.body, 500, " ")))
            const answerDesc = Functions.decodeEntities(Functions.cleanHTML(Functions.checkChar(answer.body, 500, " ")))
            const stackEmbed = embeds.createEmbed()
            if (site === "stackoverflow") {
                stackEmbed
                .setAuthor({name: "stackoverflow", iconURL: "https://kisaragi.moe/assets/embed/stackoverflow.png", url: "https://stackoverflow.com/"})
                .setTitle(`**Stack Overflow Search** ${discord.getEmoji("tohruThink")}`)
            } else {
                stackEmbed
                .setAuthor({name: "stackexchange", iconURL: "https://kisaragi.moe/assets/embed/stackexchange.png", url: "https://stackexchange.com/"})
                .setTitle(`**Stack Exchange Search** ${discord.getEmoji("tohruThink")}`)
            }
            stackEmbed
            .setURL(question.link)
            .setThumbnail(question.owner.profile_image)
            .setDescription(
                `${discord.getEmoji("star")}_Question:_ **${question.title}**\n` +
                `${discord.getEmoji("star")}_Views:_ **${question.view_count}**\n` +
                `${discord.getEmoji("star")}_Score:_ **${question.score}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${desc.replace(/\n{2,}/g, "\n")}\n` +
                `${discord.getEmoji("star")}_Answer:_ ${answerDesc.replace(/\n{2,}/g, "\n")}\n`
            )
            stackArray.push(stackEmbed)
        }
        if (stackArray.length === 1) {
            return this.reply(stackArray[0])
        } else {
            return embeds.createReactionEmbed(stackArray)
        }
    }
}
