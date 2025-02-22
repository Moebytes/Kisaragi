import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Pinboard extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Forwards pins to a pinboard channel.",
            help:
            `
            \`pinboard\` - Opens the pinboard prompt
            \`pinboard #channel\` - Sets the pinboard channel
            \`pinboard [#channel]\` - Sets the NSFW pinboard channel
            \`pinboard reset\` - Deletes the pinboard channel.
            `,
            examples:
            `
            \`=>pinboard\`
            \`=>pinboard #pinboard\`
            `,
            aliases: [],
            guildOnly: true,
            cachedGuildOnly: true,
            botPermission: "ManageWebhooks",
            cooldown: 15,
            defer: true,
            subcommandEnabled: true
        })
        const optOption = new SlashCommandOption()
            .setType("string")
            .setName("opt")
            .setDescription("Can be #channel/[#channel]/reset.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(optOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const sql = new SQLQuery(message)
        const perms = new Permission(discord, message)
        if (!await perms.checkMod()) return
        if (!message.channel.isSendable()) return
        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            await pinboardPrompt(message)
            return
        }

        const pinboard = await sql.fetchColumn("guilds", "pinboard")
        const nsfwPinboard = await sql.fetchColumn("guilds", "nsfw pinboard")

        const pinboardEmbed = embeds.createEmbed()
        pinboardEmbed
        .setTitle(`**Pinboard** ${discord.getEmoji("yes")}`)
        .setThumbnail(message.guild!.iconURL({extension: "png"})!)
        .setDescription(Functions.multiTrim(`
            Edit pinboard settings.
            newline
            **Pinboard** - The channel where pins are forwarded.
            **NSFW Pinboard** - Where pins in NSFW channels are forwarded.
            newline
            __Current Settings__
            ${discord.getEmoji("star")}Pinboard: ${pinboard ? `<#${pinboard}>` : "None"}
            ${discord.getEmoji("star")}NSFW Pinboard: ${nsfwPinboard ? `<#${nsfwPinboard}>` : "None"}
            newline
            __Edit Settings__
            ${discord.getEmoji("star")}**Mention or type a channel id** to set the pinboard channel.
            ${discord.getEmoji("star")}**[Mention or type a channel id] between brackets** to set the nsfw pinboard channel.
            ${discord.getEmoji("star")}Type **reset** to reset all settings.
            ${discord.getEmoji("star")}Type **cancel** to exit.
        `))

        this.reply(pinboardEmbed)

        async function pinboardPrompt(msg: Message) {
            const responseEmbed = embeds.createEmbed()
            .setTitle(`**Pinboard** ${discord.getEmoji("yes")}`)

            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                return discord.send(msg, responseEmbed)
            }
            if (msg.content.toLowerCase() === "reset") {
                await sql.updateColumn("guilds", "pinboard", null)
                await sql.updateColumn("guilds", "nsfw pinboard", null)
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Pinboard settings were wiped!`)
                return discord.send(msg, responseEmbed)
            }

            let [setPin, setNSFW] = [false, false]
            const newNSFW = msg.content.match(/(?<=\[)(.*?)(?=\])/)?.[0].match(/\d+/)?.[0] ?? ""
            const newPin = msg.content.replace(newNSFW, "").match(/\d+/)?.[0] ?? ""

            if (Number(newPin)) setPin = true
            if (Number(newNSFW)) setNSFW = true

            let description = ""

            if (setPin) {
                const channelTest = msg.guild?.channels.cache.get(newPin)
                if (!channelTest) return msg.reply(`Invalid pinboard channel!`)
                await sql.updateColumn("guilds", "pinboard", newPin)
                description += `${discord.getEmoji("star")}Pinboard channel set to <#${newPin}>!\n`
            }

            if (setNSFW) {
                const channelTest = msg.guild?.channels.cache.get(newNSFW)
                if (!channelTest) return msg.reply(`Invalid nsfw pinboard channel!`)
                await sql.updateColumn("guilds", "nsfw pinboard", newNSFW)
                description += `${discord.getEmoji("star")}NSFW pinboard channel set to <#${newNSFW}>!\n`
            }

            if (!description) return msg.reply(`No additions were made, canceled ${discord.getEmoji("kannaFacepalm")}`)
            responseEmbed
            .setDescription(description)
            return discord.send(msg, responseEmbed)
        }

        await embeds.createPrompt(pinboardPrompt)
    }
}
