 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Captcha} from "./../../structures/Captcha"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class CaptchaCmd extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Configure settings for captcha verification.",
            help:
            `
            Note: You can type multiple options in one command.
            \`captcha\` - Opens interactive captcha prompt.
            \`captcha enable/disable\` - Enables or disables captcha verification.
            \`captcha @role/role id\` - Sets the verify role.
            \`captcha text/math\` - Changes the captcha type.
            \`captcha easy/medium/hard/extreme\` - Changes the difficulty.
            \`captcha #hexcolor\` - Changes the background color.
            \`captcha reset\` - Resets all settings.
            `,
            examples:
            `
            \`=>captcha @Member 🔑 text medium #ffffff\`
            \`=>captcha\` _then_ \`extreme\`
            \`=>captcha math easy\`
            `,
            guildOnly: true,
            cachedGuildOnly: true,
            aliases: ["verification"],
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const optOption = new SlashCommandOption()
            .setType("string")
            .setName("opt")
            .setDescription("Can be enable/disable/@role/text/math/difficulty/#color/reset.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName("captcha")
            .setDescription(this.options.description)
            .addOption(optOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const embeds = new Embeds(discord, message)
        const sql = new SQLQuery(message)
        const captchaClass = new Captcha(discord, message)
        if (!message.channel.isSendable()) return
        if (!await perms.checkAdmin()) return
        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)
        const input = Functions.combineArgs(args, 1).trim()
        if (input.trim()) {
            message.content = input.trim()
            await captchaPrompt(message)
            return
        }
        const vToggle = await sql.fetchColumn("guilds", "verify toggle")
        const vRole = await sql.fetchColumn("guilds", "verify role")
        const cType = await sql.fetchColumn("guilds", "captcha type")
        const color = await sql.fetchColumn("guilds", "captcha color")
        const difficulty = await sql.fetchColumn("guilds", "difficulty")
        const captchaEmbed = embeds.createEmbed()
        const {captcha, text, files} = await captchaClass.createCaptcha(String(cType), String(color), String(difficulty))
        captchaEmbed
        .setTitle(`**Captcha Verification** ${discord.getEmoji("kannaAngry")}`)
        .setImage(captcha.data.image!.url)
        .setThumbnail(message.guild!.iconURL({extension: "png"})!)
        .setDescription(Functions.multiTrim(`
            Configure settings for captcha verification. In order for this to function, you should create a role for verified members
            and deny the @everyone role reading Permission in all your guild channels, with the exception of the rules channel and the verify channel. Use **verify** to send a captcha.
            newline
            **Verify Role** - The role given to members who solve the captcha.
            **Captcha Type** - Either text or math.
            **Captcha Difficulty** - Either easy, medium, hard, or extreme.
            newline
            __Current Settings:__
            ${discord.getEmoji("star")}_Verify Role:_ **${vRole ?  "<@&" + vRole + ">" : "None"}**
            ${discord.getEmoji("star")}_Verify Toggle:_ **${vToggle}**
            ${discord.getEmoji("star")}_Captcha Type:_ **${cType}**
            ${discord.getEmoji("star")}_Captcha Difficulty:_ **${difficulty}**
            ${discord.getEmoji("star")}_Background Color:_ **${color}**
            newline
            __Edit Settings:__
            ${discord.getEmoji("star")}_Type **enable** or **disable** to enable or disable verification._
            ${discord.getEmoji("star")}_**Mention a role** or type the **role id** to set the verified role._
            ${discord.getEmoji("star")}_Type **text** or **math** to set the captcha type._
            ${discord.getEmoji("star")}_Type **easy**, **medium**, **hard**, or **extreme** to set the difficulty._
            ${discord.getEmoji("star")}_Type a **hex color** to set the background color._
            ${discord.getEmoji("star")}_**You can type multiple options** to enable all at once._
            ${discord.getEmoji("star")}_Type **reset** to reset all settings._
            ${discord.getEmoji("star")}_Type **cancel** to exit._
        `))
        this.reply(captchaEmbed, files)

        async function captchaPrompt(msg: Message) {
            const vRole = await sql.fetchColumn("guilds", "verify role")
            const responseEmbed = embeds.createEmbed()
            responseEmbed.setTitle(`**Captcha Verification** ${discord.getEmoji("kannaAngry")}`)
            let [setOn, setOff, setRole, setText, setMath, setColor, setEasy, setMedium, setHard, setExtreme] = [] as boolean[]
            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                return discord.send(msg, responseEmbed)
            }
            if (msg.content.toLowerCase() === "reset") {
                await sql.updateColumn("guilds", "verify toggle", "off")
                await sql.updateColumn("guilds", "verify role", null)
                await sql.updateColumn("guilds", "captcha type", "text")
                await sql.updateColumn("guilds", "captcha color", "#ffffff")
                await sql.updateColumn("guilds", "difficulty", "medium")
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}All settings were reset!`)
                return discord.send(msg, responseEmbed)
            }

            const newRole = msg.content.match(/\d+/g)
            const newColor = msg.content.match(/(\s|^)#[0-9a-f]{3,6}/ig)

            if (msg.content.match(/enable/gi)) setOn = true
            if (msg.content.match(/disable/gi)) setOff = true
            if (msg.content.match(/text/gi)) setText = true
            if (msg.content.match(/math/gi)) setMath = true
            if (msg.content.match(/easy/gi)) setEasy = true
            if (msg.content.match(/medium/gi)) setMedium = true
            if (msg.content.match(/hard/gi)) setHard = true
            if (msg.content.match(/extreme/gi)) setExtreme = true
            if (newRole) setRole = true
            if (newColor) setColor = true

            if (setOn && setOff) {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}You cannot disable/enable at the same time.`)
                return discord.send(msg, responseEmbed)
            }

            if (setText && setMath) {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}You cannot set both captcha types at the same time.`)
                return discord.send(msg, responseEmbed)
            }

            if (setOn && !setRole && !vRole?.[0]) {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}In order to enable verification, you must set the verify role.`)
                return discord.send(msg, responseEmbed)
            }

            let description = ""

            if (setExtreme || setHard || setMedium || setEasy) {
                const diff = setExtreme ? "extreme" : (
                    setHard ? "hard" : (
                    setMedium ? "medium" : "easy"))
                await sql.updateColumn("guilds", "difficulty", diff)
                description += `${discord.getEmoji("star")}Captcha difficulty set to **${diff}**!\n`
            }

            if (setOn) {
                await sql.updateColumn("guilds", "verify toggle", "on")
                description += `${discord.getEmoji("star")}Captcha verification is **on**!\n`
            }
            if (setOff) {
                await sql.updateColumn("guilds", "verify toggle", "off")
                description += `${discord.getEmoji("star")}Captcha verification is **off**!\n`
            }
            if (setText) {
                await sql.updateColumn("guilds", "captcha type", "text")
                description += `${discord.getEmoji("star")}Captcha type set to **text**!\n`
            }
            if (setMath) {
                await sql.updateColumn("guilds", "captcha type", "math")
                description += `${discord.getEmoji("star")}Captcha type set to **math**!\n`
            }
            if (setRole) {
                await sql.updateColumn("guilds", "verify role", String(newRole!))
                description += `${discord.getEmoji("star")}Verify role set to <@&${String(newRole!)}>!\n`
            }
            if (setColor) {
                await sql.updateColumn("guilds", "captcha color", String(newColor!))
                description += `${discord.getEmoji("star")}Background color set to ${String(newColor!)}\n`
            }

            if (!description) description = `${discord.getEmoji("star")}Invalid arguments provided, canceled the prompt.`
            responseEmbed
            .setDescription(description)
            return discord.send(msg, responseEmbed)
        }

        await embeds.createPrompt(captchaPrompt)
    }
}
