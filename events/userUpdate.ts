import {TextChannel, User} from "discord.js"
import {Embeds} from "./../structures/Embeds"
import {Functions} from "./../structures/Functions"
import {Kisaragi} from "./../structures/Kisaragi"
import {SQLQuery} from "./../structures/SQLQuery"

export default class UserUpdate {
    constructor(private readonly discord: Kisaragi) {}

    public run = async (oldUser: User, newUser: User) => {
        const discord = this.discord
        const guilds = discord.guilds.cache.filter((g) => g.members.cache.has(newUser.id)).map((g) => g)

        let [setUsername, setAvatar, setDelete] = [false, false, false]
        if (oldUser.username !== newUser.username) setUsername = true
        if (oldUser.displayAvatarURL() !== newUser.displayAvatarURL()) setAvatar = true
        if (/Deleted User/.test(newUser.username) && !newUser.avatar) setDelete = true

        for (let i = 0; i < guilds.length; i++) {
            const guild = guilds[i]
            const message = await discord.fetchFirstMessage(guild)
            if (!message) return
            const sql = new SQLQuery(message)
            const embeds = new Embeds(discord, message)

            const logUsername = async (oldUser: User, newUser: User) => {
                const memberLog = await sql.fetchColumn("guilds", "member log")
                if (memberLog) {
                    const memberChannel = guild?.channels.cache.get(memberLog)! as TextChannel
                    if (!memberChannel) return
                    const logEmbed = embeds.createEmbed()
                    logEmbed
                    .setAuthor({name: "username", iconURL: "https://cdn.discordapp.com/emojis/623182675355762690.png"})
                    .setTitle(`**Username Change** ${discord.getEmoji("tohruSmug")}`)
                    .setThumbnail(newUser.displayAvatarURL({extension: "png"}) || null)
                    .setDescription(
                        `${discord.getEmoji("star")}_User:_ **<@!${newUser.id}> (${newUser.tag})**\n` +
                        `${discord.getEmoji("star")}_User ID:_ \`${newUser.id}\`\n` +
                        `${discord.getEmoji("star")}_Old Username:_ **${oldUser.username}**\n` +
                        `${discord.getEmoji("star")}_New Username:_ **${newUser.username}**\n`
                    )
                    .setFooter({text: `${guild.name} • ${Functions.formatDate(new Date())}`, iconURL: guild.iconURL({extension: "png"}) ?? ""})
                    await this.discord.channelSend(memberChannel, logEmbed).catch(() => null)
                }
            }
            if (setUsername) logUsername(oldUser, newUser)

            const logAvatar = async (oldUser: User, newUser: User) => {
                const memberLog = await sql.fetchColumn("guilds", "member log")
                if (memberLog) {
                    const memberChannel = guild?.channels.cache.get(memberLog)! as TextChannel
                    if (!memberChannel) return
                    const logEmbed = embeds.createEmbed()
                    logEmbed
                    .setAuthor({name: "profile picture", iconURL: "https://cdn.discordapp.com/emojis/607052423172718607.png"})
                    .setTitle(`**Profile Picture Change** ${discord.getEmoji("kannaXD")}`)
                    .setThumbnail(newUser.displayAvatarURL({extension: "png"}) || null)
                    .setDescription(
                        `${discord.getEmoji("star")}_User:_ **<@!${newUser.id}> (${newUser.username})**\n` +
                        `${discord.getEmoji("star")}_User ID:_ \`${newUser.id}\`\n` +
                        `${discord.getEmoji("star")}_Old Avatar:_ [**Link**](${oldUser.displayAvatarURL({extension: "png"})})\n` +
                        `${discord.getEmoji("star")}_New Avatar:_ [**Link**](${newUser.displayAvatarURL({extension: "png"})})\n`
                    )
                    .setFooter({text: `${guild.name} • ${Functions.formatDate(new Date())}`, iconURL: guild.iconURL({extension: "png"}) ?? ""})
                    await this.discord.channelSend(memberChannel, logEmbed).catch(() => null)
                }
            }
            if (setAvatar) logAvatar(oldUser, newUser)

            const deleteUser = async (userID: string) => {
                await SQLQuery.deleteUser(userID)
            }
            if (setDelete) deleteUser(newUser.id)
        }
    }
}
