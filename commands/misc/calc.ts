import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import * as math from "mathjs"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Calc extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Calculates a math expression.",
            help:
            `
            \`calc expression\` - Calculates the expression
            `,
            examples:
            `
            \`=>calc sin(1)\`
            `,
            aliases: [],
            cooldown: 3,
            subcommandEnabled: true
        })
        const expressionOption = new SlashCommandOption()
            .setType("string")
            .setName("expression")
            .setDescription("Math expression to evaluate.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(expressionOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)

        const input = Functions.combineArgs(args, 1)
        if (!input) {
            return this.noQuery(embeds.createEmbed()
            .setTitle(`**Math Calculation** ${discord.getEmoji("vigneDead")}`))
        }
        const result = math.evaluate(input)
        const calcEmbed = embeds.createEmbed()
        calcEmbed
        .setTitle(`**Math Calculation** ${discord.getEmoji("vigneDead")}`)
        .setDescription(String(result))
        return this.reply(calcEmbed)
    }
}
