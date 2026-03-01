 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Guild, Message, TextChannel} from "discord.js"
import config from "../config.json"
import {Embeds} from "./../structures/Embeds"
import {Functions} from "./../structures/Functions"
import {Kisaragi} from "./../structures/Kisaragi"
import {SQLQuery} from "./../structures/SQLQuery"

export default class GuildDelete {
    constructor(private readonly discord: Kisaragi) {}

    public run = async (guild: Guild) => {
        if (!guild.available) return
        const discord = this.discord
        const message = await this.discord.fetchFirstMessage(guild) as Message
        const star = discord.getEmoji("star")
        const embeds = new Embeds(discord, message)
        const sql = new SQLQuery(message)
        SQLQuery.deleteGuild(guild.id)

        const logGuild = async (guild: Guild) => {
            const guildOwner = await guild.fetchOwner()
            const guildChannel = discord.channels.cache.get(config.guildLog) as TextChannel
            const logEmbed = embeds.createEmbed()
            logEmbed
            .setAuthor({name: "guild leave", iconURL: "https://steamuserimages-a.akamaihd.net/ugc/956342034402318288/74A95F211FAF8ABF470C3F5716A1D6C1A90B0C9F/"})
            .setTitle(`**Left guild!** ${discord.getEmoji("cirNo")}`)
            .setThumbnail(guild.iconURL() ? guild.iconURL({extension: "png"})! : null)
            .setImage(guild.bannerURL() ? guild.bannerURL({extension: "png"})! : (guild.splashURL() ? guild.splashURL({extension: "png"})! : null))
            .setDescription(
                `${discord.getEmoji("star")}_Guild Name:_ **${guild.name}**\n` +
                `${discord.getEmoji("star")}_Guild Owner:_ **${guildOwner.user.username}**\n` +
                `${discord.getEmoji("star")}_Guild ID:_ \`${guild.id}\`\n` +
                `${discord.getEmoji("star")}_Creation Date:_ **${Functions.formatDate(guild.createdAt)}**\n` +
                `${discord.getEmoji("star")}_Members:_ **${guild.memberCount}**\n`
            )
            return this.discord.channelSend(guildChannel, logEmbed)
        }
        logGuild(guild)
    }
}
