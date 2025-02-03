import {Message, AttachmentBuilder, ChatInputCommandInteraction} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"
import sharp from "sharp"

export default class Blur extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Applies a fast or gaussian blur to an image.",
          help:
          `
          \`blur radius\` - Blurs the last posted image
          \`blur radius url\` - Blurs the linked image
          \`gaussian radius url?\` - Applies a gaussian blur instead of a fast blur.
          `,
          examples:
          `
          \`=>blur 30\`
          \`=>gaussian 40\`
          `,
          aliases: ["gaussian", "blurry", "blurriness"],
          cooldown: 10,
          defer: true,
          subcommandEnabled: true
        })
        const urlOption = new SlashCommandOption()
            .setType("string")
            .setName("url")
            .setDescription("Url, or use the last posted image.")

        const radiusOption = new SlashCommandOption()
            .setType("integer")
            .setName("radius")
            .setDescription("Radius of the blur.")
            .setRequired(true)

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(radiusOption)
            .addOption(urlOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        let url: string | undefined
        let factor = Number(args[1])
        if (args[2]) {
            url = args[2]
        } else {
            url = await discord.fetchLastAttachment(message)
        }
        if (!url) return this.reply(`Could not find an image ${discord.getEmoji("kannaCurious")}`)
        if (!factor) factor = 5
        const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer())
        const buffer = await sharp(arrayBuffer, {limitInputPixels: false})
        .blur({sigma: factor}).toBuffer()
        const attachment = new AttachmentBuilder(buffer!)
        return this.reply(`Blurred the image by a factor of **${factor}**!`, attachment)
    }
}
