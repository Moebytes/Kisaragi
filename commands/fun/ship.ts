/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import canvas from "@napi-rs/canvas"
import {Message, AttachmentBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Kisaragi} from "./../../structures/Kisaragi"
import fs from "fs"
import path from "path"

export default class Ship extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Ships two users.",
            help:
            `
            \`ship @user1 @user2\` - Ships two users.
            `,
            examples:
            `
            \`=>ship @user1 @user2\`
            `,
            aliases: ["shipping"],
            cooldown: 5,
            subcommandEnabled: true
        })
        const user1Option = new SlashCommandOption()
            .setType("user")
            .setName("user1")
            .setDescription("The first user to ship.")
            .setRequired(true)

        const user2Option = new SlashCommandOption()
            .setType("user")
            .setName("user2")
            .setDescription("The second user to ship.")
            .setRequired(true)

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(user1Option)
            .addOption(user2Option)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        if (!args[2]) {
            return this.reply(`You need to mention two users! ${discord.getEmoji("kannaWave")}`)
        }
        const user1ID = args[1].match(/\d+/)?.[0] || ""
        const user1 = await message.guild?.members.fetch(user1ID)
        const user2ID = args[2].match(/\d+/)?.[0] || ""
        const user2 = await message.guild?.members.fetch(user2ID)
        const shipname = String(user1?.user.displayName.substring(0, user1.displayName.length/2)) + String(user2?.displayName.substring(user2.displayName.length/2))

        const can = new canvas.Canvas(128*3, 128)
        const ctx = can.getContext("2d")

        const av1 = await canvas.loadImage(user1?.user.displayAvatarURL({extension: "png"})!)
        const av2 = await canvas.loadImage(user2?.user.displayAvatarURL({extension: "png"})!)
        const heart = await canvas.loadImage(fs.readFileSync(path.join(__dirname, "../../assets/images/heart.png")))
        ctx.drawImage(av1, 0, 0, can.width/3, can.height)
        ctx.drawImage(heart, can.width/3, 0, can.width/3, can.height)
        ctx.drawImage(av2, (can.width/3)*2, 0, can.width/3, can.height)

        const attachment = new AttachmentBuilder(can.toBuffer("image/png"), {name: "ship.png"})

        return this.reply(`Aww, what a cute shipping! ${discord.getEmoji("gabrielLick")}\n` +
            `_Shipping Name:_ **${shipname}**`, attachment)
    }
}
