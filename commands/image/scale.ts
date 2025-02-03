import {Message, AttachmentBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import sharp from "sharp"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Kisaragi} from "../../structures/Kisaragi"

export default class Scale extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Scales an image by a certain factor.",
          help:
          `
          _Note: To resize by pixels instead, see \`resize\`._
          \`scale factor\` - Scales the last posted image
          \`scale factor url\` - Scales the linked image
          `,
          examples:
          `
          \`=>scale 1.5\`
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

        const factorOption = new SlashCommandOption()
            .setType("number")
            .setName("factor")
            .setDescription("Scale factor.")
            .setRequired(true)

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(factorOption)
            .addOption(urlOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        let url: string | undefined
        if (args[2]) {
            url = args[2]
        } else {
            url = await discord.fetchLastAttachment(message)
        }
        if (!url) return this.reply(`Could not find an image ${discord.getEmoji("kannaCurious")}`)
        const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer())
        const metadata = await sharp(arrayBuffer, {limitInputPixels: false}).png().metadata()
        const factor = args[1] ? Number(args[1]) : 1
        const width = Math.floor(metadata.width! * factor)
        const height = Math.floor(metadata.height! * factor)
        const buffer = await sharp(arrayBuffer, {limitInputPixels: false})
        .resize({width, height, fit: "fill"}).toBuffer()
        const attachment = new AttachmentBuilder(buffer)
        return this.reply(`Scaled the image by a factor of **${factor}x**!`, attachment)
    }
}
