import {BaseInteraction, EmbedBuilder, ChannelType, ButtonInteraction} from "discord.js"
import {Kisaragi} from "../structures/Kisaragi"
import {Command} from "../structures/Command"
import {CommandFunctions} from "../structures/CommandFunctions"
import {SQLQuery} from "../structures/SQLQuery"
import {Permission} from "../structures/Permission"
import {Cooldown} from "../structures/Cooldown"
import {Embeds} from "../structures/Embeds"
const active = new Set()

export default class InteractionCreate {
    constructor(private readonly discord: Kisaragi) {}

    public run = async (interaction: BaseInteraction) => {
        const discord = this.discord
        // @ts-expect-error
        interaction.author = interaction.user

        const cmd = new CommandFunctions(discord, interaction as any)
        const perms = new Permission(discord, interaction as any)
        const cooldown = new Cooldown(discord, interaction as any)
        const embeds = new Embeds(discord, interaction as any)
        const sql = new SQLQuery(interaction as any)

        const retriggerEmbed = async (interaction: ButtonInteraction) => {
            if (interaction.message.author.id === discord.user!.id) {
                if (this.discord.activeEmbeds.has(interaction.message.id)) return
                if (active.has(interaction.message.id)) return
                const newArray = await SQLQuery.selectColumn("collectors", "message", true)
                let cached = false
                for (let i = 0; i < newArray.length; i++) {
                    if (newArray[i] === interaction.message.id) {
                        cached = true
                    }
                }
                if (cached) {
                    const messageID = await sql.fetchColumn("collectors", "message", "message", interaction.message.id)
                    if (String(messageID)) {
                        const cachedEmbeds = await sql.fetchColumn("collectors", "embeds", "message", interaction.message.id)
                        const collapse = await sql.fetchColumn("collectors", "collapse", "message", interaction.message.id)
                        const page = await sql.fetchColumn("collectors", "page", "message", interaction.message.id)
                        const help = await sql.fetchColumn("collectors", "help", "message", interaction.message.id)
                        const download = await sql.fetchColumn("collectors", "download", "message", interaction.message.id)
                        const newEmbeds: EmbedBuilder[] = []
                        for (let i = 0; i < cachedEmbeds.length; i++) {
                            newEmbeds.push(new EmbedBuilder(JSON.parse(cachedEmbeds[i])))
                        }
                        active.add(interaction.message.id)
                        if (help && !download) {
                            // embeds.editHelpEmbed(reaction.message as Message, reaction.emoji.name!, user, newEmbeds)
                        } else {
                            embeds.editButtonCollector(interaction, newEmbeds, Boolean(collapse), Boolean(download), Number(page))
                        }
                    }
                }
            }
        }

        if (interaction.isButton()) retriggerEmbed(interaction)
        if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) return

        if (await this.discord.blacklistStop(interaction as any)) return

        let subcommand = null as string | null
        if (interaction.isChatInputCommand()) {
            subcommand = interaction.options.getSubcommand(false)
        }
        let slashCommand = interaction.commandName.toLowerCase()
        if (subcommand) slashCommand += "slash"

        const command = discord.commands.get(slashCommand)

        let targetCommand = command as Command
        if (subcommand) {
            targetCommand = discord.commands.get(subcommand)!
        }

        if (command) {
            if (!discord.checkSufficientPermissions(interaction as any)) return
            if (command.options.guildOnly) {
                if (interaction.channel?.type === ChannelType.DM) return this.discord.send(interaction, `<@${interaction.user.id}>, sorry but you can only use this command in guilds. ${this.discord.getEmoji("smugFace")}`)
            }
            const disabledCategories = await sql.fetchColumn("guilds", "disabled categories")
            if (disabledCategories?.includes(command.category) && targetCommand.name !== "help") {
                return this.discord.reply(interaction, `Sorry, commands in the category **${command.category}** were disabled on this server. ${this.discord.getEmoji("mexShrug")}`)
            }

            if (targetCommand.options.premium && !perms.checkPremium()) return

            const onCooldown = cooldown.cmdCooldown(subcommand ? subcommand : slashCommand, targetCommand.options.cooldown)
            if (onCooldown && (interaction.user.id !== process.env.OWNER_ID)) return this.discord.reply(interaction, onCooldown)

            sql.usageStatistics(command.path)
            let args = [] as string[]
            if (subcommand) {
                args = [slashCommand, subcommand, ...interaction.options.data[0].options!.map((o) => o.value)] as string[]
            } else {
                args = [slashCommand, ...interaction.options.data.map((o) => o.value)] as string[]
            }
            discord.clearDeferState(interaction)
            if (targetCommand?.options.defer && interaction.isChatInputCommand()) await command.deferReply(interaction)
            await cmd.runCommandClass(command, interaction as any, args)
        }
    }
}