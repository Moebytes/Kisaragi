 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Permission} from "../../structures/Permission"
import {Kisaragi} from "./../../structures/Kisaragi"
import {PixivApi} from "./../../structures/PixivApi"

export default class Stockings extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Posts pictures of anime girls wearing stockings.",
            help:
            `
            \`stockings\` - Sends pictures of anime girls in stockings.
            `,
            examples:
            `
            \`=>stockings\`
            `,
            aliases: ["leggings", "tights"],
            random: "none",
            cooldown: 10,
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
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const pixiv = new PixivApi(discord, message)

        const pixivArray = await pixiv.animeEndpoint("stockings", 20)
        return embeds.createReactionEmbed(pixivArray, true, true)
    }
}