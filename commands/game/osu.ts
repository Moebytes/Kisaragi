import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import Osu, {OsuBeatmap} from "osu.ts"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class OsuCommand extends Command {
    private user = null as any
    private beatmap = null as any
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for osu beatmaps, players, and scores.",
            help:
            `
            \`osu query?\` - Searches for beatmaps
            \`osu url\` - Gets the beatmap from the url
            \`osu user name\` - Gets a user profile
            \`osu set name\` - Links your account with your osu name, used for the recent/best sub commands
            \`osu recent/rs name?\` - Gets a user's recent plays
            \`osu best/bt name?\` - Gets a user's best plays
            `,
            examples:
            `
            \`=>osu\`
            \`=>osu https://osu.ppy.sh/beatmapsets/556393#osu/1177545\`
            \`=>osu set name\` _then_ \`=>osu best\`
            `,
            aliases: [],
            random: "none",
            cooldown: 10,
            subcommandEnabled: true
        })
        const nameOption = new SlashCommandOption()
            .setType("string")
            .setName("name")
            .setDescription("Your osu name in user, set, recent, and best subcommands.")

        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("Can be a query, user, set, recent, or best.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName("osu")
            .setDescription(this.options.description)
            .addOption(queryOption)
            .addOption(nameOption)
    }

    public getAccuracy = (miss: string | number, $50: string | number, $100: string | number, $300: string | number) => {
        miss = Number(miss)
        $50 = Number($50)
        $100 = Number($100)
        $300 = Number($300)
        const num = (50*$50) + (100*$100) + (300*$300)
        const den =  (miss + $50 + $100 + $300) * 300
        const calc = (num / den * 1.0) * 100
        return `${calc.toFixed(2)}%`
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const osu = new Osu(process.env.OSU_API_KEY!)
        const sql = new SQLQuery(message)
        const perms = new Permission(discord, message)
        const osuEmbed = embeds.createEmbed()
        const dbName = await sql.fetchColumn("misc", "osu name", "user id", message.author.id)

        if (args[1]?.match(/osu.ppy.sh/)) {
            if (args[1].includes("osu.ppy.sh/users")) {
                this.user = args[1]
            } else if (args[1].includes("osu.ppy.sh/beatmapsets")) {
                this.beatmap = args[1]
            }
        }

        if (args[1] === "set") {
            const playerName = args[2]
            if (!playerName) {
                return this.noQuery(osuEmbed
                    .setAuthor({name: "osu", iconURL: "https://kisaragi.moe/assets/embed/osu.png"})
                    .setTitle(`**Osu Profile** ${discord.getEmoji("kannaSip")}`))
            }
            try {
                await SQLQuery.insertInto("misc", "user id", message.author.id)
            } finally {
                await sql.updateColumn("misc", "osu name", playerName, "user id", message.author.id)
                this.reply(`Successfully linked your account to **${playerName}**! ${discord.getEmoji("tohruThumbsUp")}`)
            }
            return
        }

        if (this.user || args[1] === "user") {
            const playerName = this.user || args[2]
            if (!playerName) {
                return this.noQuery(osuEmbed
                    .setAuthor({name: "osu", iconURL: "https://kisaragi.moe/assets/embed/osu.png"})
                    .setTitle(`**Osu Profile** ${discord.getEmoji("kannaSip")}`))
            }
            const player = await osu.users.get(playerName)
            const hours = Math.floor(Number(player.total_seconds_played) / 3600)
            const minutes = Math.floor((Number(player.total_seconds_played) % (3600*hours)) / 60)
            const seconds = ((Number(player.total_seconds_played) % (3600*hours)) % (60*minutes))
            osuEmbed
            .setAuthor({name: "osu", iconURL: "https://kisaragi.moe/assets/embed/osu.png"})
            .setTitle(`**Osu Profile** ${discord.getEmoji("kannaSip")}`)
            .setURL(`https://osu.ppy.sh/users/${player.user_id}`)
            .setDescription(
            `${discord.getEmoji("star")}_Player:_ **${player.username}**\n` +
            `${discord.getEmoji("star")}_Join Date:_ **${Functions.formatDate(new Date(player.join_date))}**\n` +
            `${discord.getEmoji("star")}_Play Time:_ **${hours}h ${minutes}m ${seconds}s**\n` +
            `${discord.getEmoji("star")}_Play count:_ **${player.playcount}**\n` +
            `${discord.getEmoji("star")}${discord.getEmoji("SSHrank")} **${player.count_rank_ssh}** ${discord.getEmoji("SSrank")}` +
            `**${player.count_rank_ss}** ${discord.getEmoji("SHrank")} **${player.count_rank_sh}** ${discord.getEmoji("Srank")} **${player.count_rank_s}**` +
            `${discord.getEmoji("Arank")} **${player.count_rank_a}**\n` +
            `${discord.getEmoji("star")}${discord.getEmoji("300hit")} **${player.count300}** ${discord.getEmoji("100hit")} **${player.count100}**` +
            `${discord.getEmoji("50hit")} **${player.count50}**\n` +
            `${discord.getEmoji("star")}_Level:_ **${player.level.slice(0, 5)}**\n` +
            `${discord.getEmoji("star")}_Rank:_ **#${player.pp_rank} (:flag_${player.country.toLowerCase()}: #${player.pp_country_rank})**\n` +
            `${discord.getEmoji("star")}_Score:_ **${player.ranked_score} (${player.total_score})**\n` +
            `${discord.getEmoji("star")}_PP:_ **${player.pp_raw}**\n` +
            `${discord.getEmoji("star")}_Accuracy:_ **${player.accuracy.slice(0, 5) + "%"}**\n`
            )
            .setImage(await osu.users.banner(playerName))
            .setThumbnail(`https://a.ppy.sh/${player.user_id}`)
            return this.reply(osuEmbed)
        }

        if (args[1] === "recent" || args[1] === "rs") {
            let playername = args[2]
            if (!playername && dbName) playername = String(dbName)
            if (!playername) {
                return this.noQuery(osuEmbed
                    .setAuthor({name: "osu", iconURL: "https://kisaragi.moe/assets/embed/osu.png"})
                    .setTitle(`**Osu Recent** ${discord.getEmoji("kannaSip")}`), "You can also set your name with **osu set (name)**.")
            }
            const recent = await osu.scores.recent(playername)
            const osuArray: EmbedBuilder[] = []
            for (let i = 0; i < recent.length; i++) {
                const beatmap = await osu.beatmaps.get({b: recent[i].beatmap_id})
                const osuEmbed = embeds.createEmbed()
                const accuracy = this.getAccuracy(recent[i].countmiss, recent[i].count50, recent[i].count100, recent[i].count300)
                osuEmbed
                .setAuthor({name: "osu", iconURL: "https://kisaragi.moe/assets/embed/osu.png"})
                .setTitle(`**${playername}'s Recent Plays** ${discord.getEmoji("kannaSip")}`)
                .setThumbnail(`https://b.ppy.sh/thumb/${beatmap[0].beatmapset_id}l.jpg`)
                .setImage(`https://assets.ppy.sh/beatmaps/${beatmap[0].beatmapset_id}/covers/cover.jpg`)
                .setURL(`https://osu.ppy.sh/beatmapsets/${beatmap[0].beatmapset_id}#osu/${beatmap[0].beatmap_id}`)
                .setDescription(
                    `${discord.getEmoji("star")}_Beatmap:_**${beatmap[0].title}**\n` +
                    `${discord.getEmoji("star")}_Rank:_**${recent[i].rank}**\n` +
                    `${discord.getEmoji("star")}_Accuracy:_**${accuracy}**\n` +
                    `${discord.getEmoji("star")}_Max Combo:_**${recent[i].maxcombo}**\n` +
                    `${discord.getEmoji("star")}_Perfect Combo:_**${recent[i].perfect === "1" ? "Yes" : "No"}**\n` +
                    `${discord.getEmoji("star")}_Date:_**${Functions.formatDate(new Date(recent[i].date))}**\n` +
                    `${discord.getEmoji("star")}${discord.getEmoji("300hit")} **${recent[i].count300}** ${discord.getEmoji("100hit")} **${recent[i].count100}** ${discord.getEmoji("50hit")} **${recent[i].count50}**\n` +
                    `${discord.getEmoji("star")}_Misses:_ **${recent[i].countmiss}**`
                )
                osuArray.push(osuEmbed)
            }

            if (!osuArray[0]) {
                const osuEmbed = embeds.createEmbed()
                osuEmbed
                .setAuthor({name: "osu", iconURL: "https://kisaragi.moe/assets/embed/osu.png"})
                .setTitle(`**${playername}'s Recent Plays** ${discord.getEmoji("kannaSip")}`)
                .setDescription(`There are no recent plays available!`)
                return this.reply(osuEmbed)
            }
            if (osuArray.length === 1) {
                return this.reply(osuArray[0])
            } else {
                return embeds.createReactionEmbed(osuArray, false, true)
            }
        }

        if (args[1] === "best" || args[1] === "bt") {
            let playername = args[2]
            if (!playername && dbName) playername = String(dbName)
            if (!playername) {
                return this.noQuery(osuEmbed
                    .setAuthor({name: "osu", iconURL: "https://kisaragi.moe/assets/embed/osu.png"})
                    .setTitle(`**Osu Best** ${discord.getEmoji("kannaSip")}`), "You can also set your name with **osu set (name)**.")
            }
            const best = await osu.scores.best(playername)
            const osuArray: EmbedBuilder[] = []
            for (let i = 0; i < best.length; i++) {
                const beatmap = await osu.beatmaps.get({b: best[i].beatmap_id})
                const accuracy = this.getAccuracy(best[i].countmiss, best[i].count50, best[i].count100, best[i].count300)
                const osuEmbed = embeds.createEmbed()
                osuEmbed
                .setAuthor({name: "osu", iconURL: "https://kisaragi.moe/assets/embed/osu.png"})
                .setTitle(`**${playername}'s Best Plays** ${discord.getEmoji("kannaSip")}`)
                .setThumbnail(`https://b.ppy.sh/thumb/${beatmap[0].beatmapset_id}l.jpg`)
                .setImage(`https://assets.ppy.sh/beatmaps/${beatmap[0].beatmapset_id}/covers/cover.jpg`)
                .setURL(`https://osu.ppy.sh/beatmapsets/${beatmap[0].beatmapset_id}#osu/${beatmap[0].beatmap_id}`)
                .setDescription(
                    `${discord.getEmoji("star")}_Beatmap:_**${beatmap[0].title}**\n` +
                    `${discord.getEmoji("star")}_PP:_**${best[i].pp}**\n` +
                    `${discord.getEmoji("star")}_Rank:_**${best[i].rank}**\n` +
                    `${discord.getEmoji("star")}_Accuracy:_**${accuracy}**\n` +
                    `${discord.getEmoji("star")}_Max Combo:_**${best[i].maxcombo}**\n` +
                    `${discord.getEmoji("star")}_Perfect Combo:_**${best[i].perfect === "1" ? "Yes" : "No"}**\n` +
                    `${discord.getEmoji("star")}_Date:_**${Functions.formatDate(new Date(best[i].date))}**\n` +
                    `${discord.getEmoji("star")}${discord.getEmoji("300hit")} **${best[i].count300}** ${discord.getEmoji("100hit")} **${best[i].count100}** ${discord.getEmoji("50hit")} **${best[i].count50}**\n` +
                    `${discord.getEmoji("star")}_Misses:_ **${best[i].countmiss}**`
                )
                osuArray.push(osuEmbed)
            }
            if (!osuArray[0]) {
                const osuEmbed = embeds.createEmbed()
                osuEmbed
                .setAuthor({name: "osu", iconURL: "https://kisaragi.moe/assets/embed/osu.png"})
                .setTitle(`**${playername}'s Best Plays** ${discord.getEmoji("kannaSip")}`)
                .setDescription(`There are no best plays available!`)
                return this.reply(osuEmbed)
            }
            if (osuArray.length === 1) {
                return this.reply(osuArray[0])
            } else {
                return embeds.createReactionEmbed(osuArray, false, true)
            }
        }

        const query = this.beatmap || Functions.combineArgs(args, 1)
        if (this.beatmap) {
            const beatmaps = await osu.beatmaps.get(query)
            const osuArray: EmbedBuilder[] = []
            for (let i = 0; i < beatmaps.length; i++) {
                const minutes = Math.floor((Number(beatmaps[i].total_length) / 60))
                const seconds = ((Number(beatmaps[i].total_length)) % (60*minutes))
                const osuEmbed = embeds.createEmbed()
                osuEmbed
                .setAuthor({name: "osu", iconURL: "https://kisaragi.moe/assets/embed/osu.png"})
                .setTitle(`**Osu Beatmap** ${discord.getEmoji("kannaSip")}`)
                .setURL(`https://osu.ppy.sh/beatmapsets/${beatmaps[i].beatmapset_id}#osu/${beatmaps[i].beatmap_id}`)
                .setImage(`https://assets.ppy.sh/beatmaps/${beatmaps[i].beatmapset_id}/covers/cover.jpg`)
                .setThumbnail(`http://s.ppy.sh/a/${beatmaps[i].creator_id}`)
                .setDescription(
                    `${discord.getEmoji("star")}_Beatmap:_ **${beatmaps[i].title}**\n` +
                    `${discord.getEmoji("star")}_Artist:_ **${beatmaps[i].artist}**\n` +
                    `${discord.getEmoji("star")}_Creator:_ **${beatmaps[i].creator}**\n` +
                    `${discord.getEmoji("star")}_Difficulty:_ **${beatmaps[i].version}**\n` +
                    `${discord.getEmoji("star")}_BPM:_ **${beatmaps[i].bpm}**\n` +
                    `${discord.getEmoji("star")}_Length:_ **${minutes}m ${seconds}s**\n` +
                    `${discord.getEmoji("star")}_Stars:_ **${beatmaps[i].difficultyrating}**\n` +
                    `${discord.getEmoji("star")}_CS:_ **${beatmaps[i].diff_size}** _OD:_ **${beatmaps[i].diff_overall}** _AR:_ **${beatmaps[i].diff_approach}** _HP:_ **${beatmaps[i].diff_drain}**\n` +
                    `${discord.getEmoji("star")}_Playcount:_ **${beatmaps[i].playcount}**\n` +
                    `${discord.getEmoji("star")}_Passcount:_ **${beatmaps[i].passcount}**\n` +
                    `${discord.getEmoji("star")}_Rating:_ **${beatmaps[i].rating}**\n` +
                    `${discord.getEmoji("star")}_Tags:_ ${beatmaps[i].tags}\n`
                )
                osuArray.push(osuEmbed)
            }
            if (osuArray.length === 1) {
                return this.reply(osuArray)
            } else {
                return embeds.createReactionEmbed(osuArray, false, true)
            }
        } else {
            const beatmaps = await osu.beatmaps.search(query)
            const osuArray: EmbedBuilder[] = []
            for (let i = 0; i < beatmaps.length; i++) {
                const minutes = Math.floor((Number(beatmaps[i].beatmaps[0].total_length) / 60))
                const seconds = ((Number(beatmaps[i].beatmaps[0].total_length)) % (60*minutes))
                const osuEmbed = embeds.createEmbed()
                osuEmbed
                .setAuthor({name: "osu", iconURL: "https://kisaragi.moe/assets/embed/osu.png"})
                .setTitle(`**Osu Beatmap** ${discord.getEmoji("kannaSip")}`)
                .setURL(`https://osu.ppy.sh/beatmapsets/${beatmaps[i].id}#osu/${beatmaps[i].beatmaps[0].id}`)
                .setImage(`https://assets.ppy.sh/beatmaps/${beatmaps[i].id}/covers/cover.jpg`)
                .setThumbnail(`http://s.ppy.sh/a/${beatmaps[i].user_id}`)
                .setDescription(
                    `${discord.getEmoji("star")}_Beatmap:_ **${beatmaps[i].title}**\n` +
                    `${discord.getEmoji("star")}_Artist:_ **${beatmaps[i].artist}**\n` +
                    `${discord.getEmoji("star")}_Creator:_ **${beatmaps[i].creator}**\n` +
                    `${discord.getEmoji("star")}_Difficulty:_ **${beatmaps[i].beatmaps[0].version}**\n` +
                    `${discord.getEmoji("star")}_BPM:_ **${beatmaps[i].bpm}**\n` +
                    `${discord.getEmoji("star")}_Length:_ **${minutes}m ${seconds}s**\n` +
                    `${discord.getEmoji("star")}_Stars:_ **${beatmaps[i].beatmaps[0].difficulty_rating}**\n` +
                    `${discord.getEmoji("star")}_CS:_ **${beatmaps[i].beatmaps[0].cs}** _OD:_ **${beatmaps[i].beatmaps[0].hit_length}** _AR:_ **${beatmaps[i].beatmaps[0].ar}** _HP:_ **${beatmaps[i].beatmaps[0].drain}**\n` +
                    `${discord.getEmoji("star")}_Playcount:_ **${beatmaps[i].beatmaps[0].playcount}**\n` +
                    `${discord.getEmoji("star")}_Passcount:_ **${beatmaps[i].beatmaps[0].passcount}**\n` +
                    `${discord.getEmoji("star")}_Tags:_ ${beatmaps[i].tags}\n`
                )
                osuArray.push(osuEmbed)
            }
            if (osuArray.length === 1) {
                return this.reply(osuArray)
            } else {
                return embeds.createReactionEmbed(osuArray, false, true)
            }
        }

    }
}
