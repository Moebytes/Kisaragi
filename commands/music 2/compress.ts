import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Audio} from "./../../structures/Audio"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Compress extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Applies compression to an audio file (reduces dynamic range).",
            help:
            `
            _Note: This is a simple compression effect, set the amount from 0-100._
            \`compress amount?\` - Applies compression to the audio file with the parameters.
            \`compress download/dl amount?\` - Applies compression to an attachment and uploads it.
            `,
            examples:
            `
            \`=>compress 75\`
            \`=>compress 90\`
            `,
            aliases: [],
            guildOnly: true,
            cooldown: 20,
            premium: true,
            subcommandEnabled: true
        })
        const amount2Option = new SlashCommandOption()
            .setType("string")
            .setName("decay")
            .setDescription("Amount of the effect in the dl subcommand.")

        const amountOption = new SlashCommandOption()
            .setType("string")
            .setName("delay")
            .setDescription("Amount of the effect or dl to apply to an attachment.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(amountOption)
            .addOption(amount2Option)
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
        const amount = Number(args[1])
        const rep = await this.reply("_Applying compression to the file, please wait..._")
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
            await audio.compression(file, amount, setDownload)
        } catch {
            return this.reply("Sorry, these parameters will cause clipping distortion on the audio file.")
        }
        if (rep) rep.delete()
        if (!setDownload) {
            const queue = audio.getQueue()
            const settings = audio.getSettings()
            settings.effects.push("compression")
            const embed = await audio.updateNowPlaying()
            discord.edit(queue[0].message!, embed)
            const rep = await this.reply("Applied compression to the file!")
            await Functions.timeout(3000)
        Functions.deferDelete(rep, 0)
        if (message instanceof Message) Functions.deferDelete(message, 0)
        }
    }
}
