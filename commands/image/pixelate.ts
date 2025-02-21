import {Message, AttachmentBuilder, ContextMenuCommandInteraction, ModalBuilder,
TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalActionRowComponentBuilder,
ModalSubmitInteraction} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption, ContextMenuCommand} from "../../structures/SlashCommandOption"
import {Jimp as jimp, JimpMime} from "jimp"
import sharp from "sharp"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Pixelate extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Adds a pixelation effect to an image.",
          help:
          `
          \`pixelate factor\` - Edits the pixelation of the last posted image
          \`pixelate factor url\` - Edits the pixelation of the linked image
          `,
          examples:
          `
          \`=>pixelate 50\`
          `,
          aliases: ["censor"],
          cooldown: 10,
          defer: true,
          subcommandEnabled: true,
          contextEnabled: true
        })
        const urlOption = new SlashCommandOption()
            .setType("string")
            .setName("url")
            .setDescription("Url, or use the last posted image.")

        const factorOption = new SlashCommandOption()
            .setType("integer")
            .setName("factor")
            .setDescription("Pixelation factor.")
            .setRequired(true)

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(factorOption)
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
        let factor = Number(args[1])
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
                .setCustomId("pixelate-modal")
                .setTitle("Pixelate")

            const factorInput = new TextInputBuilder()
                .setCustomId("factor-input")
                .setLabel("Factor:")
                .setStyle(TextInputStyle.Short)

            const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(factorInput)
            modal.addComponents(actionRow)
            await interaction.showModal(modal)
            const filter = (interaction: ModalSubmitInteraction) => interaction.customId === "pixelate-modal"
            const modalSubmit = await interaction.awaitModalSubmit({filter, time: 600000})

            const factorField = modalSubmit.fields.getTextInputValue("factor-input").trim()
            factor = factorField ? Number(factorField) : 0
            this.message = modalSubmit as any
        }
        if (!url) return this.reply(`Could not find an image ${discord.getEmoji("kannaCurious")}`)
        if (!factor) factor = 0
        const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer())
        const inputBuffer = await sharp(arrayBuffer, {limitInputPixels: false}).png().toBuffer()
        const image = await jimp.read(inputBuffer)
        image.pixelate(factor)
        const buffer = await image.getBuffer(JimpMime.png)
        const attachment = new AttachmentBuilder(buffer)
        return this.reply(`Pixelated the image by a factor of **${factor}**!`, attachment)
    }
}
