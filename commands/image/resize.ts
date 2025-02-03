import {Message, AttachmentBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import sharp from "sharp"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Kisaragi} from "../../structures/Kisaragi"

export default class Resize extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Resizes an image to a new width/height (or resizes proportionally).",
          help:
          `
          _Note: Omit the height to resize proportionally. To use a scale factor instead of pixels, see \`scale\`._
          \`resize width height?\` - Resizes the last posted image
          \`resize width height? url\` - Resizes the linked image
          `,
          examples:
          `
          \`=>resize 1280 720\`
          \`=>resize 1920\`
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

        const heightOption = new SlashCommandOption()
            .setType("integer")
            .setName("height")
            .setDescription("Resize height.")

        const widthOption = new SlashCommandOption()
            .setType("integer")
            .setName("width")
            .setDescription("Resize width.")
            .setRequired(true)

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(widthOption)
            .addOption(heightOption)
            .addOption(urlOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        let url: string | undefined
        let height = 0 as any
        let width = 0 as any
        if (Number(args[1]) && Number(args[2]) && args[3]) {
            width = Number(args[1])
            height = Number(args[2])
            url = args[3]
        } else if (Number(args[1]) && Number(args[2]) && !args[3]) {
            width = Number(args[1])
            height = Number(args[2])
        } else if (Number(args[1]) && args[2]) {
            width = Number(args[1])
            url = args[2]
        } else if (Number(args[1])) {
            width = Number(args[1])
        } else {
            url = args[1]
        }
        if (!url) url = await discord.fetchLastAttachment(message)
        if (!url) return this.reply(`Could not find an image ${discord.getEmoji("kannaCurious")}`)
        if (!width) width = undefined
        if (!height) height = undefined
        const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer())
        const buffer = await sharp(arrayBuffer, {limitInputPixels: false})
        .resize({width, height, fit: "fill"}).toBuffer()
        const attachment = new AttachmentBuilder(buffer)
        return this.reply(`Resized the image to **${width}x${height}**!`, attachment)
    }
}
