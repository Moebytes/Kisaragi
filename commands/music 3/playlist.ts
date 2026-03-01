/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Audio} from "./../../structures/Audio"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"
import {Permission} from "../../structures/Permission"

export default class Playlists extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Plays or manages your playlists.",
            help:
            `
            \`playlist\` - Opens the playlist prompt.
            \`playlist num/name\` - Starts playing this playlist.
            `,
            examples:
            `
            \`=>playlist\`
            \`=>playlist kawaii future bass\`
            `,
            aliases: ["playlists"],
            guildOnly: true,
            cachedGuildOnly: true,
            cooldown: 10,
            unlist: true
        })
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const audio = new Audio(discord, message)
        const sql = new SQLQuery(message)
        const perms = new Permission(discord, message)
        let playlists = [{name: null, songs: [], length: 0}]
        const exists = await sql.fetchColumn("misc", "playlists", "user id", message.author.id)
        if (!exists) {
            try {
                await SQLQuery.insertInto("misc", "user id", message.author.id)
            } finally {
                await sql.updateColumn("misc", "playlists", playlists, "user id", message.author.id)
            }
        } else {
            playlists = exists
        }
        const step = 3.0
        const increment = Math.ceil((playlists ? playlists.length : 1) / step)
        const playlistArray: EmbedBuilder[] = []
        for (let i = 0; i < increment; i++) {
            let playDesc = ""
            for (let j = 0; j < step; j++) {
                const k = (i*step)+j
                const p = JSON.parse(JSON.stringify(playlists[k]))
                playDesc += `**${i + 1} =>**\n` +
                `${discord.getEmoji("star")}_Playlist:_ **${p.name ?? "Empty"}**\n` +
                `${discord.getEmoji("star")}_Tracks:_ **${p.songs.length}**\n` +
                `${discord.getEmoji("star")}_Length:_ **${p.length}**\n`
            }
            const playlistEmbed = embeds.createEmbed()
            playlistEmbed
            .setAuthor({name: "playlist", iconURL: "https://kisaragi.moe/assets/embed/playlist.png"})
            .setTitle(`**Playlists** ${discord.getEmoji("karenSugoi")}`)
            .setThumbnail(message.author.displayAvatarURL({extension: "png"}))
            .setDescription(Functions.multiTrim(`
                __Playlists__
                ${playDesc}
            `))
            playlistArray.push(playlistEmbed)
        }
        const msg = await this.reply(playlistArray[0])
        const reactions = ["right", "left", "1n", "2n", "3n", "random", "edit", "add"]
        return
    }
}
