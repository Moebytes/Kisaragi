 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommand} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {CommandFunctions} from "../../structures/CommandFunctions"
import {Kisaragi} from "../../structures/Kisaragi"
import fs from "fs"
import path from "path"

export default class Website2Slash extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Website 2 commands",
            unlist: true,
            slashEnabled: true
        })

        const commandDir = fs.readdirSync(path.join(__dirname, "./"))

        let subcommands = [] as any

        for (let commandFile of commandDir) {
            if (!commandFile.endsWith(".ts") && !commandFile.endsWith(".js")) continue
            const commandName = commandFile.replace(".js", "").replace(".ts", "")
            if (commandName === this.constructor.name.toLowerCase()) continue

            const command = new (require(path.join(__dirname, commandFile)).default)(this.discord, this.message)

            if (command.options.subcommandEnabled) {
                subcommands.push(command.subcommand)
            }
        }

        const slashCommand = new SlashCommand()
            .setName(this.constructor.name.toLowerCase().replace("slash", ""))
            .setDescription(this.options.description)

        for (const subcommand of subcommands) {
            slashCommand.addSubcommand(subcommand)
        }

        this.slash = slashCommand.toJSON()
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const cmd = new CommandFunctions(this.discord, this.message)
        const subcommand = args[1]

        const command = discord.commands.get(subcommand)
        if (!command) return
        args.shift()
        command.message = message
        cmd.runCommandClass(command, this.message, args)
    }
}