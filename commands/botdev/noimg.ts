import {EmbedBuilder, Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import fs from "fs"
import path from "path"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Permission} from "../../structures/Permission"
import {SQLQuery} from "../../structures/SQLQuery"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"

export default class NoImg extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Lists all commands with no image.",
            help:
            `
            \`noimg\` - Show noimg commands
            \`unlist\` - Show unlisted commands
            `,
            examples:
            `
            \`=>noimg\`
            `,
            aliases: ["unlist", "hidden"],
            cooldown: 10,
            botdev: true,
            subcommandEnabled: true
        })
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const sql = new SQLQuery(message)
        const perms = new Permission(discord, message)
        const embeds = new Embeds(discord, message)
        if (!perms.checkBotDev()) return
        let unlist = false
        if (args[0] === "unlist" || args[0] === "hidden") unlist = true
        const commands = [...discord.commands.values()].filter((command) => {
            if (command.name === "helpInfo") return false
            if (command.name.endsWith("slash")) return false
            if (unlist) {
                if (command.options.unlist) return true
            } else {
                const rawPath = path.join(__dirname, `../../../assets/help/${command.category}/${command.name}`)
                if (!fs.existsSync(`${rawPath}.png`) && !fs.existsSync(`${rawPath}.jpg`) && !fs.existsSync(`${rawPath}.gif`)) return true
            }
            return false
        })

        const names = commands.map((c) => c.name)

        let desc = ""
        for (let i = 0; i < names.length; i++) {
            desc += `\`${names[i]}\`\n`
        }
        const splits = Functions.splitMessage(desc, {maxLength: 1800, char: "\n"})

        const embedArray: EmbedBuilder[] = []
        for (let i = 0; i < splits.length; i++) {
            const embed = embeds.createEmbed()
            embed
            .setTitle(`**${unlist ? "Unlisted" : "No Image"}** ${discord.getEmoji("sagiriBleh")}`)
            .setDescription(splits[i] || null)
            embedArray.push(embed)
        }

        if (embedArray.length === 1) {
            this.reply(embedArray[0])
        } else {
            embeds.createReactionEmbed(embedArray)
        }
    }
}
