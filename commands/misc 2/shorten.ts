 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import axios from "axios"
import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Shorten extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Shortens a url using is.gd.",
            help:
            `
            \`shorten url\` - Shortens the url
            `,
            examples:
            `
            \`=>shorten https://www.youtube.com/\`
            `,
            aliases: [],
            cooldown: 5,
            subcommandEnabled: true
        })
        const urlOption = new SlashCommandOption()
            .setType("string")
            .setName("url")
            .setDescription("The url to shorten.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(urlOption)
    }

    public run = async (args: string[]) => {
        const message = this.message
        const input = Functions.combineArgs(args, 1)
        const embeds = new Embeds(this.discord, message)
        const headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
        if (!input) return this.noQuery(embeds.createEmbed())
        const json = await axios.get(`https://is.gd/create.php?format=json&url=${input.trim()}`, {headers})
        const newLink = json.data.shorturl
        this.reply(newLink)
    }
}
