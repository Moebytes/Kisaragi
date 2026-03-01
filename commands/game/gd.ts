/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder, AttachmentBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"
import GD from "gd.js"

export default class GeometryDash extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for geometry dash players and levels.",
            help:
            `
            \`gd query\` - Searches for levels with the query
            \`gd user name\` - Gets the profile of a user
            `,
            examples:
            `
            \`=>gd anime\`
            \`=>gd user viprin\`
            `,
            aliases: [],
            random: "string",
            cooldown: 10,
            subcommandEnabled: true
        })
        const nameOption = new SlashCommandOption()
            .setType("string")
            .setName("name")
            .setDescription("Can be name or 100/friends/global/creators.")

        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("Can be query/user/daily/weekly/top.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName("gd")
            .setDescription(this.options.description)
            .addOption(queryOption)
            .addOption(nameOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)

        const gd = new GD()

        if (args[1] === "user") {
            let nick = Functions.combineArgs(args, 2)?.trim()
            if (nick.match(/gdprofiles.com/)) {
                nick = nick.replace("https://gdprofiles.com/", "")
            }
            const user = await gd.users.get(nick)
            const thumbnailBuffer =  await user.cosmetics.renderIcon("cube")
            const attachment = new AttachmentBuilder(Buffer.from(thumbnailBuffer), {name: "icon.png"})
            const levels = await user.getLevels(5)
            const gdEmbed = embeds.createEmbed()
            gdEmbed
            .setAuthor({name: "geometry dash", iconURL: "https://kisaragi.moe/assets/embed/gd.png"})
            .setTitle(`**GD Profile** ${discord.getEmoji("raphi")}`)
            .setDescription(
                `${discord.getEmoji("star")}${discord.getEmoji("gdStar")} **${user.stats.stars}** ` +
                `${discord.getEmoji("gdDiamond")} **${user.stats.diamonds}** ` +
                `${discord.getEmoji("gdCoin")} **${user.stats.coins.normal}** ` +
                `${discord.getEmoji("gdUserCoin")} **${user.stats.coins.user}** ` +
                `${discord.getEmoji("gdDemon")} **${user.stats.demons}** ` +
                `${discord.getEmoji("gdCP")} **${user.stats.cp}** \n` +
                `${discord.getEmoji("star")}_Name:_ **${user.username}**\n` +
                `${discord.getEmoji("star")}_Rank:_ **#${user.stats.rank}**\n` +
                `${discord.getEmoji("star")}_User ID:_ **${user.id}**\n` +
                `${discord.getEmoji("star")}_Account ID:_ **${user.accountID}**\n` +
                `${discord.getEmoji("star")}_Account Type:_ **${user.permissions.pretty}**\n` +
                `${discord.getEmoji("star")}_Youtube:_ **${user.socials.youtube?.path}**\n` +
                `${discord.getEmoji("star")}_Twitch:_ **${user.socials.twitch?.path}**\n` +
                `${discord.getEmoji("star")}_Twitter:_ **${user.socials.twitter?.path}**\n` +
                `${discord.getEmoji("star")}_Recent Level:_ ${levels.length ? levels.map((level) => level.name).join(", ") : "None"}\n`
            )
            .setThumbnail(`attachment://icon.png`)
            return this.reply(gdEmbed, attachment)
        }

        const query = Functions.combineArgs(args, 1)

        const levels = await gd.levels.search({query}, 100)
        const gdArray: EmbedBuilder[] = []
        for (let i = 0; i < levels.length; i++) {
            const level = levels[i]
            const user = await level.getCreator()
            const gdEmbed = embeds.createEmbed()
            gdEmbed
            .setAuthor({name: "geometry dash", iconURL: "https://kisaragi.moe/assets/embed/gd.png"})
            .setTitle(`**GD Level** ${discord.getEmoji("raphi")}`)
            .setDescription(
                `${discord.getEmoji("star")}_Name:_ **${level.name}**\n` +
                `${discord.getEmoji("star")}_Creator:_ **${user?.username || "Not found"}**\n` +
                `${discord.getEmoji("star")}_Level ID:_ **${level.id}**\n` +
                `${discord.getEmoji("star")}_Song ID:_ **${level.song.id}**\n` +
                `${discord.getEmoji("star")}_Difficulty:_ **${level.difficulty.level.pretty}**\n` +
                `${discord.getEmoji("star")}_Stars:_ **${level.difficulty.stars}**\n` +
                `${discord.getEmoji("star")}_Downloads:_ **${level.stats.downloads}**\n` +
                `${discord.getEmoji("star")}_Likes:_ **${level.stats.likes}**\n` +
                `${discord.getEmoji("star")}_Length:_ **${level.stats.length.pretty}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${level.description}\n`

            )
            gdArray.push(gdEmbed)
        }
        embeds.createReactionEmbed(gdArray)
    }
}