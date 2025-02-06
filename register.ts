import "dotenv/config"
import {REST, Routes} from "discord.js"

import {Logger} from "./structures/Logger"
import fs from "fs"
import path from "path"

class Dummy {
    constructor() {}
    public getEmoji = () => null
}

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
            
            const command = new (require(path.join(__dirname, `./commands/${currDir}/${file}`)).default)(new Dummy(), null)

            if (command.options.slashEnabled && command.slash) {
                if (command.options.botdev) {
                    devCommands.push(command.slash)
                } else {
                    slashCommands.push(command.slash)
                }
            }
        }))
    }

    const rest = new REST().setToken(process.env.TOKEN!)

    try {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {body: slashCommands})
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.OWNER_SERVER!), {body: devCommands})
        Logger.log(`Refreshed ${slashCommands.length} application (/) commands.`)
    } catch (error) {
        console.error(error)
    }
}

register()