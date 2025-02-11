import {ReadonlyCollection, Snowflake, Message, PartialMessage, GuildTextBasedChannel, TextChannel, AuditLogEvent} from "discord.js"
import {Embeds} from "./../structures/Embeds"
import {Functions} from "./../structures/Functions"
import {Kisaragi} from "./../structures/Kisaragi"
import {SQLQuery} from "./../structures/SQLQuery"

export default class MessageDeleteBulk {
    constructor(private readonly discord: Kisaragi) {}

    public run = async (messages:  ReadonlyCollection<Snowflake, Message| PartialMessage>, channel: GuildTextBasedChannel) => {
        const discord = this.discord
        const message = channel.lastMessage as Message
        if (!message) return
        const sql = new SQLQuery(message)
        const embeds = new Embeds(discord, message)
        if (message.author?.bot) return
        if (message.author.id === discord.user!.id) return

        const logDeleted = async (messages: (Message | PartialMessage)[]) => {
            const messageLog = await sql.fetchColumn("guilds", "message log")
            if (messageLog) {
                const logs = await message.guild?.fetchAuditLogs({type: AuditLogEvent.MessageBulkDelete, limit: 1}).then((l) => l.entries.first())
                let executor = ""
                if (logs?.createdTimestamp && logs?.createdTimestamp > Date.now() - 1000) {
                    if (logs.executor?.id === discord.user!.id) {
                        return
                    } else {
                        executor = `${discord.getEmoji("star")}_Deleter:_ **<@!${logs.executor?.id}> (${logs.executor?.username})**\n` +
                        `${discord.getEmoji("star")}_Deleter ID:_ \`${logs.executor?.id}\`\n`
                    }
                }
                const count = message.author.id === discord.user!.id ? messages.length - 2 : messages.length
                const msgChannel = message.guild?.channels.cache.get(messageLog)! as TextChannel
                const logEmbed =  embeds.createEmbed()
                const content = message.content ? `${discord.getEmoji("star")}_First Message Content:_ ${message.content}` : ""
                const image = message.attachments?.first()?.url ? message.attachments.first()!.proxyURL : ""
                const attachments = message.attachments.size > 1 ? "\n" + message.attachments.map((a) => `[**Link**](${a.proxyURL})`).join("\n") : ""
                const imageText = image ? `\n_Image might be already deleted. Link_ [**here**](${image})` : ""
                logEmbed
                .setAuthor({name: `${message.author.tag} (${message.author.id})`, iconURL: this.discord.displayAvatar(message)})
                .setTitle(`**Messages Bulk Deleted** ${discord.getEmoji("tohruSmug")}`)
                .setImage(image || null)
                .setDescription(
                    `${discord.getEmoji("star")}_Count:_ **${count}**\n` +
                    executor + content + imageText + attachments
                )
                .setFooter({text: `#${(message.channel as TextChannel).name} • ${Functions.formatDate(message.createdAt)}`})
                await this.discord.channelSend(msgChannel, logEmbed).catch(() => null)
            }
        }
        logDeleted(messages.map((m) => m))
    }
}
