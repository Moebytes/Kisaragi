import {Message, PartialMessage, AuditLogEvent, TextChannel} from "discord.js"
import {Embeds} from "./../structures/Embeds"
import {Functions} from "./../structures/Functions"
import {Kisaragi} from "./../structures/Kisaragi"
import {SQLQuery} from "./../structures/SQLQuery"

export default class MessageDelete {
    constructor(private readonly discord: Kisaragi) {}

    public run = async (message: Message | PartialMessage) => {
        const discord = this.discord
        const sql = new SQLQuery(message as any)
        const embeds = new Embeds(discord, message as any)
        if (message.author?.bot) return
        if (message.author?.id === discord.user!.id) return

        const logDeleted = async (message: Message | PartialMessage) => {
            const messageLog = await sql.fetchColumn("guilds", "message log")
            const prefix = await SQLQuery.fetchPrefix(message as any)
            if (messageLog) {
                const content = message.content ? message.content : ""
                if (content.startsWith(prefix)) return
                const image = message.attachments.first() ? message.attachments.first()!.proxyURL : ""
                if (!content && !image) return
                const logs = await message.guild?.fetchAuditLogs({type: AuditLogEvent.MessageDelete, limit: 1}).then((l) => l.entries.first())
                let executor = ""
                if (logs?.createdTimestamp && logs?.createdTimestamp > Date.now() - 1000) {
                    if (logs.executor?.id === discord.user!.id && !/discord/gi.test(message?.content || "")) {
                        return
                    } else {
                        executor = `${discord.getEmoji("star")}_Deleter:_ **<@!${logs.executor?.id}> (${logs.executor?.username})**\n` +
                        `${discord.getEmoji("star")}_Deleter ID:_ \`${logs.executor?.id}\`\n`
                    }
                }
                const msgChannel = message.guild?.channels.cache.get(messageLog)! as TextChannel
                const logEmbed =  embeds.createEmbed()
                const attachments = message.attachments.size > 1 ? "\n" + message.attachments.map((a) => `[**Link**](${a.proxyURL})`).join("\n") : ""
                const imageText = image ? `\n_Image might be already deleted. Link_ [**here**](${image})` : ""
                logEmbed
                .setAuthor({name: `${message.author?.tag} (${message.author?.id})`, iconURL: this.discord.displayAvatar(message as any)})
                .setTitle(`**Message Deleted** ${discord.getEmoji("chinoSmug")}`)
                .setImage(image)
                .setDescription(executor + content + imageText + attachments)
                .setFooter({text: `#${(message.channel as TextChannel).name} • ${Functions.formatDate(message.createdAt)}`})
                await this.discord.channelSend(msgChannel, logEmbed).catch(() => null)
            }
        }
        logDeleted(message)
    }
}
