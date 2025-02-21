import {Message, AttachmentBuilder, ContextMenuCommandInteraction, ModalBuilder,
TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalActionRowComponentBuilder,
ModalSubmitInteraction} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption, ContextMenuCommand} from "../../structures/SlashCommandOption"
import sharp from "sharp"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Contrast extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Increases or decreases the contrast of an image.",
          help:
          `
          _Note: The range is -100 to 100._
          \`contrast factor\` - Edits the contrast of the last posted image
          \`contrast factor url\` - Edits the contrast of the linked image
          `,
          examples:
          `
          \`=>contrast 40\`
          `,
          aliases: ["contrast"],
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
            .setDescription("Contrast factor from -100 to 100.")
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
                .setCustomId("contrast-modal")
                .setTitle("Contrast")

            const factorInput = new TextInputBuilder()
                .setCustomId("factor-input")
                .setLabel("Factor:")
                .setStyle(TextInputStyle.Short)

            const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(factorInput)
            modal.addComponents(actionRow)
            await interaction.showModal(modal)
            const filter = (interaction: ModalSubmitInteraction) => interaction.customId === "contrast-modal"
            const modalSubmit = await interaction.awaitModalSubmit({filter, time: 600000})

            const factorField = modalSubmit.fields.getTextInputValue("factor-input").trim()
            factor = factorField ? Number(factorField) : 0
            this.message = modalSubmit as any
        }
        if (!url) return this.reply(`Could not find an image ${discord.getEmoji("kannaCurious")}`)
        if (!factor) factor = 0
        let newFactor = Functions.transformRange(factor, -100, 100, 0, 2)
        const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer())
        const buffer = await sharp(arrayBuffer, {limitInputPixels: false})
        .linear(newFactor, -(128 * newFactor) + 128)
        .toBuffer()
        const attachment = new AttachmentBuilder(buffer)
        return this.reply(`Shifted the contrast by a factor of **${factor}**!`, attachment)
    }
}
