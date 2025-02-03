import {Message, AttachmentBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import sharp from "sharp"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Hue extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Shifts the hue of an image.",
          help:
          `
          _Note: Hue is in degrees._
          \`hue shift\` - Shifts the hue of the last posted image
          \`hue shift url\` - Shifts the hue of the linked image
          `,
          examples:
          `
          \`=>hue 180\`
          `,
          aliases: ["spin"],
          cooldown: 10,
          defer: true,
          subcommandEnabled: true
        })
        const urlOption = new SlashCommandOption()
            .setType("string")
            .setName("url")
            .setDescription("Url, or use the last posted image.")

        const shiftOption = new SlashCommandOption()
            .setType("integer")
            .setName("shift")
            .setDescription("Amount of hue shift.")
            .setRequired(true)

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(shiftOption)
            .addOption(urlOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        let url: string | undefined
        const shift = Number(args[1]) ? Number(args[1]) : 0
        if (args[2]) {
            url = args[2]
        } else {
            url = await discord.fetchLastAttachment(message)
        }
        if (!url) return this.reply(`Could not find an image ${discord.getEmoji("kannaCurious")}`)
        const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer())
        let buffer = await sharp(arrayBuffer, {limitInputPixels: false})
        .modulate({hue: shift}).toBuffer()
        const attachment = new AttachmentBuilder(buffer)
        return this.reply(`Shifted the hue **${shift}** degrees!`, attachment)
    }
}
