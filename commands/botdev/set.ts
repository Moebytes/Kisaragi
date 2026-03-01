 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, ActivityType} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"

export default class Set extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Sets the bot's activity text.",
            help:
            `
            \`set activity, status\` - Set the activity and status
            `,
            examples:
            `
            \`=>set watching anime, dnd\`
            `,
            aliases: [],
            cooldown: 3,
            botdev: true,
            subcommandEnabled: true
        })
        const textOption = new SlashCommandOption()
            .setType("string")
            .setName("text")
            .setDescription("Set the activity text.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(textOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const embeds = new Embeds(discord, message)

        if (!perms.checkBotDev()) return
        type activityTypes = string | "watching" | "playing" | "streaming" | "listening" | "competing"
        type status = "online" | "dnd" | "idle" | "invisible"
        const activityType = (args[1].toLowerCase() || "playing") as activityTypes
        const name = (Functions.combineArgs(args, 0).split(",")[0] || "=>help")
        const status = (Functions.combineArgs(args, 0).split(",")[1] || "dnd") as status

        const activityMap = {
            "playing": ActivityType.Playing,
            "watching": ActivityType.Watching,
            "listening": ActivityType.Listening,
            "streaming": ActivityType.Streaming,
            "competing": ActivityType.Competing
        }
        let activity = activityMap[activityType]
        if (!activity) activity = ActivityType.Custom
        const setEmbed = embeds.createEmbed()
        .setTitle(`**Set Presence ${discord.getEmoji("karenSugoi")}**`)

        discord.user!.setPresence({activities: [{name, type: activity, state: status}]})
        this.reply(setEmbed
        .setDescription(`I am now **${status}** and **${name}**!`))
    }
}
