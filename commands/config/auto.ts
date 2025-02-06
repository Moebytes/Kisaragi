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
            aliases: [],
            cooldown: 10,
            defer: true,
            unlist: true,
            subcommandEnabled: false
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
        if (message instanceof Message) loading?.delete()
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            await autoPrompt(message)
            return
        }

        const command = await sql.fetchColumn("auto", "command")
        const channel = await sql.fetchColumn("auto", "channel")
        const frequency = await sql.fetchColumn("auto", "frequency")
        const toggle = await sql.fetchColumn("auto", "toggle")
        const step = 3.0
        const increment = Math.ceil((command ? command.length : 1) / step)
        const autoArray: EmbedBuilder[] = []
        for (let i = 0; i < increment; i++) {
            let settings = ""
            for (let j = 0; j < step; j++) {
                if (command) {
                    const k = (i*step)+j
                    if (!command.join("")) settings = "None"
                    if (!command[k]) break
                    settings += `${k + 1} **=>**\n` +
                    `${discord.getEmoji("star")}_Command:_ **${command[k] ? command[k] : "None"}**\n`+
                    `${discord.getEmoji("star")}_Channel:_ **${channel[k] ? "<#" + channel[k] + ">" : "None"}**\n`+
                    `${discord.getEmoji("star")}_Frequency:_ **${frequency[k] ? frequency[k] : "None"}**\n` +
                    `${discord.getEmoji("star")}_State:_ **${toggle[k]}**\n`
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
            let cmd = await sql.fetchColumn("auto", "command")
            let chan = await sql.fetchColumn("auto", "channel")
            let freq = await sql.fetchColumn("auto", "frequency")
            let tog = await sql.fetchColumn("auto", "toggle")
            const tim = await sql.fetchColumn("auto", "timeout")
            if (!cmd) cmd = [""]; setInit = true
            if (!chan) chan = [""]; setInit = true
            if (!freq) freq = [""]; setInit = true
            if (!tog) tog = [""]; setInit = true
            if (msg.content.toLowerCase().startsWith("cancel")) {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                return discord.send(msg, responseEmbed)
            }
            if (msg.content.toLowerCase().startsWith("reset")) {
                await sql.updateColumn("auto", "command", null)
                await sql.updateColumn("auto", "channel", null)
                await sql.updateColumn("auto", "frequency", null)
                await sql.updateColumn("auto", "toggle", null)
                await sql.updateColumn("auto", "timeout", null)
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Auto settings were wiped!`)
                return discord.send(msg, responseEmbed)
            }
            if (msg.content.toLowerCase().startsWith("delete")) {
                const newMsg = Number(msg.content.replace(/delete/g, "").trim())
                const num = newMsg - 1
                if (newMsg) {
                        cmd[num] = ""
                        chan[num] = ""
                        freq[num] = ""
                        tog[num] = ""
                        tim[num] = ""
                        const arrCmd = cmd.filter(Boolean)
                        const arrChan = chan.filter(Boolean)
                        const arrFreq = freq.filter(Boolean)
                        const arrTog = tog.filter(Boolean)
                        const arrTim = tim.filter(Boolean)
                        await sql.updateColumn("auto", "command", arrCmd)
                        await sql.updateColumn("auto", "channel", arrChan)
                        await sql.updateColumn("auto", "frequency", arrFreq)
                        await sql.updateColumn("auto", "toggle", arrTog)
                        await sql.updateColumn("auto", "timeout", arrTim)
                        return discord.send(msg, responseEmbed.setDescription(`Setting **${newMsg}** was deleted!`))
                } else {
                    return discord.send(msg, responseEmbed.setDescription("Setting not found!"))
                }
            }
            if (msg.content.toLowerCase().startsWith("toggle")) {
                const newMsg = Number(msg.content.replace(/toggle/g, "").trim())
                const num = newMsg - 1
                const testCmd = await sql.fetchColumn("auto", "command")
                const testChan = await sql.fetchColumn("auto", "channel")
                const testFreq = await sql.fetchColumn("auto", "frequency")
                if (newMsg && testCmd && testChan && testFreq) {
                        if (tog[num] === "inactive") {
                            await sql.updateColumn("auto", "toggle", "active")
                            return discord.send(msg, responseEmbed.setDescription(`State of setting **${newMsg}** is now **active**!`))
                        } else {
                            await sql.updateColumn("auto", "toggle", "inactive")
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
                        cmd[num] = tempCmd
                        await sql.updateColumn("auto", "command", cmd)
                        editDesc += `${discord.getEmoji("star")}Command set to **${tempCmd}**!\n`
                    }
                    if (tempChan) {
                        chan[num] = tempChan
                        await sql.updateColumn("auto", "channel", chan)
                        editDesc += `${discord.getEmoji("star")}Channel set to **${tempChan}**!\n`
                    }
                    if (tempFreq) {
                        freq[num] = tempFreq
                        await sql.updateColumn("auto", "frequency", freq)
                        editDesc += `${discord.getEmoji("star")}Frequency set to **${tempFreq}**!\n`
                    }
                    tim[num] = ""
                    await sql.updateColumn("auto", "timeout", tim)
                    const testCmd = await sql.fetchColumn("auto", "command")
                    const testChan = await sql.fetchColumn("auto", "channel")
                    const testFreq = await sql.fetchColumn("auto", "frequency")
                    if (testCmd[num] && testChan[num] && testFreq[num]) {
                        tog[num] = "active"
                        await sql.updateColumn("auto", "toggle", tog)
                        editDesc += `${discord.getEmoji("star")}This setting is **active**!\n`
                        cmdFunc.autoCommand()
                    } else {
                        tog[num] = "inactive"
                        await sql.updateColumn("auto", "toggle", tog)
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
                if (cmd.length >= 10) {
                    return discord.send(msg, responseEmbed.setDescription("You can only set 10 auto commands!"))
                } else {
                    cmd.push(newCmd)
                    const arrCmd = cmd.filter(Boolean)
                    await sql.updateColumn("auto", "command", arrCmd)
                    description += `${discord.getEmoji("star")}Command set to **${newCmd}**!\n`
                }
            }

            if (setChannel) {
                if (cmd.length === 10) {
                    return discord.send(msg, responseEmbed.setDescription("You can only set 10 auto commands!"))
                } else {
                    chan.push(newChan)
                    const arrChan = chan.filter(Boolean)
                    await sql.updateColumn("auto", "channel", arrChan)
                    description += `${discord.getEmoji("star")}Channel set to <#${newChan}>!\n`
                }
            }

            if (setFreq) {
                if (cmd.length === 10) {
                    return discord.send(msg, responseEmbed.setDescription("You can only set 10 auto commands!"))
                } else {
                    freq.push(newFreq)
                    const arrFreq = freq.filter(Boolean)
                    await sql.updateColumn("auto", "frequency", arrFreq)
                    description += `${discord.getEmoji("star")}Frequency set to **${newFreq}**!\n`
                }
            }

            if (!setCmd) {
                if (setInit) cmd = cmd.filter(Boolean)
                cmd.push("")
                await sql.updateColumn("auto", "command", cmd)
            }
            if (!setChannel) {
                if (setInit) chan = chan.filter(Boolean)
                chan.push("")
                await sql.updateColumn("auto", "command", chan)
            }
            if (!setFreq) {
                if (setInit) freq = freq.filter(Boolean)
                freq.push("")
                await sql.updateColumn("auto", "command", freq)
            }

            if (setCmd && setChannel && setFreq) {
                tog = tog.filter(Boolean)
                tog.push("active")
                await sql.updateColumn("auto", "toggle", tog)
                description += `${discord.getEmoji("star")}This setting is **active**!\n`
                cmdFunc.autoCommand()
            } else {
                tog = tog.filter(Boolean)
                tog.push("inactive")
                await sql.updateColumn("auto", "toggle", tog)
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
