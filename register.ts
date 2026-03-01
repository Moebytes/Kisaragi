 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import "dotenv/config"
import {REST, Routes} from "discord.js"
import {Command} from "./structures/Command"
import {Logger} from "./structures/Logger"
import fs from "fs"
import path from "path"

class Dummy {
    constructor() {}
    public getEmoji = () => null
}

let token = process.env.TESTING === "yes" ? process.env.TEST_TOKEN! : process.env.TOKEN!
let clientID = process.env.TESTING === "yes" ? process.env.TEST_CLIENT_ID! : process.env.CLIENT_ID!
let ownerServer = process.env.TESTING === "yes" ? process.env.TEST_OWNER_SERVER! : process.env.OWNER_SERVER!

let devCommands = [] as any
let slashCommands = [] as any

const register = async () => {
    const subDirectory = fs.readdirSync(path.join(__dirname, "./commands/"))

    for (let i = 0; i < subDirectory.length; i++) {
        const currDir = subDirectory[i]
        const addFiles = fs.readdirSync(path.join(__dirname, `./commands/${currDir}`))

        await Promise.all(addFiles.map(async (file: string) => {
            if (!file.endsWith(".ts") && !file.endsWith(".js")) return
            const p = `../commands/${currDir}/${file}`
            const commandName = file.split(".")[0]
            if (commandName === "empty" || commandName === "tempCodeRunnerFile") return
            
            const command = new (require(path.join(__dirname, `./commands/${currDir}/${file}`)).default)(new Dummy(), null) as Command

            if (command.options.slashEnabled && command.slash) {
                if (command.options.botdev) {
                    devCommands.push(command.slash)
                } else {
                    slashCommands.push(command.slash)
                }
            }

            if (command.options.contextEnabled && command.context) {
                if (command.options.botdev) {
                    devCommands.push(command.context)
                } else {
                    slashCommands.push(command.context)
                }
            }
        }))
    }

    const rest = new REST().setToken(token)

    try {
        await rest.put(Routes.applicationCommands(clientID), {body: slashCommands})
        await rest.put(Routes.applicationGuildCommands(clientID, ownerServer), {body: devCommands})
        Logger.log(`Refreshed ${slashCommands.length} application (/) commands.`)
    } catch (error) {
        console.error(error)
    }
}

register()