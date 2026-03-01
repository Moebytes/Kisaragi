 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder, MessageReaction, User} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import ms from "pretty-ms"
import {Command} from "../../structures/Command"
import {Functions} from "../../structures/Functions"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "./../../structures/Permission"
import Spotify from "node-spotify-api"

export default class SpotifyCommand extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for spotify tracks and artists.",
            help:
            `
            \`spotify query\` - Searches for tracks with the query
            \`spotify artist query\` - Searches artists with the query
            `,
            examples:
            `
            \`=>spotify virtual riot\`
            \`=>spotify artist synthion\`
            `,
            aliases: [],
            random: "string",
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const query2Option = new SlashCommandOption()
            .setType("string")
            .setName("query2")
            .setDescription("Query for artist subcommand.")

        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("Can be a query/artist.")

        this.subcommand = new SlashCommandSubcommand()
            .setName("spotify")
            .setDescription(this.options.description)
            .addOption(queryOption)
            .addOption(query2Option)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)

        const spotify = new Spotify({
            id: process.env.SPOTIFY_CLIENT_ID,
            secret: process.env.SPOTIFY_CLIENT_SECRET
        })

        if (args[1] === "artist") {
            const query = Functions.combineArgs(args, 2)
            if (!query) {
                return this.noQuery(embeds.createEmbed()
                .setAuthor({name: "spotify", iconURL: "https://kisaragi.moe/assets/embed/spotify.png", url: "https://www.spotify.com/"})
                .setTitle(`**Spotify Artist** ${discord.getEmoji("aquaUp")}`))
            }
            const spotifyArray: EmbedBuilder[] = []
            const response = await spotify.search({type: "artist", query: query.trim()})
            const artists = response.artists.items
            for (let i = 0; i < artists.length; i++) {
                const artist = artists[i]
                const spotifyEmbed = embeds.createEmbed()
                spotifyEmbed
                .setAuthor({name: "spotify", iconURL: "https://kisaragi.moe/assets/embed/spotify.png", url: "https://www.spotify.com/"})
                .setTitle(`**Spotify Artist** ${discord.getEmoji("aquaUp")}`)
                .setURL(artist.external_urls.spotify)
                .setImage(artist.images[0]?.url)
                .setDescription(
                    `${discord.getEmoji("star")}_Artist:_ **${artist.name}**\n` +
                    `${discord.getEmoji("star")}_Genres:_ **${artist.genres.join(", ")}**\n` +
                    `${discord.getEmoji("star")}_Followers:_ **${artist.followers.total}**\n` +
                    `${discord.getEmoji("star")}_Popularity:_ **${artist.popularity}**\n`
                )
                spotifyArray.push(spotifyEmbed)
            }
            if (spotifyArray.length === 1) {
                return this.reply(spotifyArray[0])
            }
            return embeds.createReactionEmbed(spotifyArray, true, true)
        }

        const query = Functions.combineArgs(args, 1)
        if (!query) {
            return this.noQuery(embeds.createEmbed()
            .setAuthor({name: "spotify", iconURL: "https://kisaragi.moe/assets/embed/spotify.png", url: "https://www.spotify.com/"})
            .setTitle(`**Spotify Search** ${discord.getEmoji("aquaUp")}`))
        }
        const response = await spotify.search({type: "track", query: query.trim()})
        const spotifyArray: EmbedBuilder[] = []
        for (let i = 0; i < response.tracks.items.length; i++) {
            const track = response.tracks.items[i]
            const artists = track.artists.map((a: any) => a.name)
            const artistResponse = await spotify.search({type: "artist", query: artists[0]})
            const image = artistResponse.artists.items[0].images[0]?.url
            const spotifyEmbed = embeds.createEmbed()
            spotifyEmbed
            .setAuthor({name: "spotify", iconURL: "https://kisaragi.moe/assets/embed/spotify.png", url: "https://www.spotify.com/"})
            .setTitle(`**Spotify Search** ${discord.getEmoji("aquaUp")}`)
            .setImage(track.album.images[0]?.url)
            .setThumbnail(image)
            .setURL(track.external_urls.spotify)
            .setDescription(
                `${discord.getEmoji("star")}_Track:_ **${track.name}**\n` +
                `${discord.getEmoji("star")}_Artists:_ **${artists.join(", ")}**\n` +
                `${discord.getEmoji("star")}_Album:_ **${track.album.name}**\n` +
                `${discord.getEmoji("star")}_Tracks:_ **${track.album.total_tracks}**\n` +
                `${discord.getEmoji("star")}_Release Date:_ **${Functions.formatDate(track.album.release_date)}**\n` +
                `${discord.getEmoji("star")}_Duration:_ **${ms(track.duration_ms, {secondsDecimalDigits: 0})}**\n` +
                `${discord.getEmoji("star")}_Popularity:_ **${track.popularity}**\n`
            )
            spotifyArray.push(spotifyEmbed)
        }
        let msg = await embeds.createReactionEmbed(spotifyArray, true, true)
        await msg.react(discord.getEmoji("spotify"))
        const spotifyCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("spotify").id && user.bot === false
        const spotifyCollector = msg.createReactionCollector({filter: spotifyCheck})

        const urls = new Set()
        spotifyCollector.on("collect", async (reaction, user) => {
            await reaction.users.remove(user).catch(() => null)
            msg = await msg.fetch()
            if (urls.has(msg.embeds[0].url)) return
            if (!msg.embeds[0].url) return
            urls.add(msg.embeds[0].url)
            await this.send(msg.embeds[0].url)
        })
    }
}
