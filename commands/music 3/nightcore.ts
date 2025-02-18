import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Audio} from "../../structures/Audio"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Nightcore extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Preset for speed (1.3x pitch).",
            help:
            `
            \`nightcore\` - Applies a nightcore effect (speed 1.3x pitch)
            `,
            examples:
            `
            \`=>nightcore\`
            `,
            aliases: [],
            guildOnly: true,
            cooldown: 10,
            premium: true,
            subcommandEnabled: true
        })
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const audio = new Audio(discord, message)
        const perms = new Permission(discord, message)
        if (!audio.checkMusicPermissions()) return
        if (!audio.checkMusicPlaying()) return
        const queue = audio.getQueue() as any
        const file = queue?.[0].file
        const rep = await this.reply("_Applying a nightcore effect, please wait..._")
        await audio.speed(file, 1.3, true)
        if (rep) Functions.deferDelete(rep, 0)
        const embed = await audio.updateNowPlaying()
        discord.edit(queue[0].message!, embed)
        const rep2 = await this.reply(`Applied a nightcore effect!`)
        await Functions.timeout(3000)
        Functions.deferDelete(rep2, 0)
        if (message instanceof Message) Functions.deferDelete(message, 0)
    }
}
