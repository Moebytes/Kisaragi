import {Message, TextChannel, ChannelType, EmbedBuilder, AttachmentBuilder} from "discord.js"
import {Kisaragi} from "./Kisaragi"
import {SQLQuery} from "./SQLQuery"
import {Command} from "./Command"
import path from "path"

const noCmdCool = new Set()

const autoTimeouts = new Map<string, NodeJS.Timeout>()
const updateTimeouts = new Map<string, NodeJS.Timeout>()

export class CommandFunctions {
    constructor(private readonly discord: Kisaragi, private readonly message: Message) {}

    // Run Command
    public runCommand = async (msg: Message, args: string[], noMsg?: boolean) => {
        args = args.filter(Boolean)
        const command = this.findCommand(args?.[0])
        if (!command) return this.noCommand(args?.[0], noMsg)
        if (command.options.guildOnly) {
            // @ts-ignore
            if (msg.channel.type === ChannelType.DM) return msg.channel.send(`<@${msg.author.id}>, sorry but you can only use this command in guilds ${this.discord.getEmoji("smugFace")}`)
        }
        command.message = this.message
        let data: any
        await new Promise<void>(async (resolve, reject) => {
            await command.run(args).then((d: any) => {
                data = d
                resolve()
            })
            .catch((err: Error) => {
                if (msg) this.discord.send(msg, this.discord.cmdError(msg, err))
                reject()
            })
        })
        return data
    }

    // Run Command (from Class)
    public runCommandClass = async (cmd: Command, msg: Message, args: string[]) => {
        cmd.message = msg
        if (cmd.options.guildOnly) {
            // @ts-ignore
            if (msg.channel?.type === ChannelType.DM) return msg.channel.send(`<@${msg.author.id}>, sorry but you can only use this command in guilds ${this.discord.getEmoji("smugFace")}`)
        }
        let data: any
        await new Promise<void>(async (resolve, reject) => {
            await cmd.run(args).then((d: any) => {
                data = d
                resolve()
            })
            .catch((err: Error) => {
                if (msg) this.discord.send(msg, this.discord.cmdError(msg, err))
                reject()
            })
        })
        return data
    }

    // Auto Command
    public autoCommand = async () => {
        const sql = new SQLQuery(this.message)
        const commands = await sql.fetchColumn("guilds", "auto commands")
        if (!commands) return
        const channels = await sql.fetchColumn("guilds", "auto channels")
        const frequencies = await sql.fetchColumn("guilds", "auto frequencies")
        const toggles = await sql.fetchColumn("guilds", "auto toggles")
        for (let i = 0; i < commands.length; i++) {
            if (!toggles?.[i] || toggles[i] === "inactive") continue
            const guildChannel = (this.message.guild?.channels.cache.find((c) => c.id === channels[i])) as TextChannel
            if (!guildChannel) continue
            const cmd = commands[i].split(" ")
            const timeout = Number(frequencies[i]) * 3600000
            let rawTimesLeft = await sql.fetchColumn("guilds", "timeouts") || []
            let timeLeft = rawTimesLeft[i] ? Math.max(Number(rawTimesLeft[i]), 0) : timeout
            const guildMsg = await guildChannel.messages.fetch({limit: 1}).then((m) => m.first())

            const key = `${this.message.guild?.id}_${i}`

            if (updateTimeouts.has(key)) clearTimeout(updateTimeouts.get(key))
            if (autoTimeouts.has(key)) clearTimeout(autoTimeouts.get(key))

            const update = async () => {
                const toggles = await sql.fetchColumn("guilds", "auto toggles")
                if (!toggles?.[i] || toggles[i] === "inactive") {
                    clearTimeout(updateTimeouts.get(key))
                    return updateTimeouts.delete(key)
                }
                timeLeft = Math.max(timeLeft - 60000, 0)
                rawTimesLeft[i] = timeLeft
                await sql.updateColumn("guilds", "auto timeouts", rawTimesLeft)
                const timeoutId = setTimeout(update, 60000)
                updateTimeouts.set(key, timeoutId)
            }

            const autoRun = async () => {
                const toggles = await sql.fetchColumn("guilds", "auto toggles")
                if (!toggles?.[i] || toggles[i] === "inactive") {
                    clearTimeout(autoTimeouts.get(key))
                    return autoTimeouts.delete(key)
                }
                const msg = guildMsg ?? this.message
                msg.author.id = this.discord.user!.id
                await this.runCommand(msg, cmd, true)
                const timeoutId = setTimeout(autoRun, timeout)
                autoTimeouts.set(key, timeoutId)
            }

            updateTimeouts.set(key, setTimeout(update, 60000))
            autoTimeouts.set(key, setTimeout(autoRun, timeLeft))
        }
    }

    public noCommand = async (input: string, noMsg?: boolean) => {
        if (noMsg || this.discord.checkMuted(this.message)) return
        if (noCmdCool.has(this.message.guild!.id)) return
        const commands = [...this.discord.commands.values()]
        for (const command of commands) {
            if (command.name.toLowerCase().includes(input.toLowerCase())) {
                noCmdCool.add(this.message.guild!.id)
                setTimeout(() => {noCmdCool.delete(this.message.guild!.id)}, 10000)
                return this.discord.reply(this.message, `This is not a command! Did you mean **${command.name}**?`)
            }
        }
        noCmdCool.add(this.message.guild!.id)
        setTimeout(() => {noCmdCool.delete(this.message.guild!.id)}, 10000)
        return this.discord.reply(this.message, `This is not a command, type **help** for help!`)
    }

    public findCommand = (cmd: string) => {
        let command = this.discord.commands.get(cmd)
        if (!command) {
            loop1:
            for (const parentCommand of this.discord.commands.values()) {
                const aliases = parentCommand.options.aliases
                for (const alias of aliases) {
                    if (alias === cmd) {
                        command = parentCommand
                        break loop1
                    }
                }
            }
        }
        return command
    }
}
