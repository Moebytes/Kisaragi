 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, SlashCommandSubcommandBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Pickle extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: `Posts your pickle size`,
            help:
            `
            _Note:_ The sizes are seeded and won't change ${discord.getEmoji("tohruSmug")}
            \`pickle\` - Gets your pickle size.
            \`pickle @user\` - Gets the pickle size of the user.
            `,
            examples:
            `
            \`=>pickle\`
            `,
            aliases: ["pp", "peepee", "hotdog", "dong", "cock", "dick", "penis", "sausage", "fun stick", "schlong", "willy", "ding dong", "peen", "meat stick"],
            random: "none",
            cooldown: 3,
            subcommandEnabled: true
        })
        const userOption = new SlashCommandOption()
            .setType("user")
            .setName("user")
            .setDescription("Which user's pickle to get.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription("Posts your pickle size.")
            .addOption(userOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)

        let seed = message.author.id
        let name = message.author.username
        if (args[1]) {
            seed = args[1].match(/\d+/)?.[0] || "0"
            const user = await message.guild?.members.fetch(seed)
            if (user) name = user.user.username
        }

        function seededRandom(seed: number) {
            const x = Math.sin(seed) * 10000
            return x - Math.floor(x)
        }

        const random = seededRandom(Number(seed))
        const pickleSize = random * 10
        let flavorText = ""
        if (pickleSize < 4) {
                flavorText = `How unfortunate... ${discord.getEmoji("chinoSmug")}`
        } else if ((pickleSize > 4) && pickleSize < 7) {
                flavorText = `That's pretty average. ${discord.getEmoji("mexShrug")}`
        } else {
                flavorText = `Wow... ${discord.getEmoji("raphi")}`
        }
        return this.reply(`**${name}**, your ${args[0]} size is **${pickleSize.toFixed(2)}inches** (${(pickleSize*2.54).toFixed(2)}cm). ${flavorText}`)
    }
}
