/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import axios from "axios"
import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Wattpad extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for stories on wattpad.",
            help:
            `
            \`wattpad query\` - Searches for stories
            `,
            examples:
            `
            \`=>wattpad gabriel dropout\`
            `,
            aliases: [],
            random: "string",
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("The query to search.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(queryOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const query = Functions.combineArgs(args, 1)
        if (!query) {
            return this.noQuery(embeds.createEmbed())
        }

        const headers = {
            "accept": "application/json",
            "authorization": `${process.env.WATTPAD_API_KEY}`,
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"
        }
        const result = await axios.get(`https://api.wattpad.com/v4/stories?query=${query}`, {headers})
        const rand = Math.floor(Math.random()*result.data.stories.length)
        const story = result.data.stories[rand]
        const wattpadArray: EmbedBuilder[] = []
        const wattpadEmbed = embeds.createEmbed()
        wattpadEmbed
        .setAuthor({name: "wattpad", iconURL: "https://kisaragi.moe/assets/embed/wattpad.png", url: "https://www.wattpad.com/"})
        .setTitle(`**Wattpad Story** ${discord.getEmoji("raphiSmile")}`)
        .setURL(story.url)
        .setImage(story.cover || null)
        .setThumbnail(story.user.avatar || null)
        .setDescription(
            `${discord.getEmoji("star")}_Title:_ **${story.title}**\n` +
            `${discord.getEmoji("star")}_Writer:_ **${story.user.name}**\n` +
            `${discord.getEmoji("star")}_ID:_ \`${story.id}\`\n` +
            `${discord.getEmoji("star")}_Length:_ **${story.length} words**\n` +
            `${discord.getEmoji("star")}_Creation Date:_ \`${Functions.formatDate(story.createDate)}\`\n` +
            `${discord.getEmoji("star")}_Votes:_ **${story.voteCount}**\n` +
            `${discord.getEmoji("star")}_Reads:_ **${story.readCount}**\n` +
            `${discord.getEmoji("star")}_Comments:_ **${story.commentCount}**\n` +
            `${discord.getEmoji("star")}_Description:_ ${Functions.checkChar(story.description, 1500, " ")}\n`
        )
        wattpadArray.push(wattpadEmbed)

        const partTitles = story.parts.map((p: any) => p.title)
        const partDates = story.parts.map((p: any) => p.createDate)
        const partLengths = story.parts.map((p: any) => p.length)
        const partVotes = story.parts.map((p: any) => p.voteCount)
        const partReads = story.parts.map((p: any) => p.readCount)
        const partComments = story.parts.map((p: any) => p.commentCount)
        const partURLS = story.parts.map((p: any) => p.url)
        const partIDS = story.parts.map((p: any) => p.id)
        const partPhotos = story.parts.map((p: any) => p.photoUrl)

        const max = partURLS.length > 20 ? 20 : partURLS.length
        for (let i = 0; i < max; i++) {
            const html = await axios.get(partURLS[i]).then((r) => r.data)
            const match = Functions.decodeEntities(Functions.cleanHTML(html.match(/(?<=<pre>)((.|\n)*?)(?=<\/pre>)/gm)?.[0])).replace(/\s{2,}/g, "")
            .replace(/Oops! This image does not follow our content guidelines./g, "").replace(/To continue publishing, please remove it or upload a different image./g, "")
            .replace(/&quot;/gm, '"').replace(/&apos;/gm, "'").replace(/&lt;/g, "<").replace(/&gt;/gm, ">")
            const description = `${discord.getEmoji("star")}_Title:_ **${partTitles[i]}**\n` +
            `${discord.getEmoji("star")}_Writer:_ **${story.user.name}**\n` +
            `${discord.getEmoji("star")}_ID:_ \`${partIDS[i]}\`\n` +
            `${discord.getEmoji("star")}_Creation Date:_ \`${Functions.formatDate(partDates[i])}\`\n` +
            `${discord.getEmoji("star")}_Length:_ **${partLengths[i]} words**\n` +
            `${discord.getEmoji("star")}_Reads:_ **${partReads[i]}**\n` +
            `${discord.getEmoji("star")}_Votes_ **${partVotes[i]}**\n` +
            `${discord.getEmoji("star")}_Comments:_ **${partComments[i]}**\n` +
            `${match}`
            const splits = Functions.splitMessage(description, {maxLength: 2000, char: "."})
            for (let j = 0; j < splits?.length; j++) {
                const wattpadEmbed = embeds.createEmbed()
                wattpadEmbed
                .setAuthor({name: "wattpad", iconURL: "https://kisaragi.moe/assets/embed/wattpad.png", url: "https://www.wattpad.com/"})
                .setTitle(`**Wattpad Story** ${discord.getEmoji("raphiSmile")}`)
                .setURL(partURLS[i])
                .setImage(partPhotos[i] || null)
                .setThumbnail(story.user.avatar || null)
                .setDescription(splits[j].trim())
                wattpadArray.push(wattpadEmbed)
            }
        }
        if (wattpadArray.length === 1) {
            return this.reply(wattpadArray[0])
        } else {
            return embeds.createReactionEmbed(wattpadArray, false, true)
        }
    }
}
