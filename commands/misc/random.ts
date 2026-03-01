 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommand} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {CommandFunctions} from "./../../structures/CommandFunctions"
import {Embeds} from "./../../structures/Embeds"
import {Permission} from "./../../structures/Permission"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Random extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Executes a random command, excluding permission related commands.",
            help:
            `
            \`random\` - Gets a random command
            `,
            examples:
            `
            \`=>random\`
            `,
            aliases: ["r", "rc", "rand", "randomcommand"],
            cooldown: 10,
            voteLocked: true,
            slashEnabled: true
        })
        this.slash = new SlashCommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .toJSON()
    }

    public specificCommand = async (cmd: CommandFunctions, command: Command, name: string) => {
        const args: string[] = [name]
        await cmd.runCommandClass(command, this.message, args)
    }

    public randString = () => {
        const strings = [
            "anime",
            "manga",
            "gabriel dropout",
            "konosuba",
            "dragon maid",
            "azur lane",
            "kancolle",
            "kisaragi",
            "satania",
            "tohru",
            "kanna"
        ]
        return strings[Math.floor(Math.random()*strings.length)]
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const cmd = new CommandFunctions(discord, message)
        const perms = new Permission(discord, message)

        const commands = [...discord.commands.values()].filter((command) => {
            if (!command.options.random || command.options.random === "ignore") return false
            if (command.options.unlist) return false
            if (command.options.nsfw) if (!perms.checkNSFW(true)) return false
            return true
        })
        const random = Math.floor(Math.random()*commands.length)
        const name = commands[random].name
        const command = commands[random]
        switch (command.options.random) {
            case "none":
                await cmd.runCommandClass(command, message, [name])
                break
            case "string":
                await cmd.runCommandClass(command, message, [name, this.randString()])
                break
            case "specific":
                await this.specificCommand(cmd, command, name)
                break
            default:
        }
        return
    }
}
