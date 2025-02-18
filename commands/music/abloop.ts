import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Audio} from "./../../structures/Audio"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Permission} from "../../structures/Permission"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class ABLoop extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Loops a song from point A to point B.",
            help:
            `
            _Note: Also see \`loop\`, the time format is the same \`00:00\`,_
            \`abloop start end\` - Loops the current song between the times.
            `,
            examples:
            `
            \`=>abloop 1:30 2:30\`
            `,
            aliases: [],
            guildOnly: true,
            cooldown: 10,
            premium: true,
            subcommandEnabled: true
        })
        const endOption = new SlashCommandOption()
            .setType("string")
            .setName("end")
            .setDescription("End of the a-b loop.")
            .setRequired(true)

        const startOption = new SlashCommandOption()
            .setType("string")
            .setName("start")
            .setDescription("Start of the a-b loop.")
            .setRequired(true)

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(startOption)
            .addOption(endOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const audio = new Audio(discord, message)
        const perms = new Permission(discord, message)
        if (!audio.checkMusicPermissions()) return
        if (!audio.checkMusicPlaying()) return
        const queue = audio.getQueue()
        const start = args[1] ? args[1] : "0"
        const end = args[2] ? args[2] : queue[0]?.duration
        audio.abloop(start, end)
        const embed = await audio.updateNowPlaying()
        discord.edit(queue[0].message!, embed)
        const rep = await this.reply("Enabled A-B looping!")
        await Functions.timeout(3000)
        Functions.deferDelete(rep, 0)
        if (message instanceof Message) Functions.deferDelete(message, 0)
    }
}
