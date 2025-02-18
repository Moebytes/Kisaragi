import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Audio} from "./../../structures/Audio"
import {CommandFunctions} from "./../../structures/CommandFunctions"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Loop extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Loops the current track, or stops looping.",
            help:
            `
            \`loop\` - Loops the current track.
            \`loop link/query\` - An alias for \`play loop\`.
            `,
            examples:
            `
            \`=>loop\`
            `,
            aliases: ["repeat"],
            guildOnly: true,
            cooldown: 10,
            subcommandEnabled: true
        })
        const linkOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("Optional song link/query to play.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(linkOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const cmd = new CommandFunctions(discord, message)
        const audio = new Audio(discord, message)
        const perms = new Permission(discord, message)
        if (Functions.combineArgs(args, 1).trim()) {
            args.shift()
            return cmd.runCommand(message, ["play", "loop", ...args])
        }
        if (!audio.checkMusicPermissions()) return
        if (!audio.checkMusicPlaying()) return
        audio.loop()
        const queue = audio.getQueue()
        const embed = await audio.updateNowPlaying()
        discord.edit(queue[0].message!, embed)
        const rep = await this.reply("Enabled looping!")
        await Functions.timeout(3000)
        Functions.deferDelete(rep, 0)
        if (message instanceof Message) Functions.deferDelete(message, 0)
    }
}
