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
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Flip extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Flips an image horizontally, vertically, or both.",
          help:
          `
          _Note: Some param aliases that can be used are horizontal, h, vertical, and v._
          \`flip x? url?\` - Flips the image horizontally (the default)
          \`flip y url?\` - Flips an image vertically.
          \`flip xy url?\` - Flips the image in both directions.
          \`flop yx url?\` - Inverse of flip (vertical becomes the default).
          \`flipflop url?\` - Alias for flipping in both directions.
          `,
          examples:
          `
          \`=>flip\`
          \`=>flip y\`
          `,
          aliases: ["flop", "flipflop"],
          cooldown: 10,
          defer: true,
          subcommandEnabled: true,
          contextEnabled: false
        })
        const urlOption = new SlashCommandOption()
            .setType("string")
            .setName("url")
            .setDescription("Url, or use the last posted image.")

        const flipOption = new SlashCommandOption()
            .setType("string")
            .setName("flip")
            .setDescription("Can be x/y/xy/yx.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(flipOption)
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
        if (args[4] && args[3].match(/x|y|vertical|horizontal|h|v/)) {
            url = args[4]
        } else if (args[3] && args[2].match(/x|y|vertical|horizontal|h|v/)) {
            url = args[3]
        } else if (args[2] && args[1].match(/x|y|vertical|horizontal|h|v/)) {
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
        if (!url) return this.reply(`Could not find an image ${discord.getEmoji("kannaCurious")}`)
        let input = Functions.combineArgs(args, 1).replace(url, "").trim()
        if (message instanceof MessageContextMenuCommandInteraction) {
            const interaction = message as MessageContextMenuCommandInteraction
            url = interaction.targetMessage.attachments.first()?.url || interaction.targetMessage.embeds[0]?.image?.url
            const modal = new ModalBuilder()
                .setCustomId("flip-modal")
                .setTitle("Flip")

            const flipInput = new TextInputBuilder()
                .setCustomId("flip-input")
                .setLabel("X/Y:")
                .setStyle(TextInputStyle.Short)

            const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(flipInput)
            modal.addComponents(actionRow)
            await interaction.showModal(modal)
            const filter = (interaction: ModalSubmitInteraction) => interaction.customId === "flip-modal"
            const modalSubmit = await interaction.awaitModalSubmit({filter, time: 600000})

            input = modalSubmit.fields.getTextInputValue("flip-input").trim()
            this.message = modalSubmit as any
        }
        let setHorizontal = true
        let setVertical = false
        if (args[0] === "flop") {
            setHorizontal = false
            setVertical = true
        }
        if (input.match(/vertical|v|y/)) {
            setVertical = true
            setHorizontal = false
        }
        if (input.match(/horizontal|h|x/)) {
            setHorizontal = true
        }
        if (args[0] === "flipflop") {
            setHorizontal = true
            setVertical = true
        }
        if (!url) return this.reply(`Could not find an image ${discord.getEmoji("kannaCurious")}`)
        const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer())
        let img = sharp(arrayBuffer, {limitInputPixels: false}) as any
        if (setHorizontal) img = img.flop()
        if (setVertical) img = img.flip()
        let buffer = await img.toBuffer()
        const attachment = new AttachmentBuilder(buffer!)
        let text = "Flipped the image!"
        if (setHorizontal && setVertical) {
            text = "Flipped the image **horizontally** and **vertically**!"
        } else if (setHorizontal) {
            text = "Flipped the image **horizontally**!"
        } else if (setVertical) {
            text = "Flipped the image **vertically**!"
        }
        return this.reply(text, attachment)
    }
}
