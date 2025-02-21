import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class InstantBan extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Configure settings for instant bans.",
            help:
            `
            \`instantban\` - Opens the instant ban prompt
            \`instantban pfp\` - Toggles no profile picture bans
            \`instantban everyone\` - Toggles banning of people who tag @everyone
            `,
            examples:
            `
            \`=>instantban pfp everyone\`
            `,
            aliases: ["iban"],
            guildOnly: true,
            cooldown: 3,
            defer: true,
            subcommandEnabled: true
        })
        const optOption = new SlashCommandOption()
            .setType("string")
            .setName("opt")
            .setDescription("Can be pfp/everyone.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(optOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const embeds = new Embeds(discord, message)
        const sql = new SQLQuery(message)
        if (!await perms.checkAdmin()) return
        if (!message.channel.isSendable()) return
        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            await instantBanPrompt(message)
            return
        }

        const pfpBan = await sql.fetchColumn("guilds", "pfp ban toggle")
        const everyoneBan = await sql.fetchColumn("guilds", "everyone ban toggle")
        const defChannel = await sql.fetchColumn("guilds", "default channel")
        const instantBanEmbed = embeds.createEmbed()
        instantBanEmbed
        .setTitle(`**Instant Bans** ${discord.getEmoji("mexShrug")}`)
        .setThumbnail(message.guild!.iconURL({extension: "png"})!)
        .setDescription(Functions.multiTrim(`
            Configure settings for instant bans.
            newline
            **Profile Picture Ban** - Bans all members that have a default profile picture upon joining.
            **Everyone Ban** - Bans anyone who tries to tag @everyone or @here (and doesn't have the permission to do so).
            **Default Channel** - The default channel where the ban messages are posted.
            newline
            __Current Settings:__
            ${discord.getEmoji("star")}_Profile Picture Ban:_ **${pfpBan ?? "off"}**
            ${discord.getEmoji("star")}_Everyone Ban:_ **${everyoneBan ?? "off"}**
            ${discord.getEmoji("star")}_Default Channel:_ **${defChannel ?  `<#${defChannel}>`  :  "None"}**
            newline
            __Edit Settings:__
            ${discord.getEmoji("star")}_Type **pfp** to toggle profile picture bans._
            ${discord.getEmoji("star")}_Type **everyone** to toggle everyone bans._
            ${discord.getEmoji("star")}_**Mention a channel** to set the default channel._
            ${discord.getEmoji("star")}_**You can type multiple options** to enable all at once._
            ${discord.getEmoji("star")}_Type **reset** to disable all settings._
            ${discord.getEmoji("star")}_Type **cancel** to exit._
        `))
        this.reply(instantBanEmbed)

        async function instantBanPrompt(msg: Message) {
            const responseEmbed = embeds.createEmbed()
            let [setPfp, setChannel, setEveryone] = [false, false, false]
            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                return discord.send(msg, responseEmbed)
            }
            if (msg.content.toLowerCase() === "reset") {
                await sql.updateColumn("guilds", "pfp ban toggle", "off")
                await sql.updateColumn("guilds", "everyone ban toggle", "off")
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}All settings were disabled!`)
                return discord.send(msg, responseEmbed)
            }
            if (msg.content.match(/pfp/g)) setPfp = true
            if (msg.content.match(/everyone/g)) setEveryone = true
            if ([...msg.mentions.channels.values()].join("")) setChannel = true

            let description = ""

            if (setChannel) {
                const channel = msg.guild?.channels.cache.find((c) => c === msg.mentions.channels.first())
                await sql.updateColumn("guilds", "default channel", channel?.id)
                description += `${discord.getEmoji("star")}Default channel set to <#${channel!.id}>!\n`
            }

            if (setPfp) {
                if (String(pfpBan) === "off") {
                    await sql.updateColumn("guilds", "pfp ban toggle", "on")
                    description += `${discord.getEmoji("star")}Profile picture bans are now **on**!\n`
                } else {
                    await sql.updateColumn("guilds", "pfp ban toggle", "off")
                    description += `${discord.getEmoji("star")}Profile picture bans are now **off**!\n`
                }
            }

            if (setEveryone) {
                if (String(everyoneBan) === "off") {
                    await sql.updateColumn("guilds", "everyone ban toggle", "on")
                    description += `${discord.getEmoji("star")}Everyone bans are now **on**!\n`
                } else {
                    await sql.updateColumn("guilds", "everyone ban toggle", "off")
                    description += `${discord.getEmoji("star")}Everyone bans are now **off**!\n`
                }
            }

            if (!description) return msg.reply(`Invalid arguments ${discord.getEmoji("kannaFacepalm")}`)
            responseEmbed
            .setDescription(description)
            return discord.send(msg, responseEmbed)
        }

        await embeds.createPrompt(instantBanPrompt)
    }
}
