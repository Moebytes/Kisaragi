/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import axios from "axios"
import {GuildBasedChannel, Message, AttachmentBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Images} from "../../structures/Images"
import {Permission} from "../../structures/Permission"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Welcome extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Configures settings for welcome messages.",
            help:
            `
            \`welcome\` - Opens the welcome messages prompt
            \`welcome msg\` - Sets the welcome message
            \`welcome #channel\` - Sets the channel where welcome messages are sent
            \`welcome url\` - Sets the background image(s)
            \`welcome [msg]\` - Sets the background text
            \`welcome rainbow/#hexcolor\` - Sets the background text color
            \`welcome bg\` - Toggles the background text and picture (just displays the raw image)
            \`welcome reset\` - Resets welcome settings to the default
            `,
            examples:
            `
            \`=>welcome welcome user to guild! [welcome username! There are now count members.]\`
            \`=>welcome enable rainbow\`
            `,
            guildOnly: true,
            cachedGuildOnly: true,
            aliases: ["greeting"],
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
        const sql = new SQLQuery(message)
        const embeds = new Embeds(discord, message)
        const images = new Images(discord, message)
        const perms = new Permission(discord, message)
        if (!await perms.checkAdmin()) return
        if (!message.channel.isSendable()) return
        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            await welcomePrompt(message)
            return
        }
        const welcomeEmbed = embeds.createEmbed()
        const welcomeMsg = await sql.fetchColumn("guilds", "welcome message")
        const welcomeToggle = await sql.fetchColumn("guilds", "welcome toggle")
        const welcomeChannel = await sql.fetchColumn("guilds", "welcome channel")
        const welcomeImages = await sql.fetchColumn("guilds", "welcome bg images")
        const welcomeText = await sql.fetchColumn("guilds", "welcome bg text")
        const welcomeColor = await sql.fetchColumn("guilds", "welcome bg color")
        const welcomeBGToggle = await sql.fetchColumn("guilds", "welcome bg toggle")
        const attachment = await images.createCanvas(message.member!, welcomeImages, welcomeText, welcomeColor, false, false, welcomeBGToggle) as AttachmentBuilder
        const urls: string[] = []
        for (let i = 0; i < welcomeImages?.length; i++) {
            const json = await axios.get(`https://is.gd/create.php?format=json&url=${welcomeImages[i]}`)
            urls.push(json.data.shorturl)
        }
        welcomeEmbed
        .setTitle(`**Welcome Messages** ${discord.getEmoji("karenSugoi")}`)
        .setThumbnail(message.guild!.iconURL({extension: "png"})!)
        .setImage(`attachment://${attachment.name ? attachment.name : "animated.gif"}`)
        .setDescription(Functions.multiTrim(`
            View and edit the settings for welcome messages!
            newline
            __Text Replacements:__
            **user** - member mention
            **username** - member username
            **name** - member name
            **guild** - guild name
            **count** - guild member count
            newline
            __Current Settings:__
            ${discord.getEmoji("star")}_Welcome Message:_ **${welcomeMsg}**
            ${discord.getEmoji("star")}_Welcome Channel:_ **${welcomeChannel ?  `<#${welcomeChannel}>`  :  "None"}**
            ${discord.getEmoji("star")}_Welcome Toggle:_ **${welcomeToggle}**
            ${discord.getEmoji("star")}_Background Images:_ **${Functions.checkChar(urls.join(" "), 500, " ")}**
            ${discord.getEmoji("star")}_Background Text:_ **${welcomeText}**
            ${discord.getEmoji("star")}_Background Text Color:_ **${welcomeColor}**
            ${discord.getEmoji("star")}_BG Text and Picture:_ **${welcomeBGToggle}**
            newline
            __Edit Settings:__
            ${discord.getEmoji("star")}_**Type any message** to set it as the welcome message._
            ${discord.getEmoji("star")}_Type **enable** or **disable** to enable or disable welcome messages._
            ${discord.getEmoji("star")}_**Mention a channel** to set it as the welcome channel._
            ${discord.getEmoji("star")}_Post an **image URL** (jpg, png, gif) to add a background image._
            ${discord.getEmoji("star")}_Add brackets **[text]** to set the background text._
            ${discord.getEmoji("star")}_Type **rainbow** or a **hex color** to set the background text color._
            ${discord.getEmoji("star")}_Type **bg** to toggle the background text and picture._
            ${discord.getEmoji("star")}_**You can type multiple options** to set them at once._
            ${discord.getEmoji("star")}_Type **reset** to reset settings._
            ${discord.getEmoji("star")}_Type **cancel** to exit._
        `))
        if (welcomeBGToggle === "on") {
            this.reply(welcomeEmbed, attachment)
        } else {
            this.reply(welcomeEmbed)
        }

        async function welcomePrompt(msg: Message) {
            const responseEmbed = embeds.createEmbed()
            let [setMsg, setOn, setOff, setChannel, setImage, setBGText, setBGColor, setBGToggle] = [] as boolean[]
            responseEmbed.setTitle(`**Welcome Messages** ${discord.getEmoji("karenSugoi")}`)
            const newMsg = msg.content.replace(/<#\d+>/g, "").replace(/\[(.*)\]/g, "").replace(/enable/g, "").replace(/rainbow/g, "")
            .replace(/disable/g, "").replace(/#[0-9a-f]{3,6}/ig, "").replace(/(https?:\/\/[^\s]+)/g, "").replace(/bg/g, "")
            const newImg = msg.content.match(/(https?:\/\/[^\s]+)/g)
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
                await sql.updateColumn("guilds", "welcome message", "Welcome to guild, user!")
                await sql.updateColumn("guilds", "welcome channel", null)
                await sql.updateColumn("guilds", "welcome toggle", "off")
                await sql.updateColumn("guilds", "welcome bg images", ["https://i.imgur.com/WOYlL17.gif"])
                await sql.updateColumn("guilds", "welcome bg text", "Welcome username! There are now count members.")
                await sql.updateColumn("guilds", "welcome bg color", "rainbow")
                await sql.updateColumn("guilds", "welcome bg toggle", "on")
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Welcome settings were reset!`)
                discord.send(msg, responseEmbed)
                return
            }

            if (newBGColor) setBGColor = true
            if (newMsg.trim()) setMsg = true
            if (msg.content.toLowerCase().includes("enable")) setOn = true
            if (msg.content.toLowerCase() === "disable") setOff = true
            if ([...msg.mentions.channels.values()]?.[0]) setChannel = true
            if (newImg) setImage = true
            if (newBGText) setBGText = true
            if (newBGToggle) setBGToggle = true

            if (setOn && setOff) {
                responseEmbed
                    .setDescription(`${discord.getEmoji("star")}You cannot disable/enable at the same time.`)
                discord.send(msg, responseEmbed)
                return
            }

            if (!setChannel && setOn) {
                    responseEmbed
                    .setDescription(`${discord.getEmoji("star")}In order to enable welcome messages, you must specify a welcome channel!`)
                    discord.send(msg, responseEmbed)
                    return
            }
            let description = ""
            if (setMsg) {
                await sql.updateColumn("guilds", "welcome message", String(newMsg.trim()))
                description += `${discord.getEmoji("star")}Welcome message set to **${newMsg.trim()}**\n`
            }
            if (setChannel) {
                const channel = msg.guild!.channels.cache.find((c: GuildBasedChannel) => c === msg.mentions.channels.first())
                if (!channel) return message.reply(`Invalid channel name ${discord.getEmoji("kannaFacepalm")}`)
                await sql.updateColumn("guilds", "welcome channel", channel.id)
                setOn = true
                description += `${discord.getEmoji("star")}Welcome channel set to <#${channel.id}>!\n`
            }
            if (setOn) {
                await sql.updateColumn("guilds", "welcome toggle", "on")
                description += `${discord.getEmoji("star")}Welcome messages are **on**!\n`
            }
            if (setOff) {
                await sql.updateColumn("guilds", "welcome toggle", "off")
                description += `${discord.getEmoji("star")}Welcome messages are **off**!\n`
            }
            if (setImage) {
                let images = newImg!.map((i) => i)
                images = Functions.removeDuplicates(images)
                await sql.updateColumn("guilds", "welcome bg images", images)
                description += `${discord.getEmoji("star")}Background image(s) set to **${Functions.checkChar(images.join(", "), 500, ",")}**!\n`
            }
            if (setBGText) {
                await sql.updateColumn("guilds", "welcome bg text", String(newBGText![0].replace(/\[/g, "").replace(/\]/g, "")))
                description += `${discord.getEmoji("star")}Background text set to **${newBGText![0].replace(/\[/g, "").replace(/\]/g, "")}**\n`
            }
            if (setBGColor) {
                await sql.updateColumn("guilds", "welcome bg color", String(newBGColor![0].trim()))
                description += `${discord.getEmoji("star")}Background color set to **${newBGColor![0].trim()}**!\n`
            }

            if (setBGToggle) {
                const toggle = await sql.fetchColumn("guilds", "welcome bg toggle")
                if (!toggle || toggle === "off") {
                    await sql.updateColumn("guilds", "welcome bg toggle", "on")
                    description += `${discord.getEmoji("star")}Background text and picture is **on**!\n`
                } else {
                    await sql.updateColumn("guilds", "welcome bg toggle", "off")
                    description += `${discord.getEmoji("star")}Background text and picture is **off**!\n`
                }
            }

            if (!description) return message.reply(`No edits were made, canceled ${discord.getEmoji("kannaFacepalm")}`)
            responseEmbed
            .setDescription(description)
            return discord.send(msg, responseEmbed)
        }
        await embeds.createPrompt(welcomePrompt)
    }
}
