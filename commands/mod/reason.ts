import {Message, EmbedBuilder, TextChannel} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Reason extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Edits the reason of a case.",
          help:
          `
          \`reason case reason?\` - Changes the reason
          `,
          examples:
          `
          \`=>reason 3 being bad\`
          `,
          guildOnly: true,
          aliases: [],
          cooldown: 5,
          subcommandEnabled: true
        })
        const reasonOption = new SlashCommandOption()
            .setType("string")
            .setName("reason")
            .setDescription("The new reason.")

        const caseOption = new SlashCommandOption()
            .setType("integer")
            .setName("case")
            .setDescription("The case number.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(caseOption)
            .addOption(reasonOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const sql = new SQLQuery(message)
        if (!await perms.checkMod()) return

        const caseNumber = Number(args[1])
        if (!caseNumber) return this.reply(`You need to specify a case number ${discord.getEmoji("kannaFacepalm")}`)
        let reason = Functions.combineArgs(args, 2).trim()
        if (!reason) reason = "None provided!"
        let cases = await sql.fetchColumn("guilds", "cases")
        cases = cases.map((c: any) => JSON.parse(c))
        if (!cases) return this.reply(`This server has no cases. You need to enable **mod log** in \`logs\` to record them. ${discord.getEmoji("kannaFacepalm")}`)
        const index = cases.findIndex((c: any) => Number(c.case) === caseNumber)
        if (index === -1) return this.reply(`Invalid case number ${discord.getEmoji("kannaFacepalm")}`)

        cases[index].reason = reason
        await sql.updateColumn("guilds", "cases", cases)

        const msg = await discord.fetchMessage(message, cases[index].message)

        if (msg) {
            const embed = msg.embeds[0]
            let channelName = ""
            let context = ""
            const user = await discord.users.fetch(cases[index].user)
            const executor = await discord.users.fetch(cases[index].executor)
            if (cases[index].context) {
                const {channelID} = discord.parseMessageURL(cases[index].context)
                channelName = "#" + ((discord.channels.cache.get(channelID) as TextChannel)?.name ?? "")
                context = `[**Context**](${cases[index].context})`
            }
            EmbedBuilder.from(embed)
            .setDescription(
                `${discord.getEmoji("star")}_User:_ **${user.tag}** \`(${user.id})\`\n` +
                `${discord.getEmoji("star")}_Moderator:_ **${executor.tag}** \`(${executor.id})\`\n` +
                `${discord.getEmoji("star")}_Reason:_ ${cases[index].reason}\n` +
                context
            )
            await msg.edit({embeds: [embed]})
        }
        const rep = await this.reply(`Successfully edited this case! ${discord.getEmoji("aquaUp")}`)
        setTimeout(() => rep.delete().catch(() => null), 3000)
        message.delete().catch(() => null)
    }
}
