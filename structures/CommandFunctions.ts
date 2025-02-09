import {Message, TextChannel, ChannelType, EmbedBuilder, AttachmentBuilder} from "discord.js"
import {Kisaragi} from "./Kisaragi"
import {SQLQuery} from "./SQLQuery"
import {Command} from "./Command"
import path from "path"

const noCmdCool = new Set()

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
            if (!guildChannel) return
            const cmd = commands[i].split(" ")
            const timeout = Number(frequencies[i]) * 3600000
            let rawTimesLeft = await sql.fetchColumn("guilds", "timeouts")
            if (!rawTimesLeft) rawTimesLeft = []
            let timeLeft = timeout
            if (rawTimesLeft[i]) {
                let remaining = Number(rawTimesLeft[i])
                if (remaining <= 0) remaining = timeout
                timeLeft = remaining
            }
            const guildMsg = await guildChannel.messages.fetch({limit: 1}).then((m) => m.first())
            const update = async () => {
                let newTimeLeft = timeLeft - 60000
                if (newTimeLeft <= 0) newTimeLeft = timeout
                const toggles = await sql.fetchColumn("guilds", "auto toggles")
                if (!toggles?.[i] || toggles?.[i] === "inactive" || newTimeLeft === timeout) return
                rawTimesLeft[i] = newTimeLeft
                await sql.updateColumn("guilds", "auto timeouts", rawTimesLeft)
                setTimeout(update, 60000)
            }
            setTimeout(update, 60000)
            const autoRun = async () => {
                if (!toggles?.[i] || toggles?.[i] === "inactive") return
                const msg = guildMsg ?? this.message
                msg.author.id = this.discord.user!.id
                await this.runCommand(msg, cmd, true)
                setTimeout(autoRun, timeout)
            }
            setTimeout(autoRun, timeLeft)
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
