/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, TextChannel} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class DeleteCase extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Deletes a moderation case, or all cases.",
            help:
            `
            \`deletecase case\` - Deletes a case.
            \`deletecase all\` - Deletes all cases (no undo).
            `,
            examples:
            `
            \`=>deletecase 5\`
            \`=>deletecase all\`
            `,
            aliases: ["delcase"],
            guildOnly: true,
            cachedGuildOnly: true,
            cooldown: 10,
            subcommandEnabled: true
        })
        const caseOption = new SlashCommandOption()
            .setType("string")
            .setName("case")
            .setDescription("Can be a case/all.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(caseOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const embeds = new Embeds(discord, message)
        const sql = new SQLQuery(message)
        if (!await perms.checkAdmin()) return

        if (!args[1]) return this.reply(`What case do you want to delete ${discord.getEmoji("kannaFacepalm")}`)

        if (args[1] === "all") {
            await sql.updateColumn("guilds", "cases", null)
            return this.reply(`Deleted all cases! ${discord.getEmoji("kaosWTF")}`)
        }

        let cases = await sql.fetchColumn("guilds", "cases")
        if (!cases) return this.reply(`There are no cases ${discord.getEmoji("kannaFacepalm")}`)
        cases = cases.map((c: any) => JSON.parse(c))

        const index = cases.findIndex((c: any) => Number(c.case) === Number(args[1]))
        if (index === -1) return this.reply(`Invalid case ${discord.getEmoji("kannaFacepalm")}`)
        cases[index] = ""
        cases = cases.filter(Boolean)
        cases.forEach((c: any) => {
            if (Number(c.case) > index) c.case = Number(c.case) - 1
        })
        await sql.updateColumn("guilds", "cases", cases)

        if (cases[index].type === "warn") {
            const warns = await sql.fetchColumn("guilds", "warn log")
            loop:
            for (let i = 0; i < warns.length; i++) {
                warns[i] = JSON.parse(warns[i])
                for (let j = 0; j < warns[i].warns.length; j++) {
                    if (cases[index].hash === warns[i].warns[j].hash) {
                        warns[i].warns[j] = ""
                        warns[i].warns = warns[i].warns.filter(Boolean)
                        break loop
                    }
                }
            }
            await sql.updateColumn("guilds", "warn log", warns)
        }
        return this.reply(`Deleted case **#${Number(args[1])}**!`)
    }
}
