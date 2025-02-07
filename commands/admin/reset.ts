import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Reset extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Deletes and resets all data on your guild (no undo).",
            help:
            `
            \`reset\` - Resets all data
            `,
            examples:
            `
            \`=>reset\`
            `,
            guildOnly: true,
            aliases: [],
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const sql = new SQLQuery(message)
        const embeds = new Embeds(discord, message)
        if (!await perms.checkAdmin()) return

        const initEmbed = embeds.createEmbed()

        await SQLQuery.deleteGuild(message.guild!.id)
        await SQLQuery.initGuild(message, true)
        return this.reply(initEmbed
        .setTitle(`**Reset** ${discord.getEmoji("kaosWTF")}`)
        .setDescription("All guild settings have been reset to the default!"))
    }
}
