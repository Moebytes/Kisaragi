import "dotenv/config"
import {DefaultWebSocketManagerOptions, GatewayIntentBits, Partials} from "discord.js"
import fs from "fs"
import path from "path"
import * as config from "./config.json"
// import Server from "./server"
import {Functions} from "./structures/Functions"
import {Kisaragi} from "./structures/Kisaragi"
import {Logger} from "./structures/Logger"
import {SQLQuery} from "./structures/SQLQuery"

const discord = new Kisaragi({
    allowedMentions: {parse: ["users"]},
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    rest: {
        offset: 0
    }
})

// @ts-ignore
DefaultWebSocketManagerOptions.identifyProperties.browser = "Discord iOS"

const dumps = [
    `./assets/misc/images/dump`,
    `./assets/misc/images/gifs`,
    `./assets/misc/images/misc`,
    `./assets/misc/images/pages`,
    `./assets/misc/images/pixiv/illusts`,
    `./assets/misc/images/pixiv/profiles`,
    `./assets/misc/images/pixiv/zip`,
    `./assets/misc/images/waifu2x`,
    `./assets/misc/dump`,
    `./assets/misc/tracks`,
    `./assets/misc/videos`,
    `./assets/misc/tracks/transform`,
    `./assets/misc/images/transform`,
    `./assets/misc/videos/transform`
]

Functions.removeDirectory(path.join(__dirname, "./assets/misc"))

for (let i = 0; i < dumps.length; i++) {
    fs.mkdirSync(path.join(__dirname, dumps[i]), {recursive: true})
}

const start = async (): Promise<void> => {
    await SQLQuery.createDB()
    //await SQLQuery.purgeTable("commands")

    let commandCounter = 0
    const cmdFiles: string[][] = []
    const subDirectory = fs.readdirSync(path.join(__dirname, "./commands/"))

    for (let i = 0; i < subDirectory.length; i++) {
        const currDir = subDirectory[i]
        const addFiles = fs.readdirSync(path.join(__dirname, `./commands/${currDir}`))
        if (addFiles !== null) cmdFiles.push(addFiles)

        let category = currDir
        if (category === "japanese") category = "weeb"
        discord.categories.add(category)

        await Promise.all(addFiles.map(async (file: string) => {
            if (!file.endsWith(".ts") && !file.endsWith(".js")) return
            const p = `../commands/${currDir}/${file}`
            const commandName = file.split(".")[0]
            if (commandName === "empty" || commandName === "tempCodeRunnerFile") return
            const cmdFind = await SQLQuery.fetchCommand(commandName, "command")
            const command = new (require(path.join(__dirname, `./commands/${currDir}/${file}`)).default)(discord, null)

            command.name = commandName 
            command.category = category
            command.path = p

            discord.commands.set(commandName, command)

            if (!cmdFind) {
                await SQLQuery.insertCommand(commandName, p, command)
            } else {
                await SQLQuery.updateCommand(commandName, p, command)
            }
            commandCounter++
            Logger.log(`Loading Command: ${commandName}`)
        }))
    }

    const evtFiles = fs.readdirSync("./events/")

    await Promise.all(evtFiles.map(async (file: string) => {
        if (!file.endsWith(".ts") && !file.endsWith(".js")) return
        const eventName = file.split(".")[0] as any
        Logger.log(`Loading Event: ${eventName}`)
        const event = new (require(path.join(__dirname, `./events/${eventName}`)).default)(discord)
        if (eventName) {
        discord.on(eventName, (...args: any) => event.run(...args))
        }
    }))

    Logger.log(`Loaded a total of ${commandCounter} commands.`)
    Logger.log(`Loaded a total of ${evtFiles.length} events.`)

    //const server = new Server()
    //server.run()

    const token = config.testing ? process.env.TEST_TOKEN : process.env.TOKEN
    await discord.login(token)
    discord.setPfp(discord.user!.displayAvatarURL({extension: "png"}))
    discord.setUsername(discord.user!.username)

    //Functions.pollTwitch(discord)
    //Functions.youtubeReSubscribe()
    SQLQuery.redisSet("state", JSON.stringify([]))
}

start()

process.on("unhandledRejection", (error) => console.error(error))
process.on("uncaughtException", (error) => console.error(error))
process.on("SIGTERM", () => discord.destroy())