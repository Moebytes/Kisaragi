 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import child_process from "child_process"
import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import fs from "fs"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Kisaragi} from "../../structures/Kisaragi"
import {Functions} from "../../structures/Functions"
import {Permission} from "../../structures/Permission"

export default class Reboot extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Reboots the bot.",
          help:
          `
          \`reboot\` - Reboot the bot
          `,
          examples:
          `
          \`=>reboot\`
          `,
          aliases: ["restart"],
          cooldown: 100,
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
        if (!message.channel.isSendable()) return
        if (!perms.checkBotDev()) return

        const subDir = fs.readdirSync("commands")
        for (let i = 0; i < subDir.length; i++) {
          if (subDir[i] === ".DS_Store") continue
          const commands = fs.readdirSync(`commands/${subDir[i]}`)
          for (let j = 0; j < commands.length; j++) {
            try {
              delete require.cache[require.resolve(`../${subDir[i]}/${commands[j]}`)]
            } catch {
              continue
            }
          }
        }

        const loading = message.channel.lastMessage
        if (message instanceof Message) await Functions.deferDelete(loading, 0)

        const rebootEmbed = embeds.createEmbed()
        .setTitle(`**Reboot** ${discord.getEmoji("gabStare")}`)
        .setDescription("Rebooting bot!")

        await this.reply(rebootEmbed)
        child_process.execSync("npm run build")
        process.exit(0)
      }
    }
