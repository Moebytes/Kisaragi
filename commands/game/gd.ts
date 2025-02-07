import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

const GDClient = require("geometry-dash-api")
const gd = require("gdprofiles")
const base64 = require("base-64")

export default class GeometryDash extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for geometry dash players and levels.",
            help:
            `
            \`gd query\` - Searches for levels with the query
            \`gd user name\` - Gets the profile of a user
            \`gd daily\` - Gets the daily level
            \`gd weekly\` - Gets the weekly demon
            \`gd top 100/friends/global/creators\` - Fetches the specified leaderboard
            `,
            examples:
            `
            \`=>gd anime\`
            \`=>gd user tenpi\`
            \`=>gd top creators\`
            `,
            aliases: [],
            random: "string",
            cooldown: 10,
            unlist: true,
            subcommandEnabled: false
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
        if (discord.checkMuted(message)) if (!perms.checkNSFW()) return

        const GD = new GDClient({
            userName: process.env.GD_NAME,
            password: process.env.GD_PASSWORD
        })

        const {api} = GD
        await GD.login()

        if (args[1] === "user") {
            let nick = Functions.combineArgs(args, 2)
            if (nick.match(/gdprofiles.com/)) {
                nick = nick.replace("https://gdprofiles.com/", "")
            }
            const user = await api.users.getByNick(nick)
            const gdUser = await gd.search(nick)
            const image =  gdUser.video?.embed ? `https://img.youtube.com/vi/${gdUser.video?.embed?.replace(/www.youtube.com\/embed\//g, "")}/maxresdefault.jpg` : `http://card.gdprofiles.com/${user.nick}_hd.png`
            const levelArray: EmbedBuilder[] = []
            for (const i in gdUser.lastLevels) {
                levelArray.push(gdUser.lastLevels[i].name)
            }
            const gdEmbed = embeds.createEmbed()
            gdEmbed
            .setAuthor({name: "geometry dash", iconURL: "https://gdicon.net/favicons/android-icon-192x192.png"})
            .setTitle(`**GD Profile** ${discord.getEmoji("raphi")}`)
            .setURL(`https://gdprofiles.com/${user.nick}`)
            .setDescription(
                `${discord.getEmoji("star")}${discord.getEmoji("gdStar")} **${user.stars}** ` +
                `${discord.getEmoji("gdDiamond")} **${user.diamonds}** ` +
                `${discord.getEmoji("gdCoin")} **${user.coins}** ` +
                `${discord.getEmoji("gdUserCoin")} **${user.userCoins}** ` +
                `${discord.getEmoji("gdDemon")} **${user.demons}** ` +
                `${discord.getEmoji("gdCP")} **${user.creatorPoints}** \n` +
                `${discord.getEmoji("star")}_Name:_ **${user.nick}**\n` +
                `${discord.getEmoji("star")}_Rank:_ **#${user.top}**\n` +
                `${discord.getEmoji("star")}_User ID:_ **${user.userID}**\n` +
                `${discord.getEmoji("star")}_Account ID:_ **${user.accountID}**\n` +
                `${discord.getEmoji("star")}_Account Type:_ **${user.rightsString}**\n` +
                `${discord.getEmoji("star")}_Youtube:_ **${user.youtube}**\n` +
                `${discord.getEmoji("star")}_Twitter:_ **${user.twitter}**\n` +
                `${discord.getEmoji("star")}_Twitch:_ **${user.twitch}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${gdUser.desc ? gdUser.desc : "None"}\n` +
                `${discord.getEmoji("star")}_Levels:_ ${levelArray.join("") ? levelArray.join(",     ") : "None"}\n`
            )
            .setImage(image)
            .setThumbnail(gdUser.img.player)
            return this.reply(gdEmbed)
        }

        if (args[1] === "daily") {
            const level = await api.levels.getDaily()
            const user = await api.users.getById(level.creatorUserID)
            const gdEmbed = embeds.createEmbed()
            gdEmbed
            .setAuthor({name: "geometry dash", iconURL: "https://gdicon.net/favicons/android-icon-192x192.png"})
            .setTitle(`**GD Level** ${discord.getEmoji("raphi")}`)
            .setDescription(
                `${discord.getEmoji("star")}_Name:_ **${level.name}**\n` +
                `${discord.getEmoji("star")}_Creator:_ **${user ? user.nick : "Not Found"}**\n` +
                `${discord.getEmoji("star")}_Level ID:_ **${level.levelID}**\n` +
                `${discord.getEmoji("star")}_Song ID:_ **${level.songID}**\n` +
                `${discord.getEmoji("star")}_Difficulty:_ **${level.diff}**\n` +
                `${discord.getEmoji("star")}_Stars:_ **${level.stars}**\n` +
                `${discord.getEmoji("star")}_Downloads:_ **${level.downloads}**\n` +
                `${discord.getEmoji("star")}_Likes:_ **${level.likes}**\n` +
                `${discord.getEmoji("star")}_Password:_ **${level.password ? level.password : "None"}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${base64.decode(level.desc)}\n`
            )
            return this.reply(gdEmbed)
        }

        if (args[1] === "weekly") {
            const level = await api.levels.getWeekly()
            const user = await api.users.getById(level.creatorUserID)
            const gdEmbed = embeds.createEmbed()
            gdEmbed
            .setAuthor({name: "geometry dash", iconURL: "https://gdicon.net/favicons/android-icon-192x192.png"})
            .setTitle(`**GD Level** ${discord.getEmoji("raphi")}`)
            .setDescription(
                `${discord.getEmoji("star")}_Name:_ **${level.name}**\n` +
                `${discord.getEmoji("star")}_Creator:_ **${user ? user.nick : "Not Found"}**\n` +
                `${discord.getEmoji("star")}_Level ID:_ **${level.levelID}**\n` +
                `${discord.getEmoji("star")}_Song ID:_ **${level.songID}**\n` +
                `${discord.getEmoji("star")}_Difficulty:_ **${level.diff}**\n` +
                `${discord.getEmoji("star")}_Stars:_ **${level.stars}**\n` +
                `${discord.getEmoji("star")}_Downloads:_ **${level.downloads}**\n` +
                `${discord.getEmoji("star")}_Likes:_ **${level.likes}**\n` +
                `${discord.getEmoji("star")}_Password:_ **${level.password ? level.password : "None"}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${base64.decode(level.desc)}\n`
            )
            return this.reply(gdEmbed)
        }

        if (args[1] === "top") {
            const topArray: EmbedBuilder[] = []
            let users
            if (args[2] === "100") {
                users = await api.tops.get({type: "top", count: 100})
            } else if (args[2] === "friends") {
                users = await api.tops.get({type: "friends", count: 100})
            } else if (args[2] === "global") {
                users = await api.tops.get({type: "relative", count: 100})
            } else if (args[2] === "creators") {
                users = await api.tops.get({type: "creators", count: 100})
            } else {
                return message.reply("You need to specify either 100, friends, global, or creators.")
            }
            for (let i = 0; i < users.length; i++) {
                const topEmbed = embeds.createEmbed()
                topEmbed
                .setAuthor({name: "geometry dash", iconURL: "https://gdicon.net/favicons/android-icon-192x192.png"})
                .setTitle(`**GD Leaderboard** ${discord.getEmoji("raphi")}`)
                .setDescription(
                    `${discord.getEmoji("star")}_Rank:_ **${users[i].top}**\n` +
                    `${discord.getEmoji("star")}_User:_ **${users[i].nick}**\n` +
                    `${discord.getEmoji("star")}_User ID:_ **${users[i].userID}**\n` +
                    `${discord.getEmoji("star")}_Account ID:_ **${users[i].accountID}**\n`
                )
                topArray.push(topEmbed)
            }
            embeds.createReactionEmbed(topArray)
            return
        }

        const query = Functions.combineArgs(args, 1)

        if (query.match(/\d+/g)) {
            const level = await api.levels.getById({levelID: query.trim()})
            const user = await api.users.getById(level.creatorUserID)
            const gdEmbed = embeds.createEmbed()
            gdEmbed
            .setAuthor({name: "geometry dash", iconURL: "https://gdicon.net/favicons/android-icon-192x192.png"})
            .setTitle(`**GD Level** ${discord.getEmoji("raphi")}`)
            .setDescription(
                `${discord.getEmoji("star")}_Name:_ **${level.name}**\n` +
                `${discord.getEmoji("star")}_Creator:_ **${user ? user.nick : "Not Found"}**\n` +
                `${discord.getEmoji("star")}_Level ID:_ **${level.levelID}**\n` +
                `${discord.getEmoji("star")}_Song ID:_ **${level.songID}**\n` +
                `${discord.getEmoji("star")}_Difficulty:_ **${level.diff}**\n` +
                `${discord.getEmoji("star")}_Stars:_ **${level.stars}**\n` +
                `${discord.getEmoji("star")}_Downloads:_ **${level.downloads}**\n` +
                `${discord.getEmoji("star")}_Likes:_ **${level.likes}**\n` +
                `${discord.getEmoji("star")}_Password:_ **${level.password ? level.password : "None"}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${base64.decode(level.desc)}\n`

            )
            return this.reply(gdEmbed)
        }

        const result = await api.levels.find({query: query.trim()})
        const gdArray: EmbedBuilder[] = []
        for (let i = 0; i < result.levels.length; i++) {
            const level = await api.levels.getById({levelID: result.levels[i].levelID})
            const user = await api.users.getById(result.levels[i].creatorUserID)
            const gdEmbed = embeds.createEmbed()
            gdEmbed
            .setAuthor({name: "geometry dash", iconURL: "https://gdicon.net/favicons/android-icon-192x192.png"})
            .setTitle(`**GD Level** ${discord.getEmoji("raphi")}`)
            .setDescription(
                `${discord.getEmoji("star")}_Name:_ **${level.name}**\n` +
                `${discord.getEmoji("star")}_Creator:_ **${user ? user.nick : "Not Found"}**\n` +
                `${discord.getEmoji("star")}_Level ID:_ **${level.levelID}**\n` +
                `${discord.getEmoji("star")}_Song ID:_ **${level.songID}**\n` +
                `${discord.getEmoji("star")}_Difficulty:_ **${level.diff}**\n` +
                `${discord.getEmoji("star")}_Stars:_ **${level.stars}**\n` +
                `${discord.getEmoji("star")}_Downloads:_ **${level.downloads}**\n` +
                `${discord.getEmoji("star")}_Likes:_ **${level.likes}**\n` +
                `${discord.getEmoji("star")}_Password:_ **${level.password ? level.password : "None"}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${base64.decode(level.desc)}\n`

            )
            gdArray.push(gdEmbed)
        }
        embeds.createReactionEmbed(gdArray)
    }
}