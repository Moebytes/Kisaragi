/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Ban extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Bans the specified users.",
            help:
            `
            \`ban @user1 @user2 reason?\` - Bans the user(s) with an optional reason
            \`ban id1 id2 reason?\` - Bans by user id instead of mention
            `,
            examples:
            `
            \`=>ban @user spammer\`
            `,
            guildOnly: true,
            cachedGuildOnly: true,
            botPermission: "BanMembers",
            aliases: [],
            cooldown: 3,
            subcommandEnabled: true
        })
        const reasonOption = new SlashCommandOption()
            .setType("string")
            .setName("reason")
            .setDescription("The ban reason.")

        const userOption = new SlashCommandOption()
            .setType("user")
            .setName("user")
            .setDescription("The user to ban.")
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

        const members: string[] = []
        for (let i = 0; i < userArray.length; i++) {
            const user = await discord.users.fetch(userArray[i])
            if (user) {
                members.push(`<@${user.id}>`)
            } else {
                continue
            }
            banEmbed
            .setAuthor({name: "ban", iconURL: "https://kisaragi.moe/assets/embed/ban.png"})
            .setTitle(`**You Were Banned** ${discord.getEmoji("kannaLeave")}`)
            .setDescription(`${discord.getEmoji("star")}_You were banned from ${message.guild!.name} for reason:_ **${reason}**`)
            try {
                await message.guild?.members.ban(user, {reason, deleteMessageSeconds: 7 * 24 * 60 * 60})
                const data = {type: "ban", user: user.id, executor: message.author.id, date: Date.now(), guild: message.guild?.id, reason, context: message.url}
                discord.emit("caseUpdate", data)
            } catch {
                return message.reply(`I need the **Ban Members** permission ${discord.getEmoji("kannaFacepalm")}`)
            }
            const dm = await user.createDM().catch(() => null)
            if (dm) await discord.channelSend(dm, banEmbed).catch(() => null)
        }
        if (!members[0]) return this.reply(`Invalid users ${discord.getEmoji("kannaFacepalm")}`)
        banEmbed
        .setAuthor({name: "ban", iconURL: "https://kisaragi.moe/assets/embed/ban.png"})
        .setTitle(`**Member Banned** ${discord.getEmoji("kannaLeave")}`)
        .setDescription(`${discord.getEmoji("star")}_Successfully banned ${members.join(", ")} for reason:_ **${reason}**`)
        this.reply(banEmbed)
    }
}
