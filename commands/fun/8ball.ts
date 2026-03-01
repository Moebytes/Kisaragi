/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Eightball extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Responds to your question.",
            help:
            `
            \`8ball question\` - Answers your question.
            `,
            examples:
            `
            \`=>8ball do you love me?\`
            `,
            aliases: ["eightball"],
            cooldown: 3,
            subcommandEnabled: true
        })
        const questionOption = new SlashCommandOption()
            .setType("string")
            .setName("question")
            .setDescription("question")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName("8ball")
            .setDescription(this.options.description)
            .addOption(questionOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message

        const responses = [
            `Uhh... maybe? ${discord.getEmoji("tohruThink")}`,
            `No ${discord.getEmoji("no")}`,
            `Yes ${discord.getEmoji("yes")}`,
            `That's a bit lewd ${discord.getEmoji("madokaLewd")}`,
            `I don't think that's a good idea ${discord.getEmoji("sagiriBleh")}`,
            `Sounds cool ${discord.getEmoji("aquaUp")}`,
            `That's a little much ${discord.getEmoji("kaosWTF")}`,
            `What was that ${discord.getEmoji("kannaCurious")}`,
            `Ehh... why not ${discord.getEmoji("mexShrug")}`,
            `Do what you want ${discord.getEmoji("raphi")}`,
            `Sure ${discord.getEmoji("gabYes")}`,
            `Hell no ${discord.getEmoji("kannaFU")}`,
            `Seriously ${discord.getEmoji("vigneDead")}`,
            `The loli police is out to get you ${discord.getEmoji("kannaFreeze")}`,
            `I won't answer that ${discord.getEmoji("gabuChrist")}`,
            `Well go ahead ${discord.getEmoji("smolMiku")}`
        ]

        const msg = Functions.combineArgs(args, 1).trim()
        if (!msg) return message.reply(`Umm... what are you asking ${discord.getEmoji("kannaFacepalm")}`)
        return this.reply(responses[Math.floor(Math.random()*responses.length)])
    }
}
