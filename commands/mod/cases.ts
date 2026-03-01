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
import {SQLQuery} from "../../structures/SQLQuery"

export default class Cases extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Lists all logged moderation cases.",
          help:
          `
          _Note: You need to enable the mod log in \`logs\` for cases to be recorded._
          \`cases\` - All cases in the server
          \`cases @user/id\` - Cases for a user
          \`cases mod @user/id\` - Cases executed by this moderator
          `,
          examples:
          `
          \`=>cases\`
          \`=>cases mod @moderator\`
          `,
          guildOnly: true,
          cachedGuildOnly: true,
          aliases: ["modlog", "caselog"],
          cooldown: 10,
          subcommandEnabled: true
        })
        const user2Option = new SlashCommandOption()
            .setType("string")
            .setName("user2")
            .setDescription("The user in the mod subcommand.")

        const userOption = new SlashCommandOption()
            .setType("string")
            .setName("user")
            .setDescription("Can be a user or mod.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(userOption)
            .addOption(user2Option)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const sql = new SQLQuery(message)
        const embeds = new Embeds(discord, message)
        if (!await perms.checkMod()) return

        let cases = await sql.fetchColumn("guilds", "cases")
        if (!cases) return this.reply(`This server has no cases. Cases are only recorded if you have the **mod log** on, which you can enable in \`logs\`. ${discord.getEmoji("kannaFacepalm")}`)
        cases = cases.map((c: any) => JSON.parse(c))

        if (args[1]) {
            if (args[1].toLowerCase() === "mod" && args[2]?.match(/\d+/)) {
                const user = await discord.users.fetch(args[2].match(/\d+/)?.[0] ?? "")
                cases = cases.filter((c: any) => c.executor === user.id)
            } else if (args[1].match(/\d+/)) {
                const user = await discord.users.fetch(args[1].match(/\d+/)?.[0] ?? "")
                cases = cases.filter((c: any) => c.user === user.id)
            }
        }

        const caseArray: EmbedBuilder[] = []
        const step = 5.0
        const increment = Math.ceil(cases.length / step)
        for (let i = 0; i < increment; i++) {
            let logs = ""
            for (let j = 0; j < step; j++) {
                const k = (i*step)+j
                if (!cases[k]) break
                const user = await discord.users.fetch(cases[k].user)
                const executor = await discord.users.fetch(cases[k].executor)
                const num = cases[k].context ? `[**#${cases[k].case}**](${cases[k].context})` : `**#${cases[k].case}**`
                logs +=
                `${discord.getEmoji("star")}_Case:_ ${num}\n` +
                `${discord.getEmoji("star")}_Date:_ \`${Functions.formatDate(cases[k].date)}\`\n` +
                `${discord.getEmoji("star")}_Action:_ **${cases[k].type}**\n` +
                `${discord.getEmoji("star")}_User:_ **${user.tag}** \`(${user.id})\`\n` +
                `${discord.getEmoji("star")}_Executor:_ **${executor.tag}** \`(${executor.id})\`\n` +
                `${discord.getEmoji("star")}_Reason:_ ${cases[k].reason}\n\n`
            }
            const caseEmbed = embeds.createEmbed()
            caseEmbed
            .setAuthor({name: "cases", iconURL: "https://kisaragi.moe/assets/embed/cases.png"})
            .setTitle(`**Moderation Cases** ${discord.getEmoji("chinoSmug")}`)
            .setThumbnail(message.author.displayAvatarURL({extension: "png"}))
            .setDescription(logs)
            caseArray.push(caseEmbed)
        }

        if (caseArray.length === 1) {
            this.reply(caseArray[0])
        } else {
            embeds.createReactionEmbed(caseArray)
        }
    }
}
