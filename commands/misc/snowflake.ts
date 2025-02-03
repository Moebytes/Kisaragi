import {Message, SnowflakeUtil} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Snowflake extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Deconstructs or generates a discord snowflake.",
            help:
            `
            \`snowflake flake\` - Deconstructs the snowflake
            \`snowflake date?\` - Generates a snowflake for the current time (or date, if provided)
            `,
            examples:
            `
            \`=>snowflake\`
            \`=>snowflake 579720679612612608\`
            `,
            aliases: [],
            random: "none",
            cooldown: 5,
            subcommandEnabled: true
        })
        const flakeOption = new SlashCommandOption()
            .setType("string")
            .setName("flake")
            .setDescription("Can be a snowflake or date.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(flakeOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)

        const input = Functions.combineArgs(args, 1)
        const snowflakeEmbed = embeds.createEmbed()

        if (input && (input.match(/\d+/g)?.join("") === input.trim())) {
            const snowflake = SnowflakeUtil.deconstruct(input.trim())
            snowflakeEmbed
            .setAuthor({name: "snowflake", iconURL: "https://kisaragi.moe/assets/embed/snowflake.png"})
            .setTitle(`**Snowflake** ${discord.getEmoji("gabTired")}`)
            .setDescription(
                `${discord.getEmoji("star")}_Date:_ **${new Date(snowflake.timestamp.toString())}**\n` +
                `${discord.getEmoji("star")}_Worker ID:_ **${snowflake.workerId}**\n` +
                `${discord.getEmoji("star")}_Process ID:_ **${snowflake.processId}**\n` +
                `${discord.getEmoji("star")}_Increment:_ **${snowflake.increment}**\n`
            )
            this.reply(snowflakeEmbed)

        } else {
            const snowflake = SnowflakeUtil.generate({timestamp: input.trim() ? new Date(input) : Date.now()})
            snowflakeEmbed
            .setAuthor({name: "snowflake", iconURL: "https://kisaragi.moe/assets/embed/snowflake.png"})
            .setTitle(`**Snowflake** ${discord.getEmoji("gabTired")}`)
            .setDescription(
                `${discord.getEmoji("star")}_Snowflake:_ **${snowflake}**\n`
            )
            return this.reply(snowflakeEmbed)
        }
    }
}
