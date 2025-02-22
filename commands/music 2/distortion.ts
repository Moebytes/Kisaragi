import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Audio} from "./../../structures/Audio"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Distortion extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Applies distortion effect.",
            help:
            `
            \`distortion gain? color?\` - Applies distortion to the audio file with the parameters.
            \`distortion download/dl gain? color?\` - Applies distortion to an attachment and uploads it.
            `,
            examples:
            `
            \`=>distortion 10 10\`
            \`=>distortion download 20 20\`
            `,
            aliases: ["overdrive"],
            guildOnly: true,
            cachedGuildOnly: true,
            cooldown: 20,
            premium: true,
            subcommandEnabled: true
        })
        const color2Option = new SlashCommandOption()
            .setType("string")
            .setName("color2")
            .setDescription("Color of the effect in the dl subcommand.")

        const colorOption = new SlashCommandOption()
            .setType("string")
            .setName("color")
            .setDescription("Color of the effect or gain in the dl subcommand.")

        const gainOption = new SlashCommandOption()
            .setType("string")
            .setName("gain")
            .setDescription("Gain of the effect or dl to apply to an attachment.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(gainOption)
            .addOption(colorOption)
            .addOption(color2Option)
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
        const gain = Number(args[1])
        const color = Number(args[2])
        const rep = await this.reply("_Adding distortion to the file, please wait..._")
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
            await audio.distortion(file, gain, color, setDownload)
        } catch {
            return this.reply("Sorry, these parameters will cause clipping distortion on the audio file.")
        }
        if (rep) rep.delete()
        if (!setDownload) {
            const queue = audio.getQueue()
            const settings = audio.getSettings()
            settings.effects.push("distortion")
            const embed = await audio.updateNowPlaying()
            discord.edit(queue[0].message!, embed)
            const rep = await this.reply("Applied a distortion effect to the file!")
            await Functions.timeout(3000)
            Functions.deferDelete(rep, 0)
            if (message instanceof Message) Functions.deferDelete(message, 0)
        }
    }
}
