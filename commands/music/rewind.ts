import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Audio} from "./../../structures/Audio"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Rewind extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Rewinds the position of the song.",
            help:
            `
            \`rewind time\` - Rewinds the song, time can be in \`00:00\`, \`0m 0s\`, or \`00\` format
            `,
            examples:
            `
            \`=>rewind 10s\`
            `,
            aliases: ["seek"],
            guildOnly: true,
            cachedGuildOnly: true,
            cooldown: 5,
            defer: true,
            subcommandEnabled: true
        })
        const timeOption = new SlashCommandOption()
            .setType("string")
            .setName("time")
            .setDescription("Time to rewind.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(timeOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const audio = new Audio(discord, message)
        const perms = new Permission(discord, message)
        if (!audio.checkMusicPermissions()) return
        if (!audio.checkMusicPlaying()) return

        let rewind = args[1] ? args[1] : "5"
        rewind = rewind.replace(/h|m/gi, ":").replace(/s/gi, "").replace(/ +/g, "")
        await audio.rewind(rewind)
        const queue = audio.getQueue()
        const embed = await audio.updateNowPlaying()
        discord.edit(queue[0].message!, embed)
        const rep = await this.reply(`Rewinded the song!`)
        await Functions.timeout(3000)
        Functions.deferDelete(rep, 0)
        if (message instanceof Message) Functions.deferDelete(message, 0)
    }
}
