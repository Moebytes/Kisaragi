import {Message, AttachmentBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Jimp, Jimp as jimp, JimpMime} from "jimp"
import sharp from "sharp"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Opacity extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Changes the opacity of an image.",
          help:
          `
          _Note: The range is 0 to 100._
          \`opacity factor\` - Edits the opacity of the last posted image
          \`opacity factor url\` - Edits the opacity of the linked image
          `,
          examples:
          `
          \`=>opacity 70\`
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
            .setType("integer")
            .setName("factor")
            .setDescription("Opacity factor from 0 to 100.")
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
        let factor = Number(args[1])
        if (args[2]) {
            url = args[2]
        } else {
            url = await discord.fetchLastAttachment(message)
        }
        if (!url) return this.reply(`Could not find an image ${discord.getEmoji("kannaCurious")}`)
        if (!factor) factor = 100
        factor /= 100
        if (factor < 0) factor = 0
        if (factor > 1) factor = 1
        const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer())
        const inputBuffer = await sharp(arrayBuffer, {limitInputPixels: false}).png().toBuffer()
        const image = await jimp.read(inputBuffer)
        image.opacity(factor)
        const buffer = await image.getBuffer(JimpMime.png)
        const attachment = new AttachmentBuilder(buffer)
        return this.reply(`Changed the opacity to **${factor}**!`, attachment)
    }
}
