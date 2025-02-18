import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Selfroles extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Configures settings for self-assignable roles, or lists all of them.",
            help:
            `
            _Note:_ The commands for the prompt are restricted to admins only.
            \`selfroles\` - Lists all self assignable roles (non-admin) or opens the self roles prompt (admin)
            \`selfroles list\` - Lists all of the self assignable roles (works for admins)
            \`selfroles @role1 @role2\` - Adds roles to the self assignable roles list
            \`selfroles delete setting\` - Removes a role from the list
            \`selfroles reset\` - Deletes all self roles.
            `,
            examples:
            `
            \`=>selfroles list\`
            \`=>selfroles @role1 @role2\`
            \`=>selfroles reset\`
            `,
            guildOnly: true,
            aliases: [],
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const settingOption = new SlashCommandOption()
            .setType("string")
            .setName("setting")
            .setDescription("Can be a setting number.")

        const optOption = new SlashCommandOption()
            .setType("string")
            .setName("opt")
            .setDescription("Can be list/delete/reset or @role.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(optOption)
            .addOption(settingOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const sql = new SQLQuery(message)
        if (!message.channel.isSendable()) return
        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)

        // If not admin, only shows the role list.
        if (!await perms.checkAdmin(true) || args[1] === "list") {
            const selfroles = await sql.fetchColumn("guilds", "self roles")
            const step = 7.0
            const increment = Math.ceil((selfroles ? selfroles.length : 1) / step)
            const selfArray: EmbedBuilder[] = []
            for (let i = 0; i < increment; i++) {
                let settings = ""
                for (let j = 0; j < step; j++) {
                    if (selfroles) {
                        const value = (i*step)+j
                        if (!selfroles) settings = "None"
                        if (!selfroles[value]) break
                        settings += `${value + 1} **=>** ` +  `<@&${selfroles[value]}>\n`
                    } else {
                        settings = "None"
                    }
                }
                const selfEmbed = embeds.createEmbed()
                selfEmbed
                .setTitle(`**Self Role List** ${discord.getEmoji("karenSugoi")}`)
                .setThumbnail(message.guild!.iconURL({extension: "png"})!)
                .setDescription(
                    settings + "\n"
                )
                selfArray.push(selfEmbed)
            }

            if (selfArray.length > 1) {
                embeds.createReactionEmbed(selfArray)
            } else {
                message.channel.send({embeds: [selfArray[0]]})
            }
            return
        }

        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            await selfPrompt(message)
            return
        }

        const selfroles = await sql.fetchColumn("guilds", "self roles")
        const step = 7.0
        let increment = Math.ceil((selfroles ? selfroles.length : 1) / step)
        if (increment === 0) increment = 1
        const selfArray: EmbedBuilder[] = []
        for (let i = 0; i < increment; i++) {
            let settings = ""
            for (let j = 0; j < step; j++) {
                if (selfroles) {
                    const value = (i*step)+j
                    if (!selfroles) settings = "None"
                    if (!selfroles[value]) break
                    settings += `${value + 1} **=>** ` +  `<@&${selfroles[value]}>\n`
                } else {
                    settings = "None"
                }
            }
            const selfEmbed = embeds.createEmbed()
            selfEmbed
            .setTitle(`**Self Roles** ${discord.getEmoji("karenSugoi")}`)
            .setThumbnail(message.guild!.iconURL({extension: "png"})!)
            .setDescription(Functions.multiTrim(`
                Add and remove self-assignable roles. Users can assign them with the command **selfrole**.
                newline
                __Current Settings__
                ${settings}
                newline
                __Edit Settings__
                ${discord.getEmoji("star")}**Mention roles** to add self assignable roles.
                ${discord.getEmoji("star")}Type **delete (setting number)** to remove a role.
                ${discord.getEmoji("star")}Type **reset** to delete all roles.
                ${discord.getEmoji("star")}Type **cancel** to exit.
            `))
            selfArray.push(selfEmbed)
        }

        if (selfArray.length > 1) {
            embeds.createReactionEmbed(selfArray)
        } else {
            this.reply(selfArray[0])
        }

        async function selfPrompt(msg: Message) {
            const responseEmbed = embeds.createEmbed()
            responseEmbed.setTitle(`**Self Roles** ${discord.getEmoji("karenSugoi")}`)
            let selfroles = await sql.fetchColumn("guilds", "self roles")
            if (!selfroles) selfroles = []
            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                discord.send(msg, responseEmbed)
                return
            }
            if (msg.content.toLowerCase() === "reset") {
                await sql.updateColumn("guilds", "self roles", null)
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Self role settings were wiped!`)
                discord.send(msg, responseEmbed)
                return
            }
            if (msg.content.toLowerCase().includes("delete")) {
                const num = Number(msg.content.replace(/delete/gi, "").replace(/\s+/g, ""))
                if (Number.isNaN(num)) return msg.reply("Invalid setting number!")
                if (selfroles ? selfroles[num - 1] : false) {
                    selfroles[num - 1] = ""
                    selfroles = selfroles.filter(Boolean)
                    await sql.updateColumn("guilds", "self roles", selfroles)
                    responseEmbed
                    .setDescription(`${discord.getEmoji("star")}Setting ${num} was deleted!`)
                    discord.send(msg, responseEmbed)
                    return
                } else {
                    responseEmbed
                    .setDescription(`${discord.getEmoji("star")}Setting not found!`)
                    discord.send(msg, responseEmbed)
                    return
                }
            }

            let roles = msg.content.replace(/<@&/g, "").replace(/>/g, "").match(/\s?\d+/g) as string[]
            if (!roles) return message.reply("These roles are invalid!")
            roles = roles.map((r: string) => r.trim())

            let description = ""

            for (let i = 0; i < roles.length; i++) {
                selfroles.push(roles[i])
                description += `${discord.getEmoji("star")}Added <@&${roles[i]}>!\n`
            }

            if (!description) return msg.reply(`No additions were made, canceled ${discord.getEmoji("kannaFacepalm")}`)
            await sql.updateColumn("guilds", "self roles", selfroles)

            responseEmbed
            .setDescription(description)
            discord.send(msg, responseEmbed)
            return

        }

        await embeds.createPrompt(selfPrompt)
    }
}
