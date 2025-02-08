import {GuildBasedChannel, Message, AttachmentBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Images} from "./../../structures/Images"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Leave extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Configures settings for leave messages.",
            help:
            `
            \`leave\` - Opens the leave prompt.
            \`leave enable/disable\` - Enables or disables leave messages
            \`leave msg\` - Sets the leave message
            \`leave #channel\` - Sets the channel where messages are sent
            \`leave url\` - Sets the background image(s)
            \`leave [msg]\` - Sets the background text
            \`leave rainbow/#hexcolor\` - Sets the background text color
            \`leave bg\` - Toggles the background text and picture (just displays the raw image)
            \`leave reset\` - Resets settings to the default
            `,
            examples:
            `
            \`=>leave user left guild! #channel [username left!] rainbow\`
            \`=>leave reset\`
            `,
            guildOnly: true,
            aliases: ["farewell"],
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const optOption = new SlashCommandOption()
            .setType("string")
            .setName("opt")
            .setDescription("Check help for all the options or reset.")
            
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
        const images = new Images(discord, message)
        const sql = new SQLQuery(message)
        if (!await perms.checkAdmin()) return
        if (!message.channel.isSendable()) return
        const loading = message.channel.lastMessage
        if (message instanceof Message) loading?.delete()
        const axios = require("axios")
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            await leavePrompt(message)
            return
        }
        const leaveEmbed = embeds.createEmbed()
        const leaveMsg = await sql.fetchColumn("guilds", "leave message")
        const leaveToggle = await sql.fetchColumn("guilds", "leave toggle")
        const leaveChannel = await sql.fetchColumn("guilds", "leave channel")
        const leaveImages = await sql.fetchColumn("guilds", "leave bg images")
        const leaveText = await sql.fetchColumn("guilds", "leave bg text")
        const leaveColor = await sql.fetchColumn("guilds", "leave bg color")
        const leaveBGToggle = await sql.fetchColumn("guilds", "leave bg toggle")
        const attachment = await images.createCanvas(message.member!, leaveImages, leaveText, leaveColor, false, false, leaveBGToggle) as AttachmentBuilder
        const urls: string[] = []
        for (let i = 0; i < leaveImages?.length; i++) {
            const json = await axios.get(`https://is.gd/create.php?format=json&url=${leaveImages[i]}`)
            urls.push(json.data.shorturl)
        }
        leaveEmbed
        .setTitle(`**Leave Messages** ${discord.getEmoji("sagiriBleh")}`)
        .setThumbnail(message.guild!.iconURL({extension: "png"})!)
        .setImage(`attachment://${attachment.name ? attachment.name : "animated.gif"}`)
        .setDescription(Functions.multiTrim(`
            View and edit the settings for leave messages!
            newline
            __Text Replacements:__
            **user** - mention
            **username** - member username
            **name** - member name
            **guild** - guild name
            **count** - guild member count
            newline
            __Current Settings:__
            ${discord.getEmoji("star")}_Leave Message:_ **${leaveMsg}**
            ${discord.getEmoji("star")}_Leave Channel:_ **${leaveChannel ?  `<#${leaveChannel}>`  :  "None"}**
            ${discord.getEmoji("star")}_Leave Toggle:_ **${leaveToggle}**
            ${discord.getEmoji("star")}_Background Images:_ **${Functions.checkChar(urls.join(" "), 500, " ")}**
            ${discord.getEmoji("star")}_Background Text:_ **${leaveText}**
            ${discord.getEmoji("star")}_Background Text Color:_ **${leaveColor}**
            ${discord.getEmoji("star")}_BG Text and Picture:_ **${leaveBGToggle}**
            newline
            __Edit Settings:__
            ${discord.getEmoji("star")}_**Type any message** to set it as the leave message._
            ${discord.getEmoji("star")}_Type **enable** or **disable** to enable or disable leave messages._
            ${discord.getEmoji("star")}_**Mention a channel** to set it as the leave channel._
            ${discord.getEmoji("star")}_Post an **image URL** (jpg, png, gif) to set the background image._
            ${discord.getEmoji("star")}_Add brackets **[text]** to set the background text._
            ${discord.getEmoji("star")}_Type **rainbow** or a **hex color** to set the background text color._
            ${discord.getEmoji("star")}_**You can type multiple options** to set them at once._
            ${discord.getEmoji("star")}_Type **reset** to reset settings._
            ${discord.getEmoji("star")}_Type **cancel** to exit._
        `))
        if (leaveBGToggle === "on") {
            this.reply(leaveEmbed, attachment)
        } else {
            this.reply(leaveEmbed)
        }

        async function leavePrompt(msg: Message) {
            const responseEmbed = embeds.createEmbed()
            let [setMsg, setOn, setOff, setChannel, setImage, setBGText, setBGColor, setBGToggle] = [false, false, false, false, false, false, false, false]
            responseEmbed.setTitle(`**Leave Messages** ${discord.getEmoji("sagiriBleh")}`)
            const newMsg = msg.content.replace(/<#\d+>/g, "").replace(/\[(.*)\]/g, "").replace(/enable/g, "").replace(/rainbow/g, "")
            .replace(/disable/g, "").replace(/#[0-9a-f]{3,6}/ig, "").replace(/(https?:\/\/[^\s]+)/g, "").replace(/bg/g, "")
            const newImage = msg.content.match(/(https?:\/\/[^\s]+)/g)
            const newBGText = msg.content.match(/\[(.*)\]/g)
            const newBGColor = (msg.content.match(/rainbow/g) || msg.content.match(/(\s|^)#[0-9a-f]{3,6}/ig))
            const newBGToggle = msg.content.match(/bg/)
            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                discord.send(msg, responseEmbed)
                return
            }
            if (msg.content.toLowerCase() === "reset") {
                await sql.updateColumn("guilds", "leave message", "user has left guild!")
                await sql.updateColumn("guilds", "leave channel", null)
                await sql.updateColumn("guilds", "leave toggle", "off")
                await sql.updateColumn("guilds", "leave bg images", ["https://i.imgur.com/3KoLVtn.gif"])
                await sql.updateColumn("guilds", "leave bg text", "username left! There are now count members.")
                await sql.updateColumn("guilds", "leave bg color", "rainbow")
                await sql.updateColumn("guilds", "leave bg toggle", "on")
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Leave settings were reset!`)
                discord.send(msg, responseEmbed)
                return
            }

            if (newBGColor) setBGColor = true
            if (newMsg.trim()) setMsg = true
            if (msg.content.toLowerCase().includes("enable")) setOn = true
            if (msg.content.toLowerCase() === "disable") setOff = true
            if ([...msg.mentions.channels.values()]?.[0]) setChannel = true
            if (newImage) setImage = true
            if (newBGText) setBGText = true

            if (setOn && setOff) {
                responseEmbed
                    .setDescription(`${discord.getEmoji("star")}You cannot disable/enable at the same time.`)
                discord.send(msg, responseEmbed)
                return
            }

            if (!setChannel && setOn) {
                    responseEmbed
                    .setDescription(`${discord.getEmoji("star")}In order to enable leave messages, you must specify a leave channel!`)
                    discord.send(msg, responseEmbed)
                    return
            }
            let description = ""
            if (setMsg) {
                await sql.updateColumn("guilds", "leave message", String(newMsg.trim()))
                description += `${discord.getEmoji("star")}Leave Message set to **${newMsg.trim()}**\n`
            }
            if (setChannel) {
                const channel = msg.guild!.channels.cache.find((c: GuildBasedChannel) => c === msg.mentions.channels.first())
                if (!channel) return message.reply(`Invalid channel name ${discord.getEmoji("kannaFacepalm")}`)
                await sql.updateColumn("guilds", "leave channel", channel.id)
                setOn = true
                description += `${discord.getEmoji("star")}Leave channel set to <#${channel.id}>!\n`
            }
            if (setOn) {
                await sql.updateColumn("guilds", "leave toggle", "on")
                description += `${discord.getEmoji("star")}Leave Messages are **on**!\n`
            }
            if (setOff) {
                await sql.updateColumn("guilds", "leave toggle", "off")
                description += `${discord.getEmoji("star")}Leave Messages are **off**!\n`
            }
            if (setImage) {
                let images = newImage!.map((i) => i)
                images = Functions.removeDuplicates(images)
                await sql.updateColumn("guilds", "leave bg images", images)
                description += `${discord.getEmoji("star")}Background image(s) set to **${Functions.checkChar(images.join(", "), 500, ",")}**!\n`
            }
            if (setBGText) {
                await sql.updateColumn("guilds", "leave bg text", String(newBGText![0].replace(/\[/g, "").replace(/\]/g, "")))
                description += `${discord.getEmoji("star")}Background text set to **${newBGText![0].replace(/\[/g, "").replace(/\]/g, "")}**\n`
            }
            if (setBGColor) {
                await sql.updateColumn("guilds", "leave bg color", String(newBGColor![0]))
                description += `${discord.getEmoji("star")}Background color set to **${newBGColor![0]}**!\n`
            }

            if (setBGToggle) {
                const toggle = await sql.fetchColumn("guilds", "leave bg toggle")
                if (!toggle || toggle === "off") {
                    await sql.updateColumn("guilds", "leave bg toggle", "on")
                    description += `${discord.getEmoji("star")}Background text and picture is **on**!\n`
                } else {
                    await sql.updateColumn("guilds", "leave bg toggle", "off")
                    description += `${discord.getEmoji("star")}Background text and picture is **off**!\n`
                }
            }

            if (!description) return message.reply(`No edits were made, canceled ${discord.getEmoji("kannaFacepalm")}`)
            responseEmbed
            .setDescription(description)
            return discord.send(msg, responseEmbed)
        }

        await embeds.createPrompt(leavePrompt)
    }
}
