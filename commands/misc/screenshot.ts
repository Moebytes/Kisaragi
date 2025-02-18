import {Message, AttachmentBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Images} from "../../structures/Images"
import {Permission} from "../../structures/Permission"
import captureWebsite from "capture-website"
import path from "path"
import fs from "fs"

export default class Screenshot extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Posts a website screenshot.",
          help:
            `
            \`screenshot url\` - Posts the screenshot of the webpage
            \`screenshot mobile url\` - Posts the screenshot of the mobile version of the site
            `,
          examples:
            `
            \`=>screenshot https://www.youtube.com/\`
            \`=>screenshot mobile https://www.youtube.com/\`
            `,
          aliases: ["screencap"],
          cooldown: 15,
          defer: true,
          subcommandEnabled: true
        })
        const url2Option = new SlashCommandOption()
            .setType("string")
            .setName("url2")
            .setDescription("The url to screencap if you specified mobile.")

        const urlOption = new SlashCommandOption()
            .setType("string")
            .setName("url")
            .setDescription("The url to screencap or mobile for a mobile screenshot.")

        this.subcommand = new SlashCommandSubcommand()
          .setName(this.constructor.name.toLowerCase())
          .setDescription(this.options.description)
          .addOption(urlOption)
          .addOption(url2Option)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const images = new Images(discord, message)
        if (!perms.checkBotDev()) return

        let input = (args[1] === "return") ? Functions.combineArgs(args, 2) : Functions.combineArgs(args, 1)
        let setMobile = false
        if (/mobile/.test(input)) {
          setMobile = true
          input = input.replace("mobile", "").trim()
        }
        const website = (input.startsWith("http")) ? input.trim() : `https://${input.trim()}`

        const options = {
          darkMode: true, delay: 1, overwrite: true, width: 1280, height: 720, userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36"
        } as any
        if (process.platform === "linux") options.launchOptions = {executablePath: "/usr/bin/chromium-browser"}
        if (setMobile) options.emulateDevice = "iPhone XR"

        let dest = path.join(__dirname, `../../misc/images/dump/screenshot.png`)
        let i = 0
        while (fs.existsSync(dest)) {
            dest = path.join(__dirname, `../../misc/images/dump/screenshot${i}.png`)
            i++
        }

        try {
          await captureWebsite.file(website, dest, options)
        } catch (err) {
          console.log(err)
          return message.reply("Could not find this webpage!")
        }
        const bytes = fs.readFileSync(dest)
        const attachment = new AttachmentBuilder(bytes, {name: "image.png"}) as any

        if (args[1] === "return") {
          const link = await images.upload(dest, true)
          return link
        }
        const screenEmbed = embeds.createEmbed()
        screenEmbed
        .setAuthor({name: "google chrome", iconURL: "https://kisaragi.moe/assets/embed/screenshot.png"})
        .setTitle(`**Website Screenshot** ${discord.getEmoji("kannaXD")}`)
        .setImage(`attachment://image.png`)
        this.reply(screenEmbed, attachment)
        fs.unlinkSync(dest)
  }
}
