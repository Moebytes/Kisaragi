import {Message, AttachmentBuilder, ContextMenuCommandInteraction, ModalBuilder,
TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalActionRowComponentBuilder,
ModalSubmitInteraction} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption, ContextMenuCommand} from "../../structures/SlashCommandOption"
import sharp from "sharp"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Crop extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Crops an image at an x and y offset.",
          help:
          `
          _Note: Omit the height for a proportional crop._
          \`crop x y width height?\` - Crops the last posted image
          \`crop x y width height? url\` - Crops the linked image
          `,
          examples:
          `
          \`=>crop 100 200 200 200\`
          \`=>crop 200 300 1280\`
          `,
          aliases: [],
          cooldown: 10,
          defer: true,
          subcommandEnabled: true,
          contextEnabled: false
        })
        const urlOption = new SlashCommandOption()
            .setType("string")
            .setName("url")
            .setDescription("Url, or use the last posted image.")

        const heightOption = new SlashCommandOption()
            .setType("integer")
            .setName("height")
            .setDescription("Height of crop.")

        const widthOption = new SlashCommandOption()
            .setType("integer")
            .setName("width")
            .setDescription("Width of crop.")
            .setRequired(true)

        const yOption = new SlashCommandOption()
            .setType("integer")
            .setName("y")
            .setDescription("Y-position of crop.")
            .setRequired(true)

        const xOption = new SlashCommandOption()
            .setType("integer")
            .setName("x")
            .setDescription("X-position of crop.")
            .setRequired(true)

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(xOption)
            .addOption(yOption)
            .addOption(widthOption)
            .addOption(heightOption)
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
        let x = Number(args[1]) ? Number(args[1]) : 0
        let y = Number(args[2]) ? Number(args[2]) : 0
        if (args[5]) {
            url = args[5]
        } else if (args[4] && Number.isNaN(Number(args[4]))) {
            url = args[4]
        } else {
            let messageID = args[1].match(/\d{10,}/)?.[0] || ""
            if (messageID) {
                const msg = await message.channel.messages.fetch(messageID)
                url = msg.attachments.first()?.url
            } else {
                url = await discord.fetchLastAttachment(message)
            }
        }
        if (!url) return this.reply(`Could not find an image ${discord.getEmoji("kannaCurious")}`)
        const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer())
        const metadata = await sharp(arrayBuffer, {limitInputPixels: false}).metadata()
        let width = args[3] ? Number(args[3]) : metadata.width!
        let height = args[4] ? Number(args[4]) : Math.floor(metadata.height! / (metadata.width! / width * 1.0))
        if (width > metadata.width!) width = metadata.width!
        if (height > metadata.height!) height = metadata.height!
        if (message instanceof ContextMenuCommandInteraction) {
            const interaction = message as ContextMenuCommandInteraction
            const modal = new ModalBuilder()
                .setCustomId("crop-modal")
                .setTitle("Crop")

            const xInput = new TextInputBuilder()
                .setCustomId("x-input")
                .setLabel("X:")
                .setStyle(TextInputStyle.Short)

            const yInput = new TextInputBuilder()
                .setCustomId("y-input")
                .setLabel("Y:")
                .setStyle(TextInputStyle.Short)
            
            const widthInput = new TextInputBuilder()
                .setCustomId("width-input")
                .setLabel("Width:")
                .setStyle(TextInputStyle.Short)

            const heightInput = new TextInputBuilder()
                .setCustomId("height-input")
                .setLabel("Height:")
                .setStyle(TextInputStyle.Short)

            const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(xInput)
            const actionRow2 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(yInput)
            const actionRow3 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(widthInput)
            const actionRow4 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(heightInput)
            modal.addComponents(actionRow, actionRow2, actionRow3, actionRow4)
            await interaction.showModal(modal)
            const filter = (interaction: ModalSubmitInteraction) => interaction.customId === "crop-modal"
            const modalSubmit = await interaction.awaitModalSubmit({filter, time: 600000})

            const xField = modalSubmit.fields.getTextInputValue("x-input").trim()
            const yField = modalSubmit.fields.getTextInputValue("y-input").trim()
            const widthField = modalSubmit.fields.getTextInputValue("width-input").trim()
            const heightField = modalSubmit.fields.getTextInputValue("height-input").trim()

            x = xField ? Number(xField) : 0
            y = yField ? Number(yField) : 0
            width = widthField ? Number(widthField) : width
            height = heightField ? Number(heightField) : height
            this.message = modalSubmit as any
        }
        const buffer = await sharp(arrayBuffer, {limitInputPixels: false})
        .extract({left: x, top: y, width, height})
        .toBuffer()
        const attachment = new AttachmentBuilder(buffer)
        return this.reply(`Cropped the image to an offset of **${x}, ${y}** pixels, to a width of **${width}** pixels, and to a height of **${height}** pixels!`, attachment)
    }
}
