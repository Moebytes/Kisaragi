import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"
import {SQLQuery} from "../../structures/SQLQuery"

export default class Points extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Configures settings for xp gaining.",
            help:
            `
            _Note: Points cannot be recovered after they are deleted._
            \`points\` - Opens the points prompt
            \`points enable/disable? [point, range]? {threshold}? <timeout>?\` - Sets the specified settings.
            \`points destroy\` - Deletes the scores of every member in the guild
            \`points reset\` - Resets all point settings, excluding scores
            `,
            examples:
            `
            \`=>points\`
            \`=>points enable [10, 20] {1000} <60>\`
            \`=>points destroy\`
            `,
            aliases: ["point", "pointsettings"],
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const timeoutOption = new SlashCommandOption()
            .setType("string")
            .setName("timeout")
            .setDescription("Can be the <timeout>.")

        const thresholdOption = new SlashCommandOption()
            .setType("string")
            .setName("threshold")
            .setDescription("Can be the {threshold}.")

        const rangeOption = new SlashCommandOption()
            .setType("string")
            .setName("range")
            .setDescription("Can be the [point, range].")

        const enableOption = new SlashCommandOption()
            .setType("string")
            .setName("enable")
            .setDescription("Can be enable/disable/destroy/reset.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(enableOption)
            .addOption(rangeOption)
            .addOption(thresholdOption)
            .addOption(timeoutOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const sql = new SQLQuery(message)
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        if (!await perms.checkMod()) return
        if (!message.channel.isSendable()) return
        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            await levelPrompt(message)
            return
        }

        const pointToggle = await sql.fetchColumn("guilds", "point toggle")
        const pointRange = await sql.fetchColumn("guilds", "point range")
        const pointThreshold = await sql.fetchColumn("guilds", "point threshold")
        const pointTimeout = await sql.fetchColumn("guilds", "point timeout")
        const levelMsg = await sql.fetchColumn("guilds", "level message")
        const levelEmbed = embeds.createEmbed()
        levelEmbed
        .setTitle(`**Point Settings** ${discord.getEmoji("mexShrug")}`)
        .setThumbnail(message.guild!.iconURL({extension: "png"}) as string)
        .setDescription(Functions.multiTrim(`
            Configure general point settings. To set level up roles, use **levelroles** instead. To disable points on
            individual channels, use **levelchannels** instead.
            newline
            __Text Replacements:__
            **user** - user mention
            **tag** - user tag
            **name** - username
            **newlevel** - new level
            **totalpoints** - total points
            newline
            **Point Toggle** - Whether the point system is enabled or disabled.
            **Point Range** - The range of points to award per message.
            **Point Threshold** - The amount of points required to level up.
            **Point Timeout** - How often points are awarded (in seconds).
            newline
            __Current Settings:__
            ${discord.getEmoji("star")}_Point Toggle:_ **${pointToggle}**
            ${discord.getEmoji("star")}_Point Range:_ **${pointRange.toString().replace(",", " -> ")}**
            ${discord.getEmoji("star")}_Point Threshold:_ **${pointThreshold}**
            ${discord.getEmoji("star")}_Point Timeout:_ **${Math.floor(parseInt(pointTimeout, 10)/1000)}**
            ${discord.getEmoji("star")}_Level Message:_ **${levelMsg}**
            newline
            __Edit Settings:__
            ${discord.getEmoji("star")}_**Type any message** to set the level message._
            ${discord.getEmoji("star")}_Type **enable** or **disable** to enable or disable the point system._
            ${discord.getEmoji("star")}_Use brackets **[10, 20]** to set the point range._
            ${discord.getEmoji("star")}_Use braces **{1000}** to set the point threshold._
            ${discord.getEmoji("star")}_Use angle brackets **<60>** to set the point timeout._
            ${discord.getEmoji("star")}_**You can type multiple options** to enable all at once._
            ${discord.getEmoji("star")}_Type **destroy** to delete all the points of every member (no undo)._
            ${discord.getEmoji("star")}_Type **reset** to reset all settings, excluding member points._
            ${discord.getEmoji("star")}_Type **cancel** to exit._
        `))
        this.reply(levelEmbed)

        async function levelPrompt(msg: Message) {
            const responseEmbed = embeds.createEmbed()
            responseEmbed.setTitle(`**Point Settings** ${discord.getEmoji("mexShrug")}`)
            let [setOn, setOff, setRange, setThreshold, setTimeout, setMsg] = [false, false, false, false, false, false]
            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                discord.send(msg, responseEmbed)
                return
            }
            if (msg.content.toLowerCase() === "reset") {
                await sql.updateColumn("guilds", "point range", [10, 20])
                await sql.updateColumn("guilds", "point threshold", 1000)
                await sql.updateColumn("guilds", "point timeout", 60000)
                await sql.updateColumn("guilds", "point toggle", "off")
                await sql.updateColumn("guilds", "level message", "Congrats user, you are now level newlevel!")
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Level settings were reset!`)
                discord.send(msg, responseEmbed)
                return
            }
            if (msg.content.toLowerCase() === "destroy") {
                await sql.updateColumn("guilds", "scores", null)
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Points were destroyed for every member in the guild!`)
                discord.send(msg, responseEmbed)
                return
            }
            const newMsg = msg.content.replace(/enable/g, "").replace(/disable/g, "").replace(/\[(.*)\]/g, "")
            .replace(/<(.*)>/g, "").replace(/\{(.*)\}/g, "").trim()
            const newRange = msg.content.match(/(?<=\[)(.*)(?=\])/g)
            const newTimeout = msg.content.match(/(?<=<)(.*)(?=>)/g)
            const newThreshold = msg.content.match(/(?<=\{)(.*)(?=\})/g)
            if (msg.content.match(/enable/g)) setOn = true
            if (msg.content.match(/disable/g)) setOff = true
            if (newRange) setRange = true
            if (newTimeout) setTimeout = true
            if (newThreshold) setThreshold = true
            if (newMsg) setMsg = true
            if (newMsg === "undefined") setMsg = false

            let description = ""

            if (setOn && setOff) {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}You cannot disable/enable at the same time.`)
                return discord.send(msg, responseEmbed)
            }

            if (setMsg) {
                await sql.updateColumn("guilds", "level message", newMsg)
                description += `${discord.getEmoji("star")}Level message set to **${newMsg}**\n`
            }

            if (setOn) {
                await sql.updateColumn("guilds", "point toggle", "on")
                description += `${discord.getEmoji("star")}Leveling is now **enabled**!\n`
            }
            if (setOff) {
                await sql.updateColumn("guilds", "point toggle", "off")
                description += `${discord.getEmoji("star")}Leveling is now **disabled**!\n`
            }
            if (setRange) {
                await sql.updateColumn("guilds", "point range", newRange)
                description += `${discord.getEmoji("star")}Point range set to **${newRange}**!\n`
            }
            if (setThreshold) {
                await sql.updateColumn("guilds", "point threshold", String(newThreshold))
                description += `${discord.getEmoji("star")}Point threshold set to **${newThreshold}**!\n`
            }
            if (setTimeout) {
                const timeout = Math.floor(parseInt(String(newTimeout), 10)*1000)
                await sql.updateColumn("guilds", "point timeout", timeout)
                description += `${discord.getEmoji("star")}Point timeout set to **${timeout}**!\n`
            }

            responseEmbed
            .setDescription(description)
            return discord.send(msg, responseEmbed)
        }

        embeds.createPrompt(levelPrompt)
    }
}
