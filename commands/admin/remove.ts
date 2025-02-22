import {GuildBasedChannel, GuildEmoji, Message, Role} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Remove extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Removes channels, roles, and emojis.",
            help:
            `
            \`remove channel name/#channel/id reason?\` - Removes a channel by name, mention, or id.
            \`remove role name/@role/id reason?\` - Removes a role by name, mention, or id.
            \`remove emoji emoji/name/id reason?\` - Removes an emoji by emoji, name or id.
            `,
            examples:
            `
            \`=>remove channel #anime-pics\`
            \`=>remove role @weebs\`
            \`=>remove emoji thumbsUp\`
            `,
            aliases: [],
            guildOnly: true,
            cachedGuildOnly: true,
            cooldown: 10,
            subcommandEnabled: true
        })
        const reasonOption = new SlashCommandOption()
            .setType("string")
            .setName("reason")
            .setDescription("Optional reason for removal.")

        const nameOption = new SlashCommandOption()
            .setType("string")
            .setName("name")
            .setDescription("Name or id.")

        const typeOption = new SlashCommandOption()
            .setType("string")
            .setName("type")
            .setDescription("Can be channel/role/emoji.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(typeOption)
            .addOption(nameOption)
            .addOption(reasonOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const embeds = new Embeds(discord, message)
        if (!await perms.checkAdmin()) return
        if (!args[1]) return this.reply(`You need to specify whether you are removing a **channel**, **role**, or **emoji** ${discord.getEmoji("kannaCurious")}`)

        if (args[1] === "channel") {
            if (!args[2]) return this.reply(`You must specify a channel name or id.`)
            const reason = Functions.combineArgs(args, 3) ? Functions.combineArgs(args, 3).trim() : "None provided!"
            let channel: GuildBasedChannel | undefined
            if (args[2].match(/\d{17,}/)) {
                channel = message.guild?.channels.cache.find((c) => c.id === args[2].match(/\d{17,}/)![0])
            } else {
                channel = message.guild?.channels.cache.find((c) => c.name.toLowerCase().includes(args[2].toLowerCase()))
            }
            if (!channel) return this.reply(`Could not find this channel!`)
            const channelName = channel.name
            try {
                await channel.delete(reason)
                const removeEmbed = embeds.createEmbed()
                removeEmbed
                .setAuthor({name: "remove", iconURL: "https://kisaragi.moe/assets/embed/remove.png"})
                .setTitle(`**Channel Deletion** ${discord.getEmoji("tohruThumbsUp")}`)
                .setDescription(`The channel **#${channelName}** was deleted for reason: **${reason}**`)
                return this.reply(removeEmbed)
            } catch {
                return this.reply("Could not delete this channel, I need the **Manage Channels** permission.")
            }

        }

        if (args[1] === "role") {
            if (!args[2]) return this.reply(`You must specify a role name or id.`)
            const reason = Functions.combineArgs(args, 3) ? Functions.combineArgs(args, 3).trim() : "None provided!"
            let role: Role | undefined
            if (args[2].match(/\d{17,}/)) {
                role = message.guild?.roles.cache.find((r) => r.id === args[2].match(/\d{17,}/)![0])
            } else {
                role = message.guild?.roles.cache.find((r) => r.name.toLowerCase().includes(args[2].toLowerCase().replace(/_/g, " ").replace(/-/g, " ")))
            }
            if (!role) return this.reply(`Could not find a role!`)
            const roleName = role.name
            try {
                await role.delete(reason)
                const removeEmbed = embeds.createEmbed()
                removeEmbed
                .setAuthor({name: "remove", iconURL: "https://kisaragi.moe/assets/embed/remove.png"})
                .setTitle(`**Role Deletion** ${discord.getEmoji("tohruThumbsUp")}`)
                .setDescription(`The role **${roleName}** was deleted for reason: **${reason}**`)
                return this.reply(removeEmbed)
            } catch {
                return this.reply("Could not delete this role, I need the **Manage Roles** permission.")
            }
        }

        if (args[1] === "emoji") {
            if (!args[2]) return this.reply(`You must specify an emoji name or id.`)
            const reason = Functions.combineArgs(args, 3) ? Functions.combineArgs(args, 3).trim() : "None provided!"
            let emoji: GuildEmoji | undefined
            if (args[2].match(/\d{17,}/)) {
                emoji = message.guild?.emojis.cache.find((e) => e.id === args[2].match(/\d{17,}/)![0])
            } else {
                emoji = message.guild?.emojis.cache.find((e) => e.name?.toLowerCase().includes(args[2].toLowerCase()))
            }
            if (!emoji) return this.reply(`Could not find this emoji!`)
            const emojiName = emoji.name
            try {
                await emoji.delete(reason)
                const removeEmbed = embeds.createEmbed()
                removeEmbed
                .setAuthor({name: "remove", iconURL: "https://kisaragi.moe/assets/embed/remove.png"})
                .setTitle(`**Emoji Deletion** ${discord.getEmoji("tohruThumbsUp")}`)
                .setDescription(`The emoji **${emojiName}** was deleted for reason: **${reason}**`)
                return this.reply(removeEmbed)
            } catch {
                return this.reply("Could not delete this emoji, I need the **Manage Emojis** permission.")
            }
        }
    }
}
