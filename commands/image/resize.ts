/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, AttachmentBuilder, MessageContextMenuCommandInteraction, ModalBuilder,
TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalActionRowComponentBuilder,
ModalSubmitInteraction} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption, ContextMenuCommand} from "../../structures/SlashCommandOption"
import sharp from "sharp"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Kisaragi} from "../../structures/Kisaragi"

export default class Resize extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Resizes an image to a new width/height (or resizes proportionally).",
          help:
          `
          _Note: Omit the height to resize proportionally. To use a scale factor instead of pixels, see \`scale\`._
          \`resize width height?\` - Resizes the last posted image
          \`resize width height? url\` - Resizes the linked image
          `,
          examples:
          `
          \`=>resize 1280 720\`
          \`=>resize 1920\`
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
            .setDescription("Resize height.")

        const widthOption = new SlashCommandOption()
            .setType("integer")
            .setName("width")
            .setDescription("Resize width.")
            .setRequired(true)

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
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
        let height = 0 as any
        let width = 0 as any
        if (Number(args[1]) && Number(args[2]) && args[3]) {
            width = Number(args[1])
            height = Number(args[2])
            url = args[3]
        } else if (Number(args[1]) && Number(args[2]) && !args[3]) {
            width = Number(args[1])
            height = Number(args[2])
        } else if (Number(args[1]) && args[2]) {
            width = Number(args[1])
            url = args[2]
        } else if (Number(args[1])) {
            width = Number(args[1])
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
                .setCustomId("resize-modal")
                .setTitle("Resize")

            const widthInput = new TextInputBuilder()
                .setCustomId("width-input")
                .setLabel("Width:")
                .setStyle(TextInputStyle.Short)

            const heightInput = new TextInputBuilder()
                .setCustomId("height-input")
                .setLabel("Height:")
                .setStyle(TextInputStyle.Short)

            const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(widthInput)
            const actionRow2 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(heightInput)
            modal.addComponents(actionRow, actionRow2)
            await interaction.showModal(modal)
            const filter = (interaction: ModalSubmitInteraction) => interaction.customId === "resize-modal"
            const modalSubmit = await interaction.awaitModalSubmit({filter, time: 600000})

            const widthField = modalSubmit.fields.getTextInputValue("width-input").trim()
            const heightField = modalSubmit.fields.getTextInputValue("height-input").trim()
            width = widthField ? Number(widthField) : 0
            height = heightField ? Number(heightField) : 0
            this.message = modalSubmit as any
        }
        if (!url) return this.reply(`Could not find an image ${discord.getEmoji("kannaCurious")}`)
        if (!width) width = undefined
        if (!height) height = undefined
        const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer())
        const buffer = await sharp(arrayBuffer, {limitInputPixels: false})
        .resize({width, height, fit: "fill"}).toBuffer()
        const attachment = new AttachmentBuilder(buffer)
        return this.reply(`Resized the image to **${width}x${height}**!`, attachment)
    }
}
