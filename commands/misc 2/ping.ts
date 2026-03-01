 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Ping extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Posts the response time.",
          help:
          `
          \`ping\` - Posts the response time
          `,
          examples:
          `
          \`=>ping\`
          `,
          aliases: [],
          random: "none",
          cooldown: 3,
          subcommandEnabled: true
        })
        this.subcommand = new SlashCommandSubcommand()
          .setName(this.constructor.name.toLowerCase())
          .setDescription(this.options.description)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)

        const pingEmbed = embeds.createEmbed()

        const msg = await this.reply(pingEmbed.setDescription("Ping?"))
        this.edit(msg, pingEmbed
          .setTitle(`**Ping** ${discord.getEmoji("kannaHungry")}`)
          .setDescription(`Ping is **${msg.createdTimestamp - message.createdTimestamp}ms**`))
    }
  }
