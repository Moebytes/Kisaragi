import {Message, AttachmentBuilder, ContextMenuCommandInteraction, ModalBuilder,
TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalActionRowComponentBuilder,
ModalSubmitInteraction} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption, ContextMenuCommand} from "../../structures/SlashCommandOption"
import {Jimp as jimp, JimpMime} from "jimp"
import sharp from "sharp"
import {Command} from "../../structures/Command"
import {Functions} from "./../../structures/Functions"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Tint extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Tints the image with a color.",
          help:
          `
          \`tint #hexcolor\` - Tints the last posted image
          \`tint #hexcolor url\` - Tints the linked image
          `,
          examples:
          `
          \`=>tint #ff5ce1\`
          `,
          aliases: ["colorize", "photofilter"],
          cooldown: 10,
          defer: true,
          subcommandEnabled: true,
          contextEnabled: false
        })
        const urlOption = new SlashCommandOption()
            .setType("string")
            .setName("url")
            .setDescription("Url, or use the last posted image.")

        const colorOption = new SlashCommandOption()
            .setType("string")
            .setName("color")
            .setDescription("Hex color of the tint.")
            .setRequired(true)

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(colorOption)
            .addOption(urlOption)

        this.context = new ContextMenuCommand()
            .setName(this.constructor.name)
            .setType("message")
            .toJSON()
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        let url: string | undefined
        let color = args[1] ? args[1] : "#ff0fd3"
        if (args[2]) {
            url = args[2]
        } else {
            let messageID = args[1].match(/\d{10,}/)?.[0] || ""
            if (messageID) {
                const msg = await message.channel.messages.fetch(messageID)
                url = msg.attachments.first()?.url
            } else {
                url = await discord.fetchLastAttachment(message)
            }
        }
        if (message instanceof ContextMenuCommandInteraction) {
            const interaction = message as ContextMenuCommandInteraction
            const modal = new ModalBuilder()
                .setCustomId("tint-modal")
                .setTitle("Tint")

            const colorInput = new TextInputBuilder()
                .setCustomId("color-input")
                .setLabel("Color:")
                .setStyle(TextInputStyle.Short)

            const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(colorInput)
            modal.addComponents(actionRow)
            await interaction.showModal(modal)
            const filter = (interaction: ModalSubmitInteraction) => interaction.customId === "tint-modal"
            const modalSubmit = await interaction.awaitModalSubmit({filter, time: 600000})

            const colorField = modalSubmit.fields.getTextInputValue("color-input").trim()
            color = colorField ? colorField : "#ff0fd3"
            this.message = modalSubmit as any
        }
        if (!url) return this.reply(`Could not find an image ${discord.getEmoji("kannaCurious")}`)
        const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer())
        const buffer = await sharp(arrayBuffer, {limitInputPixels: false})
        .tint(Functions.decodeHexColor(color)).toBuffer()
        const attachment = new AttachmentBuilder(buffer)
        return this.reply(`Tinted the image with the color **${color}**!`, attachment)
    }
}
