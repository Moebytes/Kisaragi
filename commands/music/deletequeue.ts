import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Audio} from "./../../structures/Audio"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class DeleteQueue extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Deletes the entire queue or a range.",
            help:
            `
            _Note: Valid ranges are a number, or two numbers separated by dash (eg. 3-5)._
            \`deletequeue range?\` - Deletes the queue, or the specified range.
            `,
            examples:
            `
            \`=>deletequeue\`
            \`=>deletequeue 1-5\`
            `,
            aliases: [],
            guildOnly: true,
            cooldown: 5,
            subcommandEnabled: true
        })
        const rangeOption = new SlashCommandOption()
            .setType("string")
            .setName("range")
            .setDescription("Range to remove")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(rangeOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const audio = new Audio(discord, message)
        const perms = new Permission(discord, message)
        if (!audio.checkMusicPermissions()) return
        if (!audio.checkMusicPlaying()) return
        let rep: Message
        const input = Functions.combineArgs(args, 1)
        if (!Number(input) && !input.includes("-")) {
            audio.deleteQueue()
            rep = await this.reply("Deleted the queue!")
        } else {
            const newArgs = input.split("-")
            const pos = Number(newArgs[1])
            const end = Number(newArgs[2]) ? Number(args[2]) - Number(newArgs[1]) : 1
            audio.deleteQueue(pos, end)
            rep = await this.reply(`Deleted **${end}** songs starting at position **${pos}**!`)
        }
        await Functions.timeout(3000)
        Functions.deferDelete(rep, 0)
        if (message instanceof Message) Functions.deferDelete(message, 0)
    }
}
