/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {CommandFunctions} from "./../../structures/CommandFunctions"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Auto extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Configures settings for auto commands.",
            help:
            `
            \`auto\` - Shows the auto settings prompt.
            \`auto cmd? #channel? num?\` - Sets the command, channel, and frequency (in hours).
            \`auto toggle setting\` - Turns a setting on or off.
            \`auto edit setting cmd? #channel? num?\` - Edits an existing setting.
            \`auto delete setting\` - Deletes a setting.
            \`auto reset\` - Resets all settings.
            `,
            examples:
            `
            \`=>auto holiday #holidays 24\`
            \`=>auto edit 1 #newchannel 12\`
            \`=>auto delete 1\`
            `,
            guildOnly: true,
            cachedGuildOnly: true,
            aliases: [],
            cooldown: 10,
            premium: true,
            defer: true,
            subcommandEnabled: true
        })
        const editOption = new SlashCommandOption()
            .setType("string")
            .setName("edit")
            .setDescription("The cmd #channel num in edit subcommand")

        const settingOption = new SlashCommandOption()
            .setType("string")
            .setName("setting")
            .setDescription("Can be a setting number")

        const toggleOption = new SlashCommandOption()
            .setType("string")
            .setName("toggle")
            .setDescription("Can toggle/edit/delete/reset or cmd #channel num")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(toggleOption)
            .addOption(settingOption)
            .addOption(editOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const embeds = new Embeds(discord, message)
        const sql = new SQLQuery(message)
        const cmdFunc = new CommandFunctions(discord, message)
        if (!message.channel.isSendable()) return
        if (!await perms.checkAdmin()) return
        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            await autoPrompt(message)
            return
        }

        const commands = await sql.fetchColumn("guilds", "auto commands")
        const channels = await sql.fetchColumn("guilds", "auto channels")
        const frequencies = await sql.fetchColumn("guilds", "auto frequencies")
        const toggles = await sql.fetchColumn("guilds", "auto toggles")
        const step = 3.0
        const increment = Math.ceil((commands ? commands.length : 1) / step)
        const autoArray: EmbedBuilder[] = []
        for (let i = 0; i < increment; i++) {
            let settings = ""
            for (let j = 0; j < step; j++) {
                if (commands) {
                    const k = (i*step)+j
                    if (!commands.join("")) settings = "None"
                    if (!commands[k]) break
                    settings += `${k + 1} **=>**\n` +
                    `${discord.getEmoji("star")}_Command:_ **${commands[k] ? commands[k] : "None"}**\n`+
                    `${discord.getEmoji("star")}_Channel:_ **${channels[k] ? "<#" + channels[k] + ">" : "None"}**\n`+
                    `${discord.getEmoji("star")}_Frequency:_ **${frequencies[k] ? frequencies[k] : "None"}**\n` +
                    `${discord.getEmoji("star")}_State:_ **${toggles[k]}**\n`
                } else {
                    settings = "None"
                }
            }
            const autoEmbed = embeds.createEmbed()
            autoEmbed
            .setTitle(`**Auto Commands** ${discord.getEmoji("think")}`)
            .setThumbnail(message.guild!.iconURL({extension: "png"})!)
            .setDescription(Functions.multiTrim(`
            Configure settings for auto commands. You can set up a maximum of 10 auto commands.
            newline
            **Frequency** - How often the command will run, in hours.
            **State** - Active (on) or Inactive (off).
            newline
            __Current Settings:__
            ${settings}
            newline
            __Edit Settings:__
            ${discord.getEmoji("star")}_Type **any command** to set the command._
            ${discord.getEmoji("star")}_**Mention any channel** to set the channel._
            ${discord.getEmoji("star")}_Type **any number** to set the frequency._
            ${discord.getEmoji("star")}_You can set **multiple options at once**._
            ${discord.getEmoji("star")}_Type **toggle (setting number)** to toggle the state._
            ${discord.getEmoji("star")}_Type **edit (setting number)** to edit a setting._
            ${discord.getEmoji("star")}_Type **delete (setting number)** to delete a setting._
            ${discord.getEmoji("star")}_Type **reset** to delete all settings._
            ${discord.getEmoji("star")}_Type **cancel** to exit._
            `))
            autoArray.push(autoEmbed)
        }

        if (autoArray.length > 1) {
            embeds.createReactionEmbed(autoArray)
        } else {
            this.reply(autoArray)
        }

        async function autoPrompt(msg: Message) {
            const responseEmbed = embeds.createEmbed()
            responseEmbed.setTitle(`**Auto Commands** ${discord.getEmoji("think")}`)
            let [setCmd, setChannel, setFreq, setInit] = [] as boolean[]
            let cmds = await sql.fetchColumn("guilds", "auto commands")
            let chans = await sql.fetchColumn("guilds", "auto channels")
            let freqs = await sql.fetchColumn("guilds", "auto frequencies")
            let togs = await sql.fetchColumn("guilds", "auto toggles")
            const tims = await sql.fetchColumn("guilds", "auto timeouts")
            if (!cmds) cmds = [""]; setInit = true
            if (!chans) chans = [""]; setInit = true
            if (!freqs) freqs = [""]; setInit = true
            if (!togs) togs = [""]; setInit = true
            if (msg.content.toLowerCase().startsWith("cancel")) {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                return discord.send(msg, responseEmbed)
            }
            if (msg.content.toLowerCase().startsWith("reset")) {
                await sql.updateColumn("guilds", "auto commands", null)
                await sql.updateColumn("guilds", "auto channels", null)
                await sql.updateColumn("guilds", "auto frequencies", null)
                await sql.updateColumn("guilds", "auto toggles", null)
                await sql.updateColumn("guilds", "auto timeouts", null)
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Auto settings were wiped!`)
                return discord.send(msg, responseEmbed)
            }
            if (msg.content.toLowerCase().startsWith("delete")) {
                const newMsg = Number(msg.content.replace(/delete/g, "").trim())
                const num = newMsg - 1
                if (newMsg) {
                        cmds[num] = ""
                        chans[num] = ""
                        freqs[num] = ""
                        togs[num] = ""
                        tims[num] = ""
                        const arrCmd = cmds.filter(Boolean)
                        const arrChan = chans.filter(Boolean)
                        const arrFreq = freqs.filter(Boolean)
                        const arrTog = togs.filter(Boolean)
                        const arrTim = tims.filter(Boolean)
                        await sql.updateColumn("guilds", "auto commands", arrCmd)
                        await sql.updateColumn("guilds", "auto channels", arrChan)
                        await sql.updateColumn("guilds", "auto frequencies", arrFreq)
                        await sql.updateColumn("guilds", "auto toggles", arrTog)
                        await sql.updateColumn("guilds", "auto timeouts", arrTim)
                        return discord.send(msg, responseEmbed.setDescription(`Setting **${newMsg}** was deleted!`))
                } else {
                    return discord.send(msg, responseEmbed.setDescription("Setting not found!"))
                }
            }
            if (msg.content.toLowerCase().startsWith("toggle")) {
                const newMsg = Number(msg.content.replace(/toggle/g, "").trim())
                const num = newMsg - 1
                const testCmds = await sql.fetchColumn("guilds", "auto commands")
                const testChans = await sql.fetchColumn("guilds", "auto channels")
                const testFreqs = await sql.fetchColumn("guilds", "auto frequencies")
                if (newMsg && testCmds && testChans && testFreqs) {
                        if (togs[num] === "inactive") {
                            togs[num] = "active"
                            await sql.updateColumn("guilds", "auto toggles", togs)
                            return discord.send(msg, responseEmbed.setDescription(`State of setting **${newMsg}** is now **active**!`))
                        } else {
                            togs[num] = "inactive"
                            await sql.updateColumn("guilds", "auto toggles", togs)
                            return discord.send(msg, responseEmbed.setDescription(`State of setting **${newMsg}** is now **inactive**!`))
                        }
                } else {
                    return discord.send(msg, responseEmbed.setDescription("You cannot use the toggle command on an unfinished setting!"))
                }
            }
            if (msg.content.toLowerCase().startsWith("edit")) {
                const newMsg = msg.content.replace(/edit/g, "").trim().split(" ")
                const tempMsg = newMsg.slice(1).join(" ")
                const num = Number(newMsg[0]) - 1
                if (tempMsg) {
                    const tempCmd = tempMsg.match(/\D+/gi)?.join("").replace(/<#/g, "").replace(/>/g, "").trim() ?? ""
                    const tempChan = tempMsg.match(/(<#\d+>)/g)?.join("").replace(/<#/g, "").replace(/>/g, "") ?? ""
                    const tempFreq = tempMsg.replace(/\D+/gi, "").replace(tempChan, "").replace(/\s+/g, "")
                    let editDesc = ""
                    if (tempCmd) {
                        cmds[num] = tempCmd
                        await sql.updateColumn("guilds", "auto commands", cmds)
                        editDesc += `${discord.getEmoji("star")}Command set to **${tempCmd}**!\n`
                    }
                    if (tempChan) {
                        chans[num] = tempChan
                        await sql.updateColumn("guilds", "auto channels", chans)
                        editDesc += `${discord.getEmoji("star")}Channel set to **${tempChan}**!\n`
                    }
                    if (tempFreq) {
                        freqs[num] = tempFreq
                        await sql.updateColumn("guilds", "auto frequencies", freqs)
                        editDesc += `${discord.getEmoji("star")}Frequency set to **${tempFreq}**!\n`
                    }
                    tims[num] = ""
                    await sql.updateColumn("guilds", "auto timeouts", tims)
                    const testCmds = await sql.fetchColumn("guilds", "auto commands")
                    const testChans = await sql.fetchColumn("guilds", "auto channels")
                    const testFreqs = await sql.fetchColumn("guilds", "auto frequencies")
                    if (testCmds[num] && testChans[num] && testFreqs[num]) {
                        togs[num] = "active"
                        await sql.updateColumn("guilds", "auto toggles", togs)
                        editDesc += `${discord.getEmoji("star")}This setting is **active**!\n`
                        cmdFunc.autoCommand()
                    } else {
                        togs[num] = "inactive"
                        await sql.updateColumn("guilds", "auto toggles", togs)
                        editDesc += `${discord.getEmoji("star")}This setting is **inactive**!\n`
                    }
                    return discord.send(msg, responseEmbed.setDescription(editDesc))
                } else {
                    return discord.send(msg, responseEmbed.setDescription("No edits specified!"))
                }
            }

            const newCmd = msg.content.match(/\D+/gi)?.join("").replace(/<#/g, "").replace(/>/g, "").trim() ?? ""
            const newChan = msg.content.match(/<#\d+>/g)?.join("").replace(/<#/g, "").replace(/>/g, "") ?? ""
            const newFreq = msg.content.replace(/\D+/gi, "").replace(newChan, "").replace(/\s+/g, "")
            if (newCmd) setCmd = true
            if (newChan) setChannel = true
            if (newFreq) setFreq = true

            let description = ""

            if (setCmd) {
                if (cmds.length >= 10) {
                    return discord.send(msg, responseEmbed.setDescription("You can only set 10 auto commands!"))
                } else {
                    cmds.push(newCmd)
                    const arrCmd = cmds.filter(Boolean)
                    await sql.updateColumn("guilds", "auto commands", arrCmd)
                    description += `${discord.getEmoji("star")}Command set to **${newCmd}**!\n`
                }
            }

            if (setChannel) {
                if (cmds.length === 10) {
                    return discord.send(msg, responseEmbed.setDescription("You can only set 10 auto commands!"))
                } else {
                    chans.push(newChan)
                    const arrChan = chans.filter(Boolean)
                    await sql.updateColumn("guilds", "auto channels", arrChan)
                    description += `${discord.getEmoji("star")}Channel set to <#${newChan}>!\n`
                }
            }

            if (setFreq) {
                if (cmds.length === 10) {
                    return discord.send(msg, responseEmbed.setDescription("You can only set 10 auto commands!"))
                } else {
                    freqs.push(newFreq)
                    const arrFreq = freqs.filter(Boolean)
                    await sql.updateColumn("guilds", "auto frequencies", arrFreq)
                    description += `${discord.getEmoji("star")}Frequency set to **${newFreq}**!\n`
                }
            }

            if (!setCmd) {
                if (setInit) cmds = cmds.filter(Boolean)
                cmds.push("")
                await sql.updateColumn("guilds", "auto commands", cmds)
            }
            if (!setChannel) {
                if (setInit) chans = chans.filter(Boolean)
                chans.push("")
                await sql.updateColumn("guilds", "auto commands", chans)
            }
            if (!setFreq) {
                if (setInit) freqs = freqs.filter(Boolean)
                freqs.push("")
                await sql.updateColumn("guilds", "auto commands", freqs)
            }

            if (setCmd && setChannel && setFreq) {
                togs = togs.filter(Boolean)
                togs.push("active")
                await sql.updateColumn("guilds", "auto toggles", togs)
                description += `${discord.getEmoji("star")}This setting is **active**!\n`
                cmdFunc.autoCommand()
            } else {
                togs = togs.filter(Boolean)
                togs.push("inactive")
                await sql.updateColumn("guilds", "auto toggles", togs)
                description += `${discord.getEmoji("star")}This setting is **inactive**!\n`
            }
            responseEmbed
            .setDescription(description)
            discord.send(msg, responseEmbed)
            return
        }

        await embeds.createPrompt(autoPrompt)
    }
}
