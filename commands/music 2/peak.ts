import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Audio} from "./../../structures/Audio"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Peak extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Applies a peak filter to an audio file.",
            help:
            `
            \`peak freq? resonance? gain?\` - Applies a peak filter to the audio file with the parameters.
            \`peak download/dl freq? resonance? gain?\` - Applies a peak filter to an attachment and uploads it.
            `,
            examples:
            `
            \`=>peak 1000 1 3\`
            \`=>peak 3000 2 -4\`
            `,
            aliases: [],
            guildOnly: true,
            cooldown: 20,
            premium: true,
            subcommandEnabled: true
        })
        const gain2Option = new SlashCommandOption()
            .setType("string")
            .setName("gain2")
            .setDescription("Gain of the filter in the dl subcommand.")

        const gainOption = new SlashCommandOption()
            .setType("string")
            .setName("gain")
            .setDescription("Gain of the filter or resonance in the dl subcommand.")

        const resonanceOption = new SlashCommandOption()
            .setType("string")
            .setName("resonance")
            .setDescription("Resonance of the filter or freq in the dl subcommand.")

        const freqOption = new SlashCommandOption()
            .setType("string")
            .setName("freq")
            .setDescription("Freq of the filter or dl to apply to an attachment.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(freqOption)
            .addOption(resonanceOption)
            .addOption(gainOption)
            .addOption(gain2Option)
        
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
        let setDownload = false
        if (args[1] === "download" || args[1] === "dl") {
            setDownload = true
            args.shift()
        }
        const freq = Number(args[1])
        const resonance = Number(args[2])
        const gain = Number(args[3])
        const rep = await this.reply("_Adding a peak filter to the file, please wait..._")
        let file = ""
        if (setDownload) {
            const regex = new RegExp(/.(mp3|wav|flac|ogg|aiff)/)
            const attachment = await discord.fetchLastAttachment(message, false, regex)
            if (!attachment) return this.reply(`Only **mp3**, **wav**, **flac**, **ogg**, and **aiff** files are supported.`)
            file = attachment
        } else {
            const queue = audio.getQueue()
            file = queue?.[0].file
        }
        try {
            await audio.peak(file, freq, resonance, gain, setDownload)
        } catch {
            return this.reply("Sorry, these parameters will cause clipping distortion on the audio file.")
        }
        if (rep) rep.delete()
        if (!setDownload) {
            const queue = audio.getQueue()
            const settings = audio.getSettings()
            settings.filters.push("peak")
            const embed = await audio.updateNowPlaying()
            discord.edit(queue[0].message!, embed)
            const rep = await this.reply("Applied a peak filter to the file!")
            await Functions.timeout(3000)
        Functions.deferDelete(rep, 0)
        if (message instanceof Message) Functions.deferDelete(message, 0)
        }
    }
}
