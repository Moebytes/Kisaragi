import {BaseInteraction, InteractionReplyOptions, MessageFlags} from "discord.js"
import {Kisaragi} from "../structures/Kisaragi"
import {Command} from "../structures/Command"
import {CommandFunctions} from "../structures/CommandFunctions"
import {Permission} from "../structures/Permission"
import {Cooldown} from "../structures/Cooldown"

export default class InteractionCreate {
    constructor(private readonly discord: Kisaragi) {}

    public run = async (interaction: BaseInteraction) => {
        const discord = this.discord
        if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) return

        // We override some properties to run message command based code with minimal changes
        // @ts-expect-error
        interaction.author = interaction.user

        // @ts-expect-error
        interaction.reply = ((originalReply) => {
            return async function (options: InteractionReplyOptions) {
                if (typeof options === "string") options = {content: options}
                let flags = undefined //!interaction.guild ? MessageFlags.Ephemeral : undefined
                await originalReply.call(this, {withResponse: true, flags, ...options})
                return interaction.fetchReply()
            }
        })(interaction.reply)

        const cmd = new CommandFunctions(discord, interaction as any)
        const perms = new Permission(discord, interaction as any)
        const cooldown = new Cooldown(discord, interaction as any)

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
            if (targetCommand.options.premium && !perms.checkPremium()) return

            const onCooldown = cooldown.cmdCooldown(subcommand ? subcommand : slashCommand, targetCommand.options.cooldown)
            if (onCooldown && (interaction.user.id !== process.env.OWNER_ID)) return this.discord.reply(interaction, onCooldown)

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