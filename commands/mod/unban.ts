 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, User} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Unban extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Unbans the specified users.",
            help:
            `
            \`unban id1 id2 reason?\` - Unbans the user(s) by user id, with an optional reason
            `,
            examples:
            `
            \`=>unban 593838271650332672 forgiven\`
            `,
            guildOnly: true,
            cachedGuildOnly: true,
            aliases: [],
            cooldown: 3,
            subcommandEnabled: true
        })
        const reasonOption = new SlashCommandOption()
            .setType("string")
            .setName("reason")
            .setDescription("The temp ban reason.")

        const userOption = new SlashCommandOption()
            .setType("string")
            .setName("user")
            .setDescription("The user id to unban.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(userOption)
            .addOption(reasonOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        if (!await perms.checkMod()) return
        const banEmbed = embeds.createEmbed()
        const reasonArray: string[] = []
        const userArray: string[] = []

        for (let i = 1; i < args.length; i++) {
            if (args[i].match(/\d+/g)) {
                userArray.push(args[i].match(/\d+/g)![0])
            } else {
                reasonArray.push(args[i])
            }
        }

        const reason = reasonArray.join("") ? reasonArray.join(" ") : "None provided!"

        const users: string[] = []
        for (let i = 0; i < userArray.length; i++) {
            let user: User
            try {
                user = await discord.users.fetch(userArray[i])
            } catch {
                continue
            }
            users.push(`<@${user.id}>`)
            banEmbed
            .setTitle(`**You Were Unbanned** ${discord.getEmoji("ceaseBullying")}`)
            .setDescription(`${discord.getEmoji("star")}_You were unbanned from ${message.guild!.name} for reason:_ **${reason}**`)
            try {
                await message.guild!.members.unban(user, reason)
                const data = {type: "unban", user: user.id, executor: message.author.id, date: Date.now(), guild: message.guild?.id, reason, context: message.url}
                discord.emit("caseUpdate", data)
            } catch {
                return this.reply(`I need the **Ban Members** permission ${discord.getEmoji("kannaFacepalm")}`)
            }
            await discord.dmSend(user, banEmbed).catch(() => null)
        }
        if (!users[0]) return this.reply(`Invalid users ${discord.getEmoji("kannaFacepalm")}`)
        banEmbed
        .setAuthor({name: "unban", iconURL: "https://kisaragi.moe/assets/embed/unban.png"})
        .setTitle(`**Member Unbanned** ${discord.getEmoji("ceaseBullying")}`)
        .setDescription(`${discord.getEmoji("star")}_Successfully unbanned ${users.join(", ")} for reason:_ **${reason}**`)
        return this.reply(banEmbed)
    }
}
