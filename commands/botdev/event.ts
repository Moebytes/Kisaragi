/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Collection, Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"

export default class Event extends Command {
  constructor(discord: Kisaragi, message: Message) {
      super(discord, message, {
          description: "Triggers an event.",
          help:
          `
          \`event event\` - Triggers the event
          `,
          examples:
          `
          \`=>event guildCreate\`
          `,
          aliases: [],
          cooldown: 3,
          botdev: true,
          subcommandEnabled: true
      })
      const eventOption = new SlashCommandOption()
          .setType("string")
          .setName("event")
          .setDescription("The event.")
          .setRequired(true)
          
      this.subcommand = new SlashCommandSubcommand()
          .setName(this.constructor.name.toLowerCase())
          .setDescription(this.options.description)
          .addOption(eventOption)
  }

  public run = async (args: string[]) => {
      const discord = this.discord
      const message = this.message
      const perms = new Permission(discord, message)
      if (!perms.checkBotDev()) return
      if (!message.guild || !message.member) return

      const event = Functions.combineArgs(args, 1).trim()
      switch (event) {
        case "guildCreate":
            discord.emit(event, message.guild)
            break
        case "guildDelete":
            discord.emit(event, message.guild)
            break
        case "guildMemberAdd":
            discord.emit(event, message.member)
            break
        case "guildMemberRemove":
            discord.emit(event, message.member)
            break
        case "messageCreate":
            discord.emit(event, message as any)
            break
        case "messageDelete":
            discord.emit(event, message as any)
            break
        case "messageDeleteBulk":
            const col = new Collection() as any
            col.set(message.id, message)
            discord.emit(event as any, col)
            break
        case "messageReactionAdd":
            const reaction = await message.react(discord.getEmoji("aquaUp"))
            discord.emit(event as any, reaction, message.author)
            break
        case "messageReactionRemove":
            const reaction2 = await message.react(discord.getEmoji("aquaUp"))
            discord.emit(event as any, reaction2, message.author)
            break
        case "guildBanAdd":
            discord.emit(event as any, message.guild, message.author)
            break
        case "guildBanRemove":
            discord.emit(event as any, message.guild, message.author)
            break
        case "channelCreate":
            discord.emit(event as any, message.channel)
            break
        case "channelDelete":
            discord.emit(event as any, message.channel)
            break
        case "emojiCreate":
            discord.emit(event as any, discord.getEmoji("chinoSmug"))
            break
        case "emojiDelete":
            discord.emit(event as any, discord.getEmoji("chinoSmug"))
            break
        default:
            discord.emit(event as any)
      }
      return this.reply("Triggered the event!")
  }
}
