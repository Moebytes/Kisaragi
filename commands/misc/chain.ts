import {Message, ChatInputCommandInteraction} from "discord.js"
import {SlashCommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {CommandFunctions} from "./../../structures/CommandFunctions"
import {Functions} from "../../structures/Functions"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Chain extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Runs multiple commands in succession.",
            help:
            `
            _Note: The limit is 5 commands (to prevent abuse). This can be used to quickly set options such as reaction roles._
            \`chain cmd1 & cmd2\` - Run multiple commands separated by "&"
            `,
            examples:
            `
            \`=>chain holiday & mention kurisumasu\`
            \`=>chain kawaii & kitsune & neko\`
            \`=>chain reactionroles [messageID] @role1 !emoji1! & reactionroles [messageID] @role2 !emoji2!\`
            `,
            aliases: [],
            cooldown: 200,
            premium: true,
            slashEnabled: true
        })
        const chainOption = new SlashCommandOption()
            .setType("string")
            .setName("chain")
            .setDescription("The commands to chain separated by \"&\".")
            
        this.slash = new SlashCommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addStringOption(chainOption)
            .toJSON()
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const commands = new CommandFunctions(discord, message)
        const embeds = new Embeds(discord, message)
        if (!args[1]) return this.noQuery(embeds.createEmbed())
        if (!message.channel.isSendable()) return

        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)

        const cmdArgs = args.join(" ").split("& ")
        if (cmdArgs.length > 5 && (message.author.id !== process.env.OWNER_ID)) return message.reply(`Chaining 5+ commands is restricted to the bot developer. ${discord.getEmoji("sagiriBleh")}`)
        for (let i = 0; i < cmdArgs.length; i++) {
            const running = await this.reply(`**Running Chain ${i + 1}** ${discord.getEmoji("kisaragiCircle")}`)
            await commands.runCommand(message, cmdArgs[i].replace(/chain/g, "").split(" "))
            Functions.deferDelete(running, 1000)
        }
        await this.send(" ").catch(() => null)
    }
}
