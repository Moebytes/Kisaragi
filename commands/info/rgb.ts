import canvas from "@napi-rs/canvas"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Message, AttachmentBuilder} from "discord.js"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"

export default class RGB extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Posts a visual representation of a color.",
          help:
          `
          \`rgb #color\` - Posts a color (word/hex/rgb)
          `,
          examples:
          `
          \`=>rgb red\`
          \`=>rgb #FFFFFF\`
          \`=>rgb 50 50 50\`
          `,
          aliases: ["color"],
          cooldown: 5,
          subcommandEnabled: true
        })
        const colorOption = new SlashCommandOption()
            .setType("string")
            .setName("color")
            .setDescription("The color to post.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(colorOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)

        let rgb = false
        let [r, b, g] = ["", "", ""]
        if (args[3]) {
            rgb = true
            r = args[1]
            b = args[2]
            g = args[3]
        }

        if (!args[1]) {
            return this.noQuery(embeds.createEmbed()
            .setTitle(`**RGB Color** ${discord.getEmoji("raphiSmile")}`), "You need to specify the color.")
        }

        let str = ""
        if (rgb) {
            str = `rgb(${r}, ${b}, ${g})`
        } else {
            str = Functions.combineArgs(args, 1).trim()
        }

        const can = canvas.createCanvas(200, 100)
        const ctx = can.getContext("2d")

        ctx.fillStyle = str
        ctx.fillRect(0, 0, can.width, can.height)

        ctx.font = "30px 07nikumarufont"
        ctx.fillStyle = "#ffffff"
        ctx.strokeStyle = "#000000"
        ctx.fillText(str, 0, 95)
        ctx.strokeText(str, 0, 95)

        const attachment = new AttachmentBuilder(can.toBuffer("image/png"), {name: "color.png"})

        const colorEmbed = embeds.createEmbed()
        .setTitle(`**RGB Color** ${discord.getEmoji("raphiSmile")}`)
        .setImage(`attachment://color.png`)

        return this.reply(colorEmbed, attachment)
    }
}
