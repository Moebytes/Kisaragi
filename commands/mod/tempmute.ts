import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class TempMute extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Mutes a user for the specified period.",
            help:
            `
            _Note: Time is in \`0y 0mo 0w 0d 0h 0m 0s\` format._
            \`tempmute @user1 @user2 time reason?\` - tempmutes the user(s) with an optional reason
            \`tempmute id1 id2 time reason?\` - tempmutes by user id instead of mention
            `,
            examples:
            `
            \`=>tempmute @user 10m\`
            `,
            guildOnly: true,
            aliases: [],
            cooldown: 3,
            subcommandEnabled: true
        })
        const reasonOption = new SlashCommandOption()
            .setType("string")
            .setName("reason")
            .setDescription("The temp mute reason.")

        const timeOption = new SlashCommandOption()
            .setType("string")
            .setName("time")
            .setDescription("Time in 0y 0mo 0w 0d 0h 0m 0s format.")
            .setRequired(true)

        const userOption = new SlashCommandOption()
            .setType("user")
            .setName("user")
            .setDescription("The user to temp mute.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(userOption)
            .addOption(timeOption)
            .addOption(reasonOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const sql = new SQLQuery(message)
        if (!await perms.checkMod()) return
        const tempMuteEmbed = embeds.createEmbed()
        const mute = await sql.fetchColumn("guilds", "mute role")
        if (!mute) return this.reply("You need to set a mute role first!")
        const reasonArray: string[] = []
        const timeArray: string[] = []
        const userArray: string[] = []

        for (let i = 1; i < args.length; i++) {
            if (args[i].match(/\d{10,}/g)) {
                userArray.push(args[i].match(/\d{10,}/g)![0])
            } else {
                if (/\d+(y|mo|w|d|h|m|s)/gi.test(args[i])) {
                    timeArray.push(args[i])
                } else {
                    reasonArray.push(args[i])
                }
            }
        }
        if (!timeArray[0]) return this.reply(`You must provide a time limit ${discord.getEmoji("kannaFacepalm")}`)
        const rawTime = timeArray.join(" ")
        const seconds = Functions.parseCalenderSeconds(rawTime)

        const reason = reasonArray.join("") ? reasonArray.join(" ") : "None provided!"

        const members: string[] = []
        for (let i = 0; i < userArray.length; i++) {
            const member = message.guild?.members.cache.get(userArray[i])
            if (member) {
                members.push(`<@${member.id}>`)
            } else {
                continue
            }
            tempMuteEmbed
            .setAuthor({name: "tempmute", iconURL: "https://kisaragi.moe/assets/embed/tempmute.png"})
            .setTitle(`**You Were Temp Muted** ${discord.getEmoji("sagiriBleh")}`)
            .setDescription(`${discord.getEmoji("star")}_You were temp muted from **${message.guild!.name}** for **${rawTime}**, reason:_ **${reason}**`)
            const id = member.id
            try {
                await member.roles.add(mute).catch(() => null)
                const data = {type: "tempmute", user: member.id, executor: message.author.id, date: Date.now(), guild: message.guild?.id, reason, time: rawTime, context: message.url}
                discord.emit("caseUpdate", data)
                let tempArr = await SQLQuery.redisGet(`${message.guild?.id}_tempmute`)
                tempArr = JSON.parse(tempArr)
                if (!tempArr) tempArr = [] as any
                tempArr.push({member: id, time: seconds*1000, reason})
                await SQLQuery.redisSet(`${message.guild?.id}_tempmute`, JSON.stringify(tempArr))
                setInterval(async () => {
                    let newArr = await SQLQuery.redisGet(`${message.guild?.id}_tempmute`)
                    newArr = JSON.parse(newArr)
                    if (!newArr) return
                    const index = newArr.findIndex((i: any) => i.member === id)
                    if (index === -1) return
                    const curr = newArr[index]
                    const time = Number(curr.time)-60000
                    if (time <= 0) {
                        await member.roles.remove(mute).catch(() => null)
                        newArr[index] = null
                        newArr = newArr.filter(Boolean)?.[0] ?? null
                        await SQLQuery.redisSet(`${this.message.guild?.id}_tempmute`, newArr)
                        // @ts-expect-error
                        clearInterval()
                        return
                    }
                    newArr[index] = {...curr, time}
                    await SQLQuery.redisSet(`${message.guild?.id}_tempmute`, JSON.stringify(newArr))
                }, 60000)
                setTimeout(async () => {
                    await member.roles.remove(mute).catch(() => null)
                    const index = tempArr.findIndex((i: any) => i.member === id)
                    if (index === -1) return
                    tempArr[index] = null
                    tempArr = tempArr.filter(Boolean)?.[0] ?? null
                    await SQLQuery.redisSet(`${this.message.guild?.id}_tempmute`, tempArr)
                }, seconds*1000)
            } catch (e) {
                console.log(e)
                return this.reply(`I need the **Manage Roles** permission ${discord.getEmoji("kannaFacepalm")}`)
            }
            const dm = await member.createDM().catch(() => null)
            if (dm) await discord.channelSend(dm, tempMuteEmbed).catch(() => null)
        }
        if (!members[0]) return this.reply(`Invalid users ${discord.getEmoji("kannaFacepalm")}`)
        tempMuteEmbed
        .setAuthor({name: "tempmute", iconURL: "https://kisaragi.moe/assets/embed/tempmute.png"})
        .setTitle(`**Member Temp Muted** ${discord.getEmoji("sagiriBleh")}`)
        .setDescription(`${discord.getEmoji("star")}_Successfully temp muted ${members.join(", ")} for the duration **${rawTime}** for reason:_ **${reason}**`)
        return this.reply(tempMuteEmbed)
    }
}
