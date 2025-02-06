import child_process from "child_process"
import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import fs from "fs"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Refresh extends Command {
    constructor(discord: Kisaragi, message: Message<true>) {
        super(discord, message, {
          description: "Refreshes all commands and events.",
          help:
          `
          \`refresh\` - Refreshes all commands and events, without needing to restart the bot.
          `,
          examples:
          `
          \`=>refresh\`
          `,
          aliases: ["reload"],
          cooldown: 50,
          botdev: true,
          defer: true,
          subcommandEnabled: true
        })
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const embeds = new Embeds(discord, message)
        if (!perms.checkBotDev()) return
        const subDir = fs.readdirSync("commands")
        const events = fs.readdirSync("events")
        const structures = fs.readdirSync("structures")

        try {
          child_process.execSync("npm run build")
        } catch {
          // ignore
        }
        for (let i = 0; i < subDir.length; i++) {
          if (subDir[i] === ".DS_Store") continue
          const commands = fs.readdirSync(`commands/${subDir[i]}`)
          for (let j = 0; j < commands.length; j++) {
            try {
              delete require.cache[require.resolve(`../${subDir[i]}/${commands[j].slice(0, -3)}`)]
              new (require(`../${subDir[i]}/${commands[j].slice(0, -3)}`).default)(discord, message)
            } catch {
              continue
            }
          }
        }
        for (let i = 0; i < events.length; i++) {
          try {
            delete require.cache[require.resolve(`../../events/${events[i].slice(0, -3)}`)]
            const event = new (require(`../../events/${events[i].slice(0, -3)}`).default)(discord)
            discord.removeAllListeners(events[i].slice(0, -3))
            discord.on(events[i].slice(0, -3) as any, (...args: any) => event.run(...args))
          } catch {
            continue
          }
        }
        for (let i = 0; i < structures.length; i++) {
          try {
            delete require.cache[require.resolve(`../../structures/${structures[i].slice(0, -3)}`)]
          } catch {
            continue
          }
        }
        const reloadEmbed = embeds.createEmbed()
        .setTitle(`**Refresh** ${discord.getEmoji("gabStare")}`)
        .setDescription(`All commands and events were refreshed!`)
        return this.reply(reloadEmbed)
    }
}
