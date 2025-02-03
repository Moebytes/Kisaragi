import {Message, AttachmentBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import sharp from "sharp"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Kisaragi} from "../../structures/Kisaragi"

export default class Greyscale extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Makes an image greyscale.",
          help:
          `
          \`greyscale url?\` - Makes the image greyscale
          `,
          examples:
          `
          \`=>greyscale\`
          `,
          aliases: ["grayscale"],
          cooldown: 10,
          defer: true,
          subcommandEnabled: true
        })
        const urlOption = new SlashCommandOption()
            .setType("string")
            .setName("url")
            .setDescription("Url, or use the last posted image.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(urlOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        let url: string | undefined
        if (args[1]) {
            url = args[1]
        } else {
            url = await discord.fetchLastAttachment(message)
        }
        if (!url) return this.reply(`Could not find an image ${discord.getEmoji("kannaCurious")}`)
        const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer())
        let buffer = await sharp(arrayBuffer, {limitInputPixels: false})
        .greyscale().toBuffer()
        const attachment = new AttachmentBuilder(buffer)
        return this.reply(`Made the image greyscale!`, attachment)
    }
}
