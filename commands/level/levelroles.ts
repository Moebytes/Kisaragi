import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"
import {SQLQuery} from "../../structures/SQLQuery"

export default class LevelRoles extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Configures settings for level up roles.",
            help:
            `
            \`levelroles\` - Opens the levelroles prompt
            \`levelroles @role? points? msg?\` - Sets a new level up role.
            \`levelroles edit setting @role? points? msg?\` - Edits the level up role.
            \`levelroles delete setting\` - Deletes a level up role.
            \`levelroles reset\` - Deletes all level up roles.
            `,
            examples:
            `
            \`=>levelroles\`
            \`=>levelroles @senpai 10000\`
            \`=>levelroles @cute 5000 You are cute!\`
            `,
            guildOnly: true,
            cachedGuildOnly: true,
            aliases: ["lr"],
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const msg2Option = new SlashCommandOption()
            .setType("string")
            .setName("msg2")
            .setDescription("The message in the edit subcommand.")

        const msgOption = new SlashCommandOption()
            .setType("string")
            .setName("msg")
            .setDescription("Can be a message or amount of points.")

        const pointsOption = new SlashCommandOption()
            .setType("string")
            .setName("points")
            .setDescription("Can be a setting number or amount of points.")

        const roleOption = new SlashCommandOption()
            .setType("string")
            .setName("role")
            .setDescription("Can be edit/delete/reset or a role.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(roleOption)
            .addOption(pointsOption)
            .addOption(msgOption)
            .addOption(msg2Option)
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

        const levelRoles = await sql.fetchColumn("guilds", "level roles")
        const step = 3.0
        const increment = Math.ceil((levelRoles ? levelRoles.length : 1) / step)
        const levelArray: EmbedBuilder[] = []
        for (let i = 0; i < increment; i++) {
            let settings = ""
            for (let j = 0; j < step; j++) {
                if (levelRoles) {
                    const k = (i*step)+j
                    if (!levelRoles[k]) break
                    const curr = JSON.parse(levelRoles[k])
                    const defaultMessage = `Congrats user, you now have the role rolename! ${discord.getEmoji("kannaWave")}`
                    settings += `${k + 1} **=>**\n` +
                    `${discord.getEmoji("star")}_Role:_ **${curr.role ? `<@&${curr.role}>` : "None"}**\n`+
                    `${discord.getEmoji("star")}_Level:_ **${curr.level ? curr.level : "None"}**\n`+
                    `${discord.getEmoji("star")}_Message:_ **${curr.message ? curr.message : defaultMessage}**\n`
                } else {
                    settings = "None"
                }
            }
            const levelEmbed = embeds.createEmbed()
            levelEmbed
            .setTitle(`**Level Up Roles** ${discord.getEmoji("meguminPadoru")}`)
            .setThumbnail(message.guild!.iconURL() as string)
            .setDescription(Functions.multiTrim(`
                Configure settings for level up roles.
                newline
                __Text Replacements:__
                **user** - user mention
                **tag** - user tag
                **name** - username
                **rolename** - role name
                **rolemention** - role mention
                newline
                __Current Settings:__
                ${settings}
                newline
                __Edit Settings:__
                ${discord.getEmoji("star")}_**Mention a role/role id** to set the level up role._
                ${discord.getEmoji("star")}_Type a **number** to set the level that is required to earn this role._
                ${discord.getEmoji("star")}_Type a **message** to set the level up message for this role._
                ${discord.getEmoji("star")}_**You can type multiple options** to enable all at once._
                ${discord.getEmoji("star")}_Type **delete (setting number)** to delete a setting._
                ${discord.getEmoji("star")}_Type **reset** to delete all level up roles._
                ${discord.getEmoji("star")}_Type **cancel** to exit._
            `))
            levelArray.push(levelEmbed)
        }

        if (levelArray.length > 1) {
            embeds.createReactionEmbed(levelArray)
        } else {
            this.reply(levelArray)
        }

        async function levelPrompt(msg: Message) {
            const responseEmbed = embeds.createEmbed()
            let roles = await sql.fetchColumn("guilds", "level roles")
            if (!roles) roles = []
            responseEmbed.setTitle(`**Level Up Roles** ${discord.getEmoji("meguminPadoru")}`)
            let [setRole, setLevel, setMsg] = [false, false, false]
            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                discord.send(msg, responseEmbed)
                return
            }
            if (msg.content.toLowerCase() === "reset") {
                await sql.updateColumn("guilds", "level roles", null)
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Level role settings were reset!`)
                discord.send(msg, responseEmbed)
                return
            }
            if (msg.content.toLowerCase().startsWith("delete")) {
                const newMsg = Number(msg.content.replace(/delete/g, "").trim())
                const num = newMsg - 1
                if (newMsg) {
                        roles[num] = ""
                        roles = roles.filter(Boolean)
                        await sql.updateColumn("guilds", "level roles", roles)
                        return discord.send(msg, responseEmbed.setDescription(`Setting **${newMsg}** was deleted!`))
                } else {
                    return discord.send(msg, responseEmbed.setDescription("Setting not found!"))
                }
            }
            if (msg.content.toLowerCase().startsWith("edit")) {
                const newMsg = msg.content.replace(/edit/g, "").trim().split(" ")
                const tempMsg = newMsg.slice(1).join(" ")
                const num = Number(newMsg[0]) - 1
                if (tempMsg) {
                    let editDesc = ""
                    let tempRole = tempMsg.match(/(?<=<@&)(.*?)(?=>)/)?.[0] ?? ""
                    if (!tempRole) tempRole = tempMsg.match(/\d{15,}/)?.[0] ?? ""
                    const tempLevel = tempMsg.replace(tempRole, "").match(/-?\d+/)?.[0] ?? ""
                    const tempMessage = tempMsg.replace(tempRole, "").replace(tempLevel, "").replace(/<@&/g, "").replace(/>/g, "").trim()
                    const curr = JSON.parse(roles[num])
                    if (tempRole) {
                        const roleTest = message.guild?.roles.cache.get(tempRole)
                        if (!roleTest) return message.reply(`Invalid role ${discord.getEmoji("kannaFacepalm")}`)
                        curr.role = tempRole
                        editDesc += `${discord.getEmoji("star")}Level up role set to <@&${tempRole}>!\n`
                    }
                    if (setLevel) {
                        curr.level = tempLevel
                        editDesc += `${discord.getEmoji("star")}Level required set to ${tempLevel}!\n`
                    }
                    if (setMsg) {
                        curr.message = tempMessage
                        editDesc += `${discord.getEmoji("star")}Message set to ${tempMessage}!\n`
                    }
                    if (!editDesc) return message.reply(`No edits were made ${discord.getEmoji("kannaFacepalm")}`)
                    roles[num] = curr
                    await sql.updateColumn("guilds", "level roles", roles)

                    return discord.send(msg, responseEmbed.setDescription(editDesc))
                } else {
                    return discord.send(msg, responseEmbed.setDescription("No edits specified!"))
                }
            }

            let newRole = msg.content.match(/(?<=<@&)(.*?)(?=>)/)?.[0] ?? ""
            if (!newRole) newRole = msg.content.match(/\d{15,}/)?.[0] ?? ""
            const newLevel = msg.content.replace(newRole, "").match(/-?\d+/)?.[0] ?? ""
            const newMsg = msg.content.replace(newRole, "").replace(newLevel, "").replace(/<@&/g, "").replace(/>/g, "").trim()

            if (newRole) setRole = true
            if (newLevel) setLevel = true
            if (newMsg) setMsg = true

            let description = ""
            const obj = {} as any

            if (setRole) {
                const roleTest = message.guild?.roles.cache.get(newRole)
                if (!roleTest) return message.reply(`Invalid role ${discord.getEmoji("kannaFacepalm")}`)
                obj.role = newRole
                description += `${discord.getEmoji("star")}Level up role set to <@&${newRole}>!\n`
            }

            if (setLevel) {
                obj.level = newLevel
                description += `${discord.getEmoji("star")}Level required set to ${newLevel}!\n`
            }

            if (setMsg) {
                obj.message = newMsg
                description += `${discord.getEmoji("star")}Message set to ${newMsg}!\n`
            }
            if (!description) return message.reply(`No additions were made, canceled ${discord.getEmoji("kannaFacepalm")}`)
            roles.push(obj)
            await sql.updateColumn("guilds", "level roles", roles)
            responseEmbed
            .setDescription(description)
            return discord.send(msg, responseEmbed)
        }

        embeds.createPrompt(levelPrompt)
    }
}
