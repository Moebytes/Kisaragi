 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class TOS extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Terms of service for the bot.",
          help:
          `
          \`tos\` - Terms of service
          `,
          examples:
          `
          \`=>tos\`
          `,
          aliases: ["termsofservice"],
          random: "none",
          cooldown: 5,
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

        const termsOfService = embeds.createEmbed()
        termsOfService
        .setAuthor({name: "tos", iconURL: "https://kisaragi.moe/assets/embed/tos.png"})
        .setURL("https://kisaragi.moe/terms")
        .setTitle(`**Terms of Service** ${discord.getEmoji("kannaPat")}`)
        .setDescription(Functions.multiTrim(`
            By using Kisaragi, you agree to abide by the terms of service.
            **Bot Spam and Misuse**
            ${discord.getEmoji("star")}_Content:_ Everything posted by the bot falls under your responsibility. An effort is made to filter content but the nature of many commands is retrieving arbitrary data from the internet.
            ${discord.getEmoji("star")}_API Spam:_ Don't use this bot to spam Discord's API (or any other API it uses).
            ${discord.getEmoji("star")}_Global Chat:_ Don't post anything inappropriate, offensive, or spam. This is a public chat that is visible to everyone who enables it.
            ${discord.getEmoji("star")}_Oauth2:_ Don't misuse oauth2 commands or share oauth2 links created by the bot.
            ${discord.getEmoji("star")}_Abusing Bugs:_ There could be bugs that crash the bot. Please report these bugs with the \`feedback\` command.
            **Punishment**
            Violating the TOS could result in you or your entire server getting blacklisted (blocked from using any commands and blocked from adding the bot to a server).
            **Appeal**
            You can contact me in the support server for an appeal after significant time has passed after your blacklist.
        `))
        return this.reply(termsOfService)
    }
}
