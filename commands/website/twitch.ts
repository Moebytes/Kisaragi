import type {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {AppTokenAuthProvider} from "@twurple/auth"
import {ApiClient} from "@twurple/api"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Twitch extends Command {
    private channel = null as any
    private search = null as any
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for twitch streams and channels.",
            help:
            `
            \`twitch query\` - Searches for streams with the query
            \`twitch channel query\` - Searches for a channel
            \`twitch url\` - Gets the resource from the url
            `,
            examples:
            `
            \`=>twitch osu\`
            \`=>twitch channel name\`
            `,
            aliases: ["tw"],
            random: "string",
            cooldown: 10,
            defer: true,
            unlist: true,
            subcommandEnabled: false
        })
        const query2Option = new SlashCommandOption()
            .setType("string")
            .setName("query2")
            .setDescription("Query for channel subcommand.")

        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("Can be a query/channel.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(queryOption)
            .addOption(query2Option)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const authProvider = new AppTokenAuthProvider(process.env.TWITCH_CLIENT_ID!, process.env.TWITCH_CLIENT_SECRET!)
        const twitch = new ApiClient({authProvider})

        if (args[1]?.match(/twitch.tv/)) {
            const matches = args[1].replace("https://www.twitch.tv", "").match(/(?<=\/)(.*?)(?=$|\/)/g)
            this.channel = matches?.[0]
            if (this.channel.includes("search")) {
                this.search = matches?.[0].replace("search?term=", "")
                this.channel = null
            }
        }

        if (this.channel || args[1] === "channel") {
            const term = this.channel || args[2]
            if (!term) {
                return this.noQuery(embeds.createEmbed()
                .setAuthor({name: "twitch", iconURL: "https://kisaragi.moe/assets/embed/twitch.png", url: "https://www.twitch.tv/"})
                .setTitle(`**Twitch Channel** ${discord.getEmoji("gabSip")}`))
            }
            
            const result = await twitch.search.searchChannels(term, {limit: 1})
            const channel = result.data?.[0]
            if (!channel) {
                return this.invalidQuery(embeds.createEmbed()
                .setAuthor({name: "twitch", iconURL: "https://kisaragi.moe/assets/embed/twitch.png", url: "https://www.twitch.tv/"})
                .setTitle(`**Twitch Channel** ${discord.getEmoji("gabSip")}`))
            }
            const user = await channel.getUser()
            const followers = await user.getChannelFollowers()
            const stream = await user.getStream()

            const twitchEmbed = embeds.createEmbed()
            twitchEmbed
            .setAuthor({name: "twitch", iconURL: "https://kisaragi.moe/assets/embed/twitch.png", url: "https://www.twitch.tv/"})
            .setTitle(`**Twitch Channel** ${discord.getEmoji("gabSip")}`)
            .setURL(`https://www.twitch.tv/${channel.name}`)
            .setThumbnail(user.profilePictureUrl)
            .setImage(channel.thumbnailUrl)
            .setDescription(
                `${discord.getEmoji("star")}_Name:_ **${channel.name}**\n` +
                `${discord.getEmoji("star")}_Creation Date:_ **${Functions.formatDate(new Date(user.creationDate.getTime()))}**\n` +
                `${discord.getEmoji("star")}_Followers:_ **${followers.total}**\n` +
                `${discord.getEmoji("star")}_Title:_ **${stream?.title || "None"}**\n` +
                `${discord.getEmoji("star")}_Game:_ **${channel.gameName}**\n` +
                `${discord.getEmoji("star")}_Viewers:_ **${stream?.viewers || 0}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${user.description}\n`
            )
            return this.reply(twitchEmbed)
        }

        const term = this.search || Functions.combineArgs(args, 1)
        if (!term) {
            return this.noQuery(embeds.createEmbed()
            .setAuthor({name: "twitch", iconURL: "https://kisaragi.moe/assets/embed/twitch.png", url: "https://www.twitch.tv/"})
            .setTitle(`**Twitch Stream** ${discord.getEmoji("gabSip")}`))
        }
        const result = await twitch.streams.getStreams({game: term.trim(), limit: 10})
        const streams = result.data
        const twitchArray: EmbedBuilder[] = []
        for (let i = 0; i < streams.length; i++) {
            const stream = streams[i]
            const channel = await stream.getUser()
            const twitchEmbed = embeds.createEmbed()
            twitchEmbed
            .setAuthor({name: "twitch", iconURL: "https://kisaragi.moe/assets/embed/twitch.png", url: "https://www.twitch.tv/"})
            .setTitle(`**Twitch Stream** ${discord.getEmoji("gabSip")}`)
            .setURL(result[i].channel.url)
            .setImage(result[i].getPreviewUrl("large"))
            .setThumbnail(result[i].channel.logo)
            .setDescription(
                `${discord.getEmoji("star")}_Title:_ **${stream.title}**\n` +
                `${discord.getEmoji("star")}_Channel:_ **${stream.userName}**\n` +
                `${discord.getEmoji("star")}_Game:_ **${stream.gameName}**\n` +
                `${discord.getEmoji("star")}_Viewers:_ **${stream.viewers}**\n` +
                `${discord.getEmoji("star")}_Start Date:_ **${Functions.formatDate(new Date(stream.startDate.getTime()))}**\n` +
                `${discord.getEmoji("star")}_FPS:_ **${Math.floor(result[i].averageFPS)}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${channel.description}\n`
            )
            twitchArray.push(twitchEmbed)
        }
        return embeds.createReactionEmbed(twitchArray, true, true)
    }
}
