import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import Ascii from "fold-to-ascii"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Mod extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Configures moderation settings for the server.",
            help:
            `
            \`mod\` - Configure settings
            \`mod @role/id\` - Set the admin role.
            \`mod !@role/id!\` - Set the mod role.
            \`mod #@role/id#\` - Sets the mute role.
            \`mod $@role/id$\` - Sets the restricted role.
            \`mod (@role/id)\` - Sets the warn one role.
            \`mod [@role/id]\` - Sets the warn two role.
            \`mod none/mute/kick/ban\` - Sets the warn penalty.
            \`mod num\` - Sets the warn threshold.
            \`mod ascii\` - Toggles the removal of non-ascii characters in names.
            `,
            examples:
            `
            \`=>mod @role !@role! #@role# $@role$\`
            `,
            aliases: ["moderation"],
            guildOnly: true,
            cachedGuildOnly: true,
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const optOption = new SlashCommandOption()
            .setType("string")
            .setName("opt")
            .setDescription("Check help for all settings.")
            
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
        if (!message.channel.isSendable()) return
        if (!message.member?.permissions.has("Administrator") || message.author.id !== message.guild?.ownerId) return this.reply(`You must have the **Administrator** permission or be the owner of this guild in order to use this command. ${discord.getEmoji("sagiriBleh")}`)
        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            return modPrompt(message)
        }

        const ascii = await sql.fetchColumn("guilds", "ascii name toggle")
        const mute = await sql.fetchColumn("guilds", "mute role")
        const restrict = await sql.fetchColumn("guilds", "restricted role")
        const warnOne = await sql.fetchColumn("guilds", "warn one")
        const warnTwo = await sql.fetchColumn("guilds", "warn two")
        const admin = await sql.fetchColumn("guilds", "admin role")
        const mod = await sql.fetchColumn("guilds", "mod role")
        const warnPen = await sql.fetchColumn("guilds", "warn penalty")
        const warnThresh = await sql.fetchColumn("guilds", "warn threshold")

        const modEmbed = embeds.createEmbed()
        modEmbed
        .setTitle(`**Moderator Settings** ${discord.getEmoji("karenAnger")}`)
        .setThumbnail(message.guild!.iconURL({extension: "png"})!)
        .setDescription(Functions.multiTrim(`
            Edit moderation settings for the server.
            newline
            **Mute Role** - Create a role and disable speaking permissions for every channel.
            **Restricted Role** - Can be any role with restricted permissions.
            **Warn Threshold** - How many warnings will trigger the punishment.
            **Warn Penalty** - The punishment after hitting the warn threshold.
            **Ascii Names** - Removes all non-ascii characters in usernames.
            newline
            __Current Settings__
            ${discord.getEmoji("star")}Admin role: ${admin ? `<@&${admin}>` : "None"}
            ${discord.getEmoji("star")}Mod role: ${mod ? `<@&${mod}>` : "None"}
            ${discord.getEmoji("star")}Mute role: ${mute ?  `<@&${mute}>` : "None"}
            ${discord.getEmoji("star")}Restricted role: ${restrict ?  `<@&${restrict}>` : "None"}
            ${discord.getEmoji("star")}Warn One role: ${warnOne ? `<@&${warnOne}>` : "None"}
            ${discord.getEmoji("star")}Warn Two role: ${warnTwo ? `<@&${warnTwo}>` : "None"}
            ${discord.getEmoji("star")}Warn Threshold: **${warnThresh}**
            ${discord.getEmoji("star")}Warn Penalty: ${warnPen ? `**${warnPen}**` :  "None"}
            ${discord.getEmoji("star")}Ascii names are ${ascii ? `**${ascii}**` : "None"}
            newline
            __Edit Settings__
            ${discord.getEmoji("star")}Type **ascii** to toggle ascii names on/off.
            ${discord.getEmoji("star")}Type **any number** to set the warning threshold.
            ${discord.getEmoji("star")}Type **ban**, **kick**, **mute**, or **none** to set the warn penalty.
            ${discord.getEmoji("star")}**Mention a role or type a role id** to set the admin role.
            ${discord.getEmoji("star")}Do the same **between exclamation points !role!** to set the mod role.
            ${discord.getEmoji("star")}Do the same **between hashtags #role#** to set the mute role.
            ${discord.getEmoji("star")}Do the same **between dollar signs $role$** to set the restricted role.
            ${discord.getEmoji("star")}Do the same **between parentheses (role)** to set the role for warn one.
            ${discord.getEmoji("star")}Do the same **between brackets [role]** to set the role for warn two.
            ${discord.getEmoji("star")}**Type multiple settings** to set them at once.
            ${discord.getEmoji("star")}Type **reset** to reset settings.
            ${discord.getEmoji("star")}Type **cancel** to exit.
        `))

        this.reply(modEmbed)

        async function modPrompt(msg: Message) {
            const ascii = await sql.fetchColumn("guilds", "ascii name toggle")
            const responseEmbed = embeds.createEmbed()
            responseEmbed.setTitle(`**Moderator Settings** ${discord.getEmoji("karenAnger")}`)
            let [setAscii, setMute, setRestrict, setWarnOne, setWarnTwo, setWarnPenalty, setWarnThreshold, setAdmin, setMod] = [] as boolean[]
            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                return discord.send(msg, responseEmbed)
            }
            if (msg.content.toLowerCase() === "reset") {
                await sql.updateColumn("guilds", "ascii name toggle", "off")
                await sql.updateColumn("guilds", "mute role", null)
                await sql.updateColumn("guilds", "restricted role", null)
                await sql.updateColumn("guilds", "warn one", null)
                await sql.updateColumn("guilds", "warn one", null)
                await sql.updateColumn("guilds", "warn penalty", "none")
                await sql.updateColumn("guilds", "warn threshold", null)
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}All settings were reset!`)
                return discord.send(msg, responseEmbed)
            }
            const newMsg = msg.content.replace(/<@&/g, "").replace(/>/g, "")
            const adminRole = newMsg.replace(/\s+\d\s+/, "").replace(/\s+/g, "").replace(/(?<=\$)(.*?)(?=\$)/g, "").replace(/(?<=\()(.*?)(?=\))/g, "")
            .replace(/(?<=!)(.*?)(?=!)/g, "").replace(/(?<=#)(.*?)(?=#)/g, "").replace(/(?<=\[)(.*?)(?=\])/g, "").match(/\d+/g)
            const modRole = newMsg.replace(/\s+/g, "").match(/(?<=!)(.*?)(?=!)/g)
            const muteRole = newMsg.replace(/\s+/g, "").match(/(?<=#)(.*?)(?=#)/g)
            const restrictRole = newMsg.replace(/\s+/g, "").match(/(?<=\$)(.*?)(?=\$)/g)
            const warnOneRole = newMsg.replace(/\s+/g, "").match(/(?<=\()(.*?)(?=\))/g)
            const warnTwoRole = newMsg.replace(/\s+/g, "").match(/(?<=\[)(.*?)(?=\])/g)
            const warnPenalty = newMsg.match(/ban/gi) || newMsg.match(/kick/gi) || newMsg.match(/mute/gi) || newMsg.match(/none/gi)
            const warnThreshold = newMsg.match(/\s\d\s+/)
            if (msg.content.match(/ascii/gi)) setAscii = true
            if (adminRole) setAdmin = true
            if (modRole) setMod = true
            if (muteRole) setMute = true
            if (restrictRole) setRestrict = true
            if (warnOneRole) setWarnOne = true
            if (warnTwoRole) setWarnTwo = true
            if (warnPenalty) setWarnPenalty = true
            if (warnThreshold) setWarnThreshold = true

            let description = ""

            if (setAscii) {
                if (String(ascii) === "off") {
                    await sql.updateColumn("guilds", "ascii name toggle", "on")
                    description += `${discord.getEmoji("star")}Ascii names are **on**!\n`
                    const members = message.guild!.members.cache.map((m) => m)
                    for (let i = 0; i < members.length; i++) {
                        if (members[i].displayName.match(/[^\x00-\x7F]/g)) {
                            let newName = Ascii.foldReplacing(members[i].displayName).trim()
                            if (!newName) newName = "User"
                            await members[i].setNickname(newName, "Non-ascii characters in name").catch(() => null)
                        }
                    }
                } else {
                    await sql.updateColumn("guilds", "ascii name toggle", "off")
                    description += `${discord.getEmoji("star")}Ascii names are **off**!\n`
                }
            }

            if (setAdmin) {
                await sql.updateColumn("guilds", "admin role", String(adminRole!))
                description += `${discord.getEmoji("star")}Admin role set to <@&${adminRole!}>!\n`
            }

            if (setMod) {
                await sql.updateColumn("guilds", "mod role", String(modRole!))
                description += `${discord.getEmoji("star")}Mod role set to <@&${modRole!}>!\n`
            }

            if (setMute) {
                await sql.updateColumn("guilds", "mute role", String(muteRole!))
                description += `${discord.getEmoji("star")}Mute role set to <@&${muteRole!}>!\n`
            }

            if (setRestrict) {
                await sql.updateColumn("guilds", "restricted role", String(restrictRole!))
                description += `${discord.getEmoji("star")}Restricted role set to <@&${restrictRole!}>!\n`
            }

            if (setWarnOne) {
                await sql.updateColumn("guilds", "warn one", String(warnOneRole!))
                description += `${discord.getEmoji("star")}Warn one role set to <@&${warnOneRole!}>!\n`
            }

            if (setWarnTwo) {
                await sql.updateColumn("guilds", "warn two", String(warnTwoRole!))
                description += `${discord.getEmoji("star")}Warn two role set to <@&${warnTwoRole!}>!\n`
            }

            if (setWarnThreshold) {
                await sql.updateColumn("guilds", "warn threshold", String(warnThreshold!))
                description += `${discord.getEmoji("star")}Warn threshold set to **${warnThreshold!}**!\n`
            }

            if (setWarnPenalty) {
                await sql.updateColumn("guilds", "warn penalty", String(warnPenalty!))
                description += `${discord.getEmoji("star")}Warn penalty set to **${warnPenalty!}**!\n`
            }

            if (!description) description = `${discord.getEmoji("star")}No additions were made, canceled ${discord.getEmoji("kannaFacepalm")}`
            responseEmbed
            .setDescription(description)
            return discord.send(msg, responseEmbed)
        }

        await embeds.createPrompt(modPrompt)
    }
}
