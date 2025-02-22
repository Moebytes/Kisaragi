import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {SQLQuery} from "../../structures/SQLQuery"

export default class SQL extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Runs an sql query on the database.",
            help:
            `
            \`sql query\` - Run sql query
            `,
            examples:
            `
            \`=>sql select * from guilds\`
            `,
            aliases: [],
            cooldown: 3,
            botdev: true,
            unlist: true,
            subcommandEnabled: false
        })
        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("The sql query.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(queryOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const embeds = new Embeds(discord, message)
        return
        /* - Disable this command
        if (!perms.checkBotDev()) return
        const query = {text: Functions.combineArgs(args, 1), rowMode: "array"}
        const sqlEmbed = embeds.createEmbed()
        let result
        try {
            result = await SQLQuery.run(query, true)
        } catch (err) {
            this.reply(`\`ERROR\` \`\`\`xl\n${err}\n\`\`\``)
        }
        sqlEmbed
        .setTitle(`**SQL Query** ${discord.getEmoji("karenAnger")}`)
        .setDescription(`Successfully ran the query **${query.text}**\n` +
        "\n" +
        `**${result ? (result[0][0] ? result[0].length : result.length) : 0}** rows were selected!\n` +
        "\n" +
        `\`\`\`${Functions.checkChar(JSON.stringify(result), 1500, ",")}\`\`\``)
        this.reply(sqlEmbed)
        */
    }
}
