import {GuildMember, Message, EmbedBuilder, Role} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Warns extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Lists all warns.",
            help:
            `
            \`warns\` - Displays all warns.
            \`warns @user\` - Gets the warns of the user.
            \`warns @user edit num new warning\` - Edits a warning.
            \`warns @user num\` - Deletes a specific warning.
            \`warns @user delete\` - Deletes all warns.
            \`warns destroy\` - Deletes all warns for every member (no undo).
            `,
            examples:
            `
            \`=>warns\`
            \`=>warns @user\`
            \`=>warns destroy\`
            `,
            guildOnly: true,
            aliases: [],
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const warningOption = new SlashCommandOption()
            .setType("string")
            .setName("warning")
            .setDescription("The new warning in the edit subcommand.")

        const num2Option = new SlashCommandOption()
            .setType("string")
            .setName("num2")
            .setDescription("The num in the edit subcommand.")

        const numOption = new SlashCommandOption()
            .setType("string")
            .setName("num")
            .setDescription("Can be a number or edit/delete.")

        const userOption = new SlashCommandOption()
            .setType("string")
            .setName("user")
            .setDescription("Can be a user or destroy.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(userOption)
            .addOption(numOption)
            .addOption(num2Option)
            .addOption(warningOption)
    }

    public deleteCase = async (hash: string) => {
        const sql = new SQLQuery(this.message)
        let cases = await sql.fetchColumn("guilds", "cases")
        if (!cases) return
        cases = cases.map((c: any) => JSON.parse(c))
        cases = cases.filter((c: any) => c.type === "warn")
        for (let i = 0; i < cases.length; i++) {
            if (cases[i].hash === hash) {
                cases[i] = ""
                cases = cases.filter(Boolean)
                break
            }
        }
        await sql.updateColumn("guilds", "cases", cases)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const sql = new SQLQuery(message)
        const self = this
        if (!await perms.checkMod()) return
        if (!message.channel.isSendable()) return
        const loading = message.channel.lastMessage
        if (message instanceof Message) loading?.delete()
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            await warnPrompt(message)
            return
        }

        const warnArray: EmbedBuilder[] = []
        let warnings = ""
        let warnLog = await sql.fetchColumn("guilds", "warn log")
        if (!warnLog) warnLog = []
        for (let i = 0; i < warnLog.length; i++) {
            warnLog[i] = JSON.parse(warnLog[i])
            if (warnLog.length === 0) {
                warnings = "None"
            } else {
                for (let j = 0; j < warnLog[i].warns.length; j++) {
                    warnings += `**${j + 1} => **\n` +
                    `_Date:_ \`${Functions.formatDate(warnLog[i].warns[j].date)}\`\n` +
                    `_Moderator:_ ${warnLog[i].warns[j].executorTag}\n` +
                    `_Reason:_ ${warnLog[i].warns[j].reason}\n`
                }
            }
            const warnEmbed = embeds.createEmbed()
            const member = message.guild?.members.cache.find((m: GuildMember) => m.id === warnLog[i].user)
            warnEmbed
            .setTitle(`**Warn Log** ${discord.getEmoji("kaosWTF")}`)
            .setThumbnail(message.guild!.iconURL({extension: "png"}) as string)
            .setDescription(
                `**${member ? `${member.displayName}'s` : "No"} Warns**\n` +
                "__Warns__\n" +
                warnings + "\n" +
                "__Edit Settings__\n" +
                `${discord.getEmoji("star")}**Mention a user** to retrieve their warns.\n` +
                `${discord.getEmoji("star")}**Mention a user and type a number** to remove that warn.\n` +
                `${discord.getEmoji("star")}**Mention a user and type delete** to delete all warns.\n` +
                `${discord.getEmoji("star")}**Mention a user and type edit** to edit a warning.\n` +
                `${discord.getEmoji("star")}Type **destroy** to delete all warns for every member (no undo).\n` +
                `${discord.getEmoji("star")}Type **cancel** to exit.\n`
            )
            warnArray.push(warnEmbed)
        }

        if (warnArray.length > 1) {
            embeds.createReactionEmbed(warnArray)
        } else {
            this.reply(warnArray[0])
        }

        async function warnPrompt(msg: Message) {
            const responseEmbed = embeds.createEmbed()
            responseEmbed.setTitle(`**Warn Log** ${discord.getEmoji("kaosWTF")}`)
            const warnOne = await sql.fetchColumn("guilds", "warn one")
            const warnTwo = await sql.fetchColumn("guilds", "warn two")
            let [setUser, setDelete, setPurge] = [false, false, false]

            if (msg.content.toLowerCase() === "destroy") {
                for (let i = 0; i < warnLog.length; i++) {
                    for (let j = 0; j < warnLog[i].warns.length; j++) {
                        await self.deleteCase(warnLog[i].warns[j].hash)
                    }
                }
                await sql.updateColumn("guilds", "warn log", null)
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}All warns were destroyed!`)
                return discord.send(msg, responseEmbed)
            }

            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                return discord.send(msg, responseEmbed)
            }

            const userID = msg.content.match(/\d{15,}/g)?.[0] ?? ""
            const member = message.guild?.members.cache.find((m: GuildMember) => m.id === userID) as GuildMember

            if (msg.content.toLowerCase().includes("edit")) {
                const newMsg = msg.content.replace(/edit/g, "").replace(userID, "").replace(/<@!?/, "").replace(/>/, "").trim().split(" ")
                const tempMsg = newMsg.slice(1).join(" ")
                const num = Number(newMsg[0]) - 1
                if (!member) return message.reply(`Invalid user ${discord.getEmoji("kannaFacepalm")}`)
                if (tempMsg) {
                    let found = false
                    for (let i = 0; i < warnLog.length; i++) {
                        if (warnLog[i].user === member.id) {
                            warnLog[i].warns[num].reason = tempMsg
                            await sql.updateColumn("guilds", "warn log", warnLog)
                            found = true
                        }
                    }
                    if (!found) return msg.reply("That user does not have any warns!")
                    responseEmbed.setDescription(`Edited warn **#${num+1}** for <@${member.id}>!`)
                    return discord.send(msg, responseEmbed)
                } else {
                    return discord.send(msg, responseEmbed.setDescription("No warning found!"))
                }
            }

            let warnOneRole, warnTwoRole
            if (warnOne) warnOneRole = message.guild!.roles.cache.find((r: Role) => r.id === warnOne)
            if (warnTwo) warnTwoRole = message.guild!.roles.cache.find((r: Role) => r.id === warnTwo)

            if (member && !msg.content.replace(/\d{15,}/g, "").match(/\s+\d/g)) setUser = true
            if (member && msg.content.replace(/\d{15,}/g, "").match(/\s+\d/g)) setDelete = true
            if (member && msg.content.match(/delete/gi)) setPurge = true

            if (setPurge) {
                let found = false
                for (let i = 0; i < warnLog.length; i++) {
                    if (warnLog[i].user === member.id) {
                        for (let j = 0; j < warnLog[i].warns.length; j++) {
                            await self.deleteCase(warnLog[i].warns[j].hash)
                        }
                        warnLog[i].warns = []
                        await sql.updateColumn("guilds", "warn log", warnLog)
                        found = true
                        if (warnLog[i].warns.length < 1) {
                            if (warnOneRole) {
                                if (member.roles.cache.has(warnOneRole.id)) {
                                    await member.roles.remove(warnOneRole)
                                    await self.send(`<@${userID}>, you were removed from the ${warnOneRole} role because you do not have any warns.`)
                                }
                            }
                        }
                        if (warnLog[i].warns.length < 2) {
                            if (warnTwoRole) {
                                if (member.roles.cache.has(warnTwoRole.id)) {
                                    await member.roles.remove(warnTwoRole)
                                    await self.send(`<@${userID}>, you were removed from the ${warnTwoRole} role because you do not have two warns.`)
                                }
                            }
                        }
                    }
                }
                if (!found) return msg.reply("That user does not have any warns!")
                responseEmbed.setDescription(`Purged all warns from <@${member.id}>!`)
                return discord.send(msg, responseEmbed)
            }
            if (setUser) {
                let warns = ""
                let found = false
                for (let i = 0; i < warnLog.length; i++) {
                    if (warnLog[i].user === member.id) {
                        for (let j = 0; j < warnLog[i].warns.length; j++) {
                            warns += `**${j + 1} => **\n` +
                            `_Date:_ \`${Functions.formatDate(warnLog[i].warns[j].date)}\`\n` +
                            `_Moderator:_ ${warnLog[i].warns[j].executorTag}\n` +
                            `_Reason:_ ${warnLog[i].warns[j].reason}\n`
                        }
                        found = true
                    }
                }
                if (!found) return msg.reply("That user does not have any warns!")
                responseEmbed
                .setDescription(
                    `**${member.displayName}'s Warns**\n` +
                    warns + "\n"
                )
                return discord.send(msg, responseEmbed)
            }
            if (setDelete) {
                let num: number = Number(msg.content.replace(/(?<=<@)(.*?)(?=>)/g, "").match(/\s+\d/g)![0])
                num = num - 1
                let found = false
                for (let i = 0; i < warnLog.length; i++) {
                    if (warnLog[i].user === member.id) {
                        if (warnLog[i].warns.length < num + 1) return msg.reply("Could not find that warning!")
                        await self.deleteCase(warnLog[i].warns[num].hash)
                        warnLog[i].warns[num] = ""
                        warnLog[i].warns = warnLog[i].warns.filter(Boolean)
                        await sql.updateColumn("guilds", "warn log", warnLog)
                        found = true
                        if (warnLog[i].warns.length < 1) {
                            if (warnOneRole) {
                                if (member.roles.cache.has(warnOneRole.id)) {
                                    await member.roles.remove(warnOneRole)
                                    await self.send(`<@${userID}>, you were removed from the ${warnOneRole} role because you do not have any warns.`)
                                }
                            }
                        }
                        if (warnLog[i].warns.length < 2) {
                            if (warnTwoRole) {
                                if (member.roles.cache.has(warnTwoRole.id)) {
                                    await member.roles.remove(warnTwoRole)
                                    await self.send(`<@${userID}>, you were removed from the ${warnTwoRole} role because you do not have two warns.`)
                                }
                            }
                        }
                    }
                }
                if (!found) return msg.reply("That user does not have any warns!")
                responseEmbed.setDescription(`Deleted warn **${num + 1}** from <@${member.id}>!`)
                return discord.send(msg, responseEmbed)
            }
        }
        await embeds.createPrompt(warnPrompt)
    }
}
