import {Message, AttachmentBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Jimp, Jimp as jimp, JimpMime} from "jimp"
import sharp from "sharp"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Posterize extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Applies a posterization effect to an image.",
          help:
          `
          \`posterize level url?\` - Apples a posterization effect.
          `,
          examples:
          `
          \`=>posterize 10\`
          `,
          aliases: [],
          cooldown: 10,
          defer: true,
          subcommandEnabled: true
        })
        const urlOption = new SlashCommandOption()
            .setType("string")
            .setName("url")
            .setDescription("Url, or use the last posted image.")

        const levelOption = new SlashCommandOption()
            .setType("integer")
            .setName("level")
            .setDescription("Posterization level.")
            .setRequired(true)

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(levelOption)
            .addOption(urlOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const level = Number(args[1]) ? Number(args[1]) : 10
        let url: string | undefined
        if (args[2]) {
            url = args[2]
        } else {
            url = await discord.fetchLastAttachment(message)
        }
        if (!url) return this.reply(`Could not find an image ${discord.getEmoji("kannaCurious")}`)
        const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer())
        const inputBuffer = await sharp(arrayBuffer, {limitInputPixels: false}).png().toBuffer()
        const image = await jimp.read(inputBuffer)
        image.posterize(level)
        const buffer = await image.getBuffer(JimpMime.png)
        const attachment = new AttachmentBuilder(buffer)
        return this.reply(`Applied a posterization effect!`, attachment)
    }
}
