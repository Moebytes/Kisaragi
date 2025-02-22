import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import util from "util"
import {Audio} from "../../structures/Audio"
import {AudioEffects} from "../../structures/AudioEffects"
import {Block} from "../../structures/Block"
import {Captcha} from "../../structures/Captcha"
import {Command} from "../../structures/Command"
import {CommandFunctions} from "../../structures/CommandFunctions"
import {Cooldown} from "../../structures/Cooldown"
import {Detector} from "../../structures/Detector"
import {Generate} from "../../structures/Generate"
import {Haiku} from "../../structures/Haiku"
import {Images} from "../../structures/Images"
import {Link} from "../../structures/Link"
import {Oauth2} from "../../structures/Oauth2"
import {Permission} from "../../structures/Permission"
import {PixivApi} from "../../structures/PixivApi"
import {Points} from "../../structures/Points"
import {SQLQuery} from "../../structures/SQLQuery"
import {Video} from "../../structures/Video"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"

export default class Eval extends Command {
  constructor(discord: Kisaragi, message: Message) {
      super(discord, message, {
          description: "Evaluates Javascript code.",
          help:
          `
          \`eval code\` - Evaluates the code
          `,
          examples:
          `
          \`=>code 1+1\`
          `,
          aliases: [],
          cooldown: 3,
          botdev: true,
          unlist: true,
          subcommandEnabled: false
      })
      const codeOption = new SlashCommandOption()
          .setType("string")
          .setName("code")
          .setDescription("The code.")
          .setRequired(true)
          
      this.subcommand = new SlashCommandSubcommand()
          .setName(this.constructor.name.toLowerCase())
          .setDescription(this.options.description)
          .addOption(codeOption)
  }

  public clean = (text: string) => {
    if (!text) return text
    return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203))
    .replace(process.env.TOKEN!, "insert token here lol")
  }

  public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        return
        /* - Disable this command
        if (!perms.checkBotDev()) return
        const embeds = new Embeds(discord, message)
        const audio = new Audio(discord, message)
        const fx = new AudioEffects(discord, message)
        const images = new Images(discord, message)
        const video = new Video(discord, message)
        const func = new Functions(message)
        const sql = new SQLQuery(message)
        const cmd = new CommandFunctions(discord, message)
        const detect = new Detector(discord, message)
        const haiku = new Haiku(discord, message)
        const block = new Block(discord, message)
        const captcha = new Captcha(discord, message)
        const cooldown = new Cooldown(discord, message)
        const generate = new Generate(discord, message)
        const pixiv = new PixivApi(discord, message)
        const oauth2 = new Oauth2(discord, message)
        const points = new Points(discord, message)
        const link = new Link(discord, message)

        try {
          const code = Functions.combineArgs(args, 1)
          let evaled = await eval(code)
          if (typeof evaled !== "string") evaled = util.inspect(evaled)
          const evalEmbed = embeds.createEmbed()
          evalEmbed
          .setTitle(`**Javascript Code Eval** ${discord.getEmoji("kaosWTF")}`)
          .setDescription(Functions.checkChar(this.clean(evaled), 2000, ""))
          this.reply(evalEmbed)
        } catch (error: any) {
          this.reply(`\`ERROR\` \`\`\`xl\n${this.clean(error)}\n\`\`\``)
        }*/
  }
}