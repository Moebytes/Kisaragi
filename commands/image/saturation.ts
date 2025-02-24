import {Message, AttachmentBuilder, MessageContextMenuCommandInteraction, ModalBuilder,
TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalActionRowComponentBuilder,
ModalSubmitInteraction} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption, ContextMenuCommand} from "../../structures/SlashCommandOption"
import sharp from "sharp"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Kisaragi} from "../../structures/Kisaragi"
import { Functions } from "../../structures/Functions"

export default class Saturation extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Increases or decreases the saturation of an image.",
          help:
          `
          _Note: The range is -100 to 100._
          \`saturation amount\` - Changes the saturation of the last posted image
          \`saturation amount url\` - Changes the saturation of the linked image
          `,
          examples:
          `
          \`=>saturation 50\`
          \`=>saturation -25\`
          `,
          aliases: ["saturate", "desaturate"],
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
            .setDescription("Saturation factor.")
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
        let value = Number(args[1])
        if (args[2]) {
            url = args[2]
        } else {
            let messageID = args[1].match(/\d{10,}/)?.[0] || ""
            if (messageID) {
                const msg = message.channel?.messages.cache.get(messageID)
                if (msg) url = msg.attachments.first()?.url || msg.embeds[0]?.image?.url
            } else {
                url = await discord.fetchLastAttachment(message)
            }
        }
        if (message instanceof MessageContextMenuCommandInteraction) {
            const interaction = message as MessageContextMenuCommandInteraction
            url = interaction.targetMessage.attachments.first()?.url || interaction.targetMessage.embeds[0]?.image?.url
            const modal = new ModalBuilder()
                .setCustomId("saturation-modal")
                .setTitle("Saturation")

            const factorInput = new TextInputBuilder()
                .setCustomId("factor-input")
                .setLabel("Amount:")
                .setStyle(TextInputStyle.Short)

            const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(factorInput)
            modal.addComponents(actionRow)
            await interaction.showModal(modal)
            const filter = (interaction: ModalSubmitInteraction) => interaction.customId === "saturation-modal"
            const modalSubmit = await interaction.awaitModalSubmit({filter, time: 600000})

            const factorField = modalSubmit.fields.getTextInputValue("factor-input").trim()
            value = factorField ? Number(factorField) : 0
            this.message = modalSubmit as any
        }
        if (!url) return this.reply(`Could not find an image ${discord.getEmoji("kannaCurious")}`)
        let newValue = Functions.transformRange(value, -100, 100, 0, 2)
        const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer())
        const buffer = await sharp(arrayBuffer, {limitInputPixels: false})
        .modulate({saturation: newValue}).toBuffer()
        const attachment = new AttachmentBuilder(buffer)
        return this.reply(`Changed the saturation of the image!`, attachment)
    }
}
