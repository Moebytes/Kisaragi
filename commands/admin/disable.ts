/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Disable extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Disables certain command categories.",
            help:
            `
            \`disable\` - Shows the disable prompt.
            \`disable category1 category2?\` - Disables the categories, or enables them if they were disabled.
            \`disable reset\` - Deletes all settings.
            `,
            examples:
            `
            \`=>disable\`
            `,
            aliases: [],
            guildOnly: true,
            cachedGuildOnly: true,
            cooldown: 3,
            defer: true,
            subcommandEnabled: true
        })
        const categoryOption = new SlashCommandOption()
            .setType("string")
            .setName("category")
            .setDescription("Can be a category/reset.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(categoryOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const embeds = new Embeds(discord, message)
        const sql = new SQLQuery(message)
        if (!message.channel.isSendable()) return
        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)
        if (!await perms.checkAdmin()) return
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            await disablePrompt(message)
            return
        }
        const categories = await sql.fetchColumn("guilds", "disabled categories")

        const disableEmbed = embeds.createEmbed()
        disableEmbed
        .setTitle(`**Disable Categories** ${discord.getEmoji("aquaWut")}`)
        .setThumbnail(message.guild!.iconURL({extension: "png"})!)
        .setDescription(Functions.multiTrim(`
            Disable command categories. Do not include "commands" in the name, eg. "music 2"
            newline
            __Current Settings__
            ${discord.getEmoji("star")}Disabled Categories: ${categories?.length ? categories.map((c: string) => `\`${c}\``).join(", ") : "None"}
            newline
            __Edit Settings__
            ${discord.getEmoji("star")}Type a **category** to disable a category, or enable it if it's already disabled.
            ${discord.getEmoji("star")}**Type multiple settings** to set them at once.
            ${discord.getEmoji("star")}Type **reset** to reset settings.
            ${discord.getEmoji("star")}Type **cancel** to exit.
        `))

        this.reply(disableEmbed)

        async function disablePrompt(msg: Message) {
            let categories = await sql.fetchColumn("guilds", "disabled categories")
            if (!categories) categories = []
            const responseEmbed = embeds.createEmbed()
            responseEmbed.setTitle(`**Disabled Categories** ${discord.getEmoji("aquaWut")}`)
            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                return discord.send(msg, responseEmbed)
            }
            if (msg.content.toLowerCase() === "reset") {
                await sql.updateColumn("guilds", "disabled categories", null)
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}All settings were reset!`)
                return discord.send(msg, responseEmbed)
            }

            const newCategories: string[] = []

            if (msg.content.match(/admin/i)) newCategories.push("admin")
            if (msg.content.match(/anime/i)) newCategories.push("anime")
            if (msg.content.match(/bot dev/i)) newCategories.push("bot developer")
            if (msg.content.match(/config/i)) newCategories.push("config")
            if (msg.content.match(/fun/i)) newCategories.push("fun")
            if (msg.content.match(/game/i)) newCategories.push("game")
            if (msg.content.match(/heart/i)) newCategories.push("heart")
            if (msg.content.match(/image/i)) newCategories.push("image")
            if (msg.content.match(/info/i)) newCategories.push("info")
            if (msg.content.match(/weeb/i)) newCategories.push("weeb")
            if (msg.content.match(/japanese/i)) newCategories.push("weeb")
            if (msg.content.match(/level/i)) newCategories.push("level")
            if (msg.content.match(/lewd/i)) newCategories.push("lewd")
            if (msg.content.match(/misc/i)) newCategories.push("misc")
            if (msg.content.match(/misc 2/i)) newCategories.push("misc 2")
            if (msg.content.match(/mod/i)) newCategories.push("mod")
            if (msg.content.match(/music/i)) newCategories.push("music")
            if (msg.content.match(/music 2/i)) newCategories.push("music 2")
            if (msg.content.match(/music 3/i)) newCategories.push("music 3")
            if (msg.content.match(/reddit/i)) newCategories.push("reddit")
            if (msg.content.match(/twitter/i)) newCategories.push("twitter")
            if (msg.content.match(/video/i)) newCategories.push("video")
            if (msg.content.match(/waifu/i)) newCategories.push("waifu")
            if (msg.content.match(/website/i)) newCategories.push("website")
            if (msg.content.match(/website 2/i)) newCategories.push("website 2")
            if (msg.content.match(/website 3/i)) newCategories.push("website 3")

            const enabledArr: string[] = []
            const disabledArr: string[] = []
            for (let i = 0; i < newCategories.length; i++) {
                if (categories.includes(newCategories[i])) {
                    enabledArr.push(newCategories[i])
                } else {
                    disabledArr.push(newCategories[i])
                }
            }
            let description = ""
            if (enabledArr.length) {
                description += `Enabled the ${enabledArr.length === 1 ? "category" : "categories"} ${enabledArr.map((c) => `\`${c}\``).join(", ")}!\n`
            }
            if (disabledArr.length) {
                description += `Disabled the ${disabledArr.length === 1 ? "category" : "categories"} ${disabledArr.map((c) => `\`${c}\``).join(", ")}!\n`
            }
            if (!description) description = `${discord.getEmoji("star")}No changes made, canceled the prompt. ${discord.getEmoji("kannaFacepalm")}`

            categories = [...categories, ...newCategories]
            for (let i = 0; i < enabledArr.length; i++) {
                Functions.arrayRemove(categories, enabledArr[i])
            }
            await sql.updateColumn("guilds", "disabled categories", categories)
            responseEmbed
            .setDescription(description)
            return discord.send(msg, responseEmbed)
        }
        await embeds.createPrompt(disablePrompt)
    }
}
