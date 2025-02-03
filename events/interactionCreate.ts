import {BaseInteraction, InteractionReplyOptions, ChatInputCommandInteraction} from "discord.js"
import {Kisaragi} from "../structures/Kisaragi"
import {CommandFunctions} from "../structures/CommandFunctions"
import {Cooldown} from "../structures/Cooldown"

export default class InteractionCreate {
    constructor(private readonly discord: Kisaragi) {}

    public run = async (interaction: BaseInteraction) => {
        const discord = this.discord
        if (!interaction.isChatInputCommand()) return
        const cmd = new CommandFunctions(discord, interaction as any)

        const subcommand = interaction.options.getSubcommand(false)
        let slashCommand = interaction.commandName
        if (subcommand) slashCommand += "slash"

        const command = discord.commands.get(slashCommand)

        let targetCommand = command
        if (subcommand) {
            targetCommand = discord.commands.get(subcommand)
        }

        if (command) {
            if (!command.slash) return
            // We override some properties to run message command based code with minimal changes
            // @ts-expect-error
            interaction.author = interaction.user

            // @ts-expect-error
            interaction.reply = ((originalReply) => {
                return function (options: InteractionReplyOptions) {
                    if (typeof options === "string") options = {content: options}
                    return originalReply.call(this, {fetchReply: true, ephemeral: !interaction.guild, ...options})
                }
            })(interaction.reply)

            const cooldown = new Cooldown(discord, interaction as any)
            const onCooldown = cooldown.cmdCooldown(subcommand ? subcommand : slashCommand, command.options.cooldown)
            if (onCooldown && (interaction.user.id !== process.env.OWNER_ID)) return this.discord.reply(interaction,onCooldown)

            let args = [] as string[]
            if (subcommand) {
                args = [slashCommand, subcommand, ...interaction.options.data[0].options!.map((o) => o.value)] as string[]
            } else {
                args = [slashCommand, ...interaction.options.data.map((o) => o.value)] as string[]
            }
            discord.clearDeferState(interaction)
            if (targetCommand?.options.defer) await command.deferReply(interaction)
            await cmd.runCommandClass(command, interaction as any, args)
        }
    }
}