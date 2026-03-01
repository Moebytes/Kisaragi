/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Points} from "../../structures/Points"

export default class Award extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Award users level xp.",
            help:
            `
            _Note: Remove points by awarding a negative number._
            \`award @user1 @user2? points\` - Gives the users points
            `,
            examples:
            `
            \`=>award @user1 @user2 @user3 2000\`
            \`=>award @user1 -99999\`
            `,
            guildOnly: true,
            cachedGuildOnly: true,
            aliases: ["give"],
            cooldown: 10,
            subcommandEnabled: true
        })
        const pointsOption = new SlashCommandOption()
            .setType("integer")
            .setName("points")
            .setDescription("Amount of points.")

        const userOption = new SlashCommandOption()
            .setType("user")
            .setName("user")
            .setDescription("User to award points to.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(userOption)
            .addOption(pointsOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const points = new Points(discord, message)

        const input = Functions.combineArgs(args, 1)
        let users = input.match(/(?<=<@)(.*?)(?=>)/g)?.map((u) => u)
        if (!users) users = input.match(/\d{17,}/g)?.map((u) => u)
        if (!users) return this.reply(`You must mention a user ${discord.getEmoji("kannaFacepalm")}`)
        let newMsg = input
        users = Functions.removeDuplicates(users)
        for (let i = 0; i < users.length; i++) {
            newMsg = newMsg.replace(users[i], "")
        }
        const amount = newMsg.match(/(?<!<@)(^-?\d+|-?\d+$|(?<= )-?\d+)(?!>)/)?.[0] ?? 0
        for (let i = 0; i < users.length; i++) {
            try {
                await points.giveScore(users[i].replace("!", ""), Number(amount))
            } catch {
                return this.reply(`This server has no scores ${discord.getEmoji("kannaFacepalm")}`)
            }
        }

        const awardEmbed = embeds.createEmbed()
        awardEmbed
        .setAuthor({name: "award", iconURL: "https://kisaragi.moe/assets/embed/award.png"})
        .setTitle(`**Point Award** ${discord.getEmoji("karenSugoi")}`)
        .setDescription(
            `${discord.getEmoji("star")}Awarded **${amount}** points to ${users.map((u) => `<@${u}>`).join(", ")}!`
        )
        return this.reply(awardEmbed)
    }
}
