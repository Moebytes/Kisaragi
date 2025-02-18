import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Audio} from "./../../structures/Audio"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Pitch extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Changes the pitch of an audio file (in semitones).",
            help:
            `
            _Note: Negative values will decrease pitch 12 semitones = 1 octave._
            \`pitch semitones\` - Changes the pitch of the song
            \`pitch download/dl semitones\` - Applies the effect to an attachment and uploads it.
            `,
            examples:
            `
            \`=>pitch 12\`
            \`=>pitch -12\`
            `,
            aliases: ["pitchshift", "semitones"],
            guildOnly: true,
            cooldown: 10,
            premium: true,
            subcommandEnabled: true
        })
        const opt2Option = new SlashCommandOption()
            .setType("string")
            .setName("semitones2")
            .setDescription("Specify the semitones here if you are using the dl subcommand.")

        const semitoneOption = new SlashCommandOption()
            .setType("string")
            .setName("semitones")
            .setDescription("The amount of semitones to pitch the song or dl to trigger the second subcommand.")
            .setRequired(true)

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(semitoneOption)
            .addOption(opt2Option)
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
        const semitones = Number(args[1]) ? Number(args[1]) : 0
        const rep = await this.reply("_Changing the pitch of the file, please wait..._")
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
        await audio.pitch(file, semitones, setDownload)
        rep.delete()
        if (!setDownload) {
            const embed = await audio.updateNowPlaying()
            discord.edit(queue[0].message!, embed)
            const rep = await this.reply("Changed the pitch of the file!")
            await Functions.timeout(3000)
        Functions.deferDelete(rep, 0)
        if (message instanceof Message) Functions.deferDelete(message, 0)
        }
    }
}
