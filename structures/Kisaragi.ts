import {MessagePayload, ChannelType, Client, ClientOptions, Guild, Collection, GuildBasedChannel, MessageFlags,
ApplicationEmoji, GuildEmoji, Message, MessageTarget, Role, TextChannel, User, PartialMessage, AttachmentBuilder,
EmbedBuilder, GuildMember, ChatInputCommandInteraction, MessageReplyOptions, SendableChannels, ContextMenuCommandInteraction, 
ButtonInteraction, InteractionReplyOptions, StringSelectMenuInteraction} from "discord.js"
import querystring from "querystring"
import muted from "../assets/json/muted.json"
import {Command} from "../structures/Command"
import config from "./../config.json"
import {Embeds} from "./Embeds"
import {Functions} from "./Functions"
import {SQLQuery} from "./SQLQuery"
import axios from "axios"

export class Kisaragi extends Client {
    public readonly categories = new Set<string>()
    public readonly commands: Collection<string, Command> = new Collection()
    public readonly cooldowns: Collection<string, Collection<string, number>> = new Collection()
    public readonly activeEmbeds = new Set<string>()
    public static ignoreDelete = new Set<string>()
    public static username = "Kisaragi"
    public static pfp = "https://cdn.discordapp.com/avatars/593838271650332672/78ec2f4a3d4ab82a40791cb522cf36f5.png?size=2048"
    public replyStatus = "rejected"
    public muted = false
    
    constructor(options: ClientOptions) {
        super(options)
    }

    /** Set the pfp */
    public setPfp = (pfp: string) => {
        Kisaragi.pfp = pfp
    }

    /** Set the username */
    public setUsername = (username: string) => {
        Kisaragi.username = username
    }

    /** Reply or follow up */
    public reply = async (input: Message | ChatInputCommandInteraction | ContextMenuCommandInteraction | ButtonInteraction | 
    StringSelectMenuInteraction, embeds: EmbedBuilder | EmbedBuilder[] | string, files?: AttachmentBuilder | AttachmentBuilder[], 
    opts?: MessageReplyOptions) => {
        let options = {...opts} as InteractionReplyOptions
        if (!(input instanceof Message)) {
            const flags = this.isUncachedInteraction(input) ? MessageFlags.Ephemeral : undefined
            options.flags = flags
            // @ts-expect-error patch interaction reply to return message
            input.reply = ((originalReply) => {
                return async function (options: InteractionReplyOptions) {
                    await originalReply.call(this, {...options, withResponse: true})
                    return input.fetchReply()
                }
            })(input.reply)
        }
        if (Array.isArray(embeds)) {
            options.embeds = embeds
        } else if (embeds instanceof EmbedBuilder) {
            options.embeds = [embeds]
        } else if (typeof embeds === "string") {
            options.content = embeds
        }
        if (files) options.files = Array.isArray(files) ? files : [files]
        if (!(input instanceof Message) && (input.deferred || input.replied)) {
            const flags = input.ephemeral ? MessageFlags.Ephemeral : undefined
            options.flags = flags
            return input.followUp(options)
        }
        // @ts-expect-error
        return input.reply(options) as Promise<Message>
    }

    /** Defer this reply */
    public deferReply = (interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction) => {
        const flags = this.isUncachedInteraction(interaction) ? MessageFlags.Ephemeral : undefined
        return interaction.deferReply({flags})
    }
    
    /** Send message to a channel */
    public send = (input: Message | ChatInputCommandInteraction | ContextMenuCommandInteraction, embeds: EmbedBuilder | EmbedBuilder[] | string, 
        files?: AttachmentBuilder | AttachmentBuilder[], opts?: MessageReplyOptions) => {
        if (!opts) opts = {}
        let flags = undefined as number | undefined
        if (!(input instanceof Message)) {
            flags = this.isUncachedInteraction(input) ? MessageFlags.Ephemeral : undefined
        }
        opts.flags = flags
        if (!input.channel) return this.reply(input, embeds, files, opts)
        if (!input.channel?.isSendable()) return Promise.resolve(input as Message)
        return this.channelSend(input.channel, embeds, files, opts)
    }

    /** Send message to a channel */
    public channelSend = (channel: SendableChannels, embeds: EmbedBuilder | EmbedBuilder[] | string, 
        files?: AttachmentBuilder | AttachmentBuilder[], opts?: MessageReplyOptions) => {
        let options = {...opts} as any
        if (Array.isArray(embeds)) {
            options.embeds = embeds
        } else if (embeds instanceof EmbedBuilder) {
          options.embeds = [embeds]
        } else if (typeof embeds === "string") {
          options.content = embeds
        }
        if (files) options.files = Array.isArray(files) ? files : [files]
        return channel.send(options)
    }

    /** Send message to a user */
    public dmSend = (user: User | GuildMember,embeds: EmbedBuilder | EmbedBuilder[] | string, 
        files?: AttachmentBuilder | AttachmentBuilder[], opts?: MessageReplyOptions) => {
        let options = {...opts} as any
        if (Array.isArray(embeds)) {
            options.embeds = embeds
        } else if (embeds instanceof EmbedBuilder) {
            options.embeds = [embeds]
        } else if (typeof embeds === "string") {
            options.content = embeds
        }
        if (files) options.files = Array.isArray(files) ? files : [files]
        return user.send(options)
    }

    /** Edit message */
    public edit = (msg: Message | ButtonInteraction | StringSelectMenuInteraction, embeds: EmbedBuilder | EmbedBuilder[] | string, 
        files?: AttachmentBuilder | AttachmentBuilder[], opts?: MessageReplyOptions) => {
        let options = {...opts} as any
        if (Array.isArray(embeds)) {
            options.embeds = embeds
        } else if (embeds instanceof EmbedBuilder) {
            options.embeds = [embeds]
        } else if (typeof embeds === "string") {
            options.content = embeds
        }
        if (files) options.files = Array.isArray(files) ? files : [files]
        if (msg instanceof Message) {
            return msg.edit(options)
        } else {
            options.flags = this.isUncachedInteraction(msg) ? MessageFlags.Ephemeral : undefined
            return msg.update(options)
        }
    }

    /** Display avatar */ 
    public displayAvatar = (message: Message | ChatInputCommandInteraction) => {
        if (!message) return this.user?.displayAvatarURL({size: 512})
        // @ts-ignore
        let member = message.member ? message.member : message.author
        if (!member.hasOwnProperty("displayAvatarURL")) {
            // @ts-ignore
            let avatar = `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.webp?size=512`
            if (message.member?.avatar) avatar = `https://cdn.discordapp.com/guilds/${message.guildId}/users/${message.member.user.id}/avatars/${message.member.avatar}.webp?size=512`
            return avatar
        }
        return member.displayAvatarURL({size: 512})
    }

    /** Get emojis (application emojis) */
    public getEmoji = (name: string, png?: boolean) => {
        const emoji = this.application?.emojis.cache.find((e) => (png ? e.name === `${name}png` : e.name === name))
        if (emoji) {
            return emoji as ApplicationEmoji
        } else {
            // Confused Anime
            return this.application?.emojis.cache.get("1276355176852099225") as ApplicationEmoji
        }
    }

    /** Get emoji (all servers) */
    public getEmojiGlobal = <B extends boolean = false>(resolvable: string, noString?: B): B extends true ? GuildEmoji | null : string | null => {
        if (!resolvable) return null as any
        let emoji: GuildEmoji | undefined
        if (Number(resolvable)) {
            emoji = this.emojis.cache.find((e) => e.id === resolvable)
        } else {
            emoji = this.emojis.cache.find((e) => e.name === resolvable)
        }
        if (!emoji) return null as any
        if (noString) return emoji as any
        const emojiTag = emoji.animated ? `<${emoji.identifier}>` : `<:${emoji.identifier}>`
        return emojiTag as any
    }

    /** Get emoji (current server) */
    public getEmojiServer = <B extends boolean = false>(resolvable: string, message: Message, noString?: B): B extends true ? GuildEmoji | null : string | null => {
        if (!resolvable || !message.guild) return null as any
        let emoji: GuildEmoji | undefined
        if (Number(resolvable)) {
            emoji = message.guild.emojis.cache.find((e) => e.id === resolvable)
        } else {
            emoji = message.guild.emojis.cache.find((e) => e.name === resolvable)
        }
        if (!emoji) return null as any
        if (noString) return emoji as any
        const emojiTag = emoji.animated ? `<${emoji.identifier}>` : `<:${emoji.identifier}>`
        return emojiTag as any
    }

    /** Find a role in the guild */
    public getRole = (guild: Guild, resolvable: string) => {
        if (!resolvable) return null
        let role: Role | undefined
        if (Number(resolvable)) {
            role = guild.roles.cache.find((r) => r.id === resolvable)
        } else {
            role = guild.roles.cache.find((r) => r.name.toLowerCase().includes(resolvable.toLowerCase()))
        }
        if (!role) return null
        return role
    }

    /** Find a channel in the guild */
    public getChannel = (guild: Guild, resolvable: string) => {
        if (!resolvable) return null
        let channel: GuildBasedChannel | undefined
        if (Number(resolvable)) {
            channel = guild.channels.cache.find((c) => c.id === resolvable)
        } else {
            channel = guild.channels.cache.find((c) => c.name.toLowerCase().includes(resolvable.toLowerCase()))
        }
        if (!channel) return null
        return channel
    }

    // Fetch Message
    public fetchMessage = async (msg: Message, messageID: string) => {
        if (!messageID?.trim()) return undefined
        const channels = msg.guild!.channels.cache.map((c: GuildBasedChannel) => {if (c.type === ChannelType.GuildText && c.permissionsFor(this.user!)?.has("ViewChannel")) return c as TextChannel})
        const msgArray: Message[] = []
        for (let i = 0; i < channels.length; i++) {
            const found = await channels[i]?.messages.fetch({limit: 1, around: messageID})?.then((m) => m.map((m) => m))
            if (found) msgArray.push(...found)
        }
        const msgFound = msgArray.find((m: Message) => m?.id === messageID)
        return msgFound
    }

    // Fetch Last Attachment
    public fetchLastAttachment = async <T extends boolean = false, A extends boolean = false>(message: Message, author?: T, fileExt?: RegExp | false, limit?: number, all?: A):
    Promise<A extends true ? string[] | undefined : (T extends true ? {image: string | undefined, author: User | undefined} : string | undefined)> => {
        if (!limit) limit = 100
        if (!fileExt) fileExt = new RegExp(/.(png|jpe?g|gif|webp)/i)
        const msg = await message.channel.messages.fetch({limit}).then((i) => i.find((m) => m.attachments.size > 0 && m.attachments.first()?.url.match(fileExt as RegExp) !== null))
        if (all) return msg?.attachments.map((a) => a.url) as any
        const image = msg?.attachments.first()?.url
        if (author) return {image, author: msg?.author} as any
        return image as any
    }

    // Get an Invite
    public getInvite = async (guild: Guild | null) => {
        if (!guild || !guild.members.me?.permissions.has("ManageGuild")) return "None"
        const invites = await guild.invites.fetch()
        let invite: string | undefined
        if (invites) {
            invite = invites.find((i)=>i.temporary === false)?.url
            if (!invite) invite = invites.first()?.url
        }
        if (!invite) invite = "None"
        return invite
    }

    // Prune Prompt Responses
    public pruneResponses = async (msg: Message) => {
        const messages = await msg.channel.messages.fetch({limit: 10}).then((m) => m.map((m) => m))
        let i = 0
        while (messages[i].author.id !== this.user?.id) {
            await Functions.deferDelete(messages[i], 0)
            i++
        }
    }

    /* Fetch a message from a Guild */
    public fetchFirstMessage = async (guild: Guild | undefined) => {
        if (!guild) return null
        const channels = guild.channels.cache.filter((c: GuildBasedChannel) => {
            if (c.type === ChannelType.GuildText) {
                const perms = c.permissionsFor(this.user?.id!)
                if (perms?.has(["ViewChannel", "ReadMessageHistory"])) {
                    return true
                }
            }
            return false
        })
        const channel = channels?.first() as TextChannel
        try {
            const lastMsg = await channel?.messages.fetch({limit: 1}).then((c) => c.first())
            return lastMsg
        } catch {
            const lastMsg = channel?.messages.cache.first()
            if (lastMsg) return lastMsg
            return channel?.lastMessage as Message
        }
    }

    // Check for Bot Mention
    public checkBotMention = (message: Message) => {
        if (message.author.bot) return false
        if (!message.content.startsWith("<@")) return false
        const regex = new RegExp(`${this.user?.id}`)
        if (message.content.match(regex)) return true
    }

    // Errors
    public cmdError = (msg: Message, error: Error) => {
        const embeds = new Embeds(this, msg)
        console.log(error)
        const messageErrorEmbed = embeds.createEmbed()
        messageErrorEmbed
        .setTitle(`**Command Error** ${this.getEmoji("maikaWut")}`)
        .setDescription(`There was an error executing this command:\n` +
        `**${error.name}: ${error.message}**\n` +
        `Please report this with the \`feedback\` command, or open an issue on github:\n` +
        `[Github Repository](${config.repo})`)
        return messageErrorEmbed
    }

    /** Stops responding if the user is blacklisted. */
    public blacklistStop = async (msg: Message) => {
        const blacklists = await SQLQuery.selectColumn("blacklist", "user id")
        const found = blacklists.find((u: string) => String(u) === msg.author.id)
        if (found) {
            return true
        } else {
            return false
        }
    }

    /** Mute auto responses/whitelist bot farm protection on bot list servers */
    public checkMuted = (message: Message | PartialMessage) => {
        if (message.partial) return true
        if (!message.guild) {
            if (muted.users.includes(message.author.id)) return true
            return false
        }
        if (muted.guilds.includes(message.guild.id)) {
            return true
        } else {
            const found = message.guild.members.cache.find((m) => muted.users.includes(m.id))
            if (found) return true
            return false
        }
    }

    /** Post guild count on bot lists */
    public postGuildCount = async () => {
        if (process.env.TESTING === "yes") return
        const guildCount = await this.shardedGuildCount()
        const urls = [
            `https://top.gg/api/bots/${this.user!.id}/stats`,
            `https://discord.bots.gg/api/v1/bots/${this.user!.id}/stats`
        ]
        const headers = [
            {"Authorization": process.env.TOP_GG_TOKEN},
            {authorization: process.env.DISCORD_BOTS_TOKEN}
        ]
        const data = [
            {server_count: guildCount},
            {guildCount: guildCount}
        ]
        for (let i = 0; i < urls.length; i++) {
            await axios.post(urls[i], data[i], {headers: headers[i]})
        }
    }

    /** Parses a message url */
    public parseMessageURL = (url: string) => {
        const matches = url.match(/\d{15,}/g)?.map((m) => m)
        if (!matches) throw Error("did not provide a message link")
        const guildID = matches[0]
        const channelID = matches[1]
        const messageID = matches[2]
        return {guildID, channelID, messageID}
    }

    /** Gets the last message on the channel */
    public getLastMessage = async (message: Message) => {
        let prefix = await SQLQuery.fetchPrefix(message)
        if (!prefix) prefix = "=>"
        const messages = await message.channel.messages.fetch({limit: 100})
        return messages.find((m) => !m.content.includes("**Loading**") && !m.content.startsWith(prefix)) ?? message
    }

    /** Parse command arguments */
    public parseCommandArgs = (help: string) => {
        const data = help.match(/(?<=`)(.*?)(?=`)/gm) ?? []
        const subArray: string[][] = []
        let maxLen = 0
        for (let i = 0; i < data.length; i++) {
            const s = data[i].split(/ +/g)
            if (s.length > maxLen) maxLen = s.length
            subArray.push(s)
        }
        const newSubArray: string[] = []
        for (let i = 0; i < maxLen; i++) {
            const s: string[] = []
            for (let j = 0; j < subArray.length; j++) {
                if (subArray[j][i]) s.push(subArray[j][i])
            }
            newSubArray.push(Functions.removeDuplicates(s).join(" / "))
        }
        const options: any[] = []
        for (let i = 1; i < newSubArray.length; i++) {
            options.push({
                name: i,
                description: newSubArray[i].trim(),
                required: newSubArray[i].includes("?") ? false : true,
                type: 3
            })
        }
        return options
    }

    /** Create APIMessage */
    public createAPIMessage = async (interaction: any, content: any) => {
        const {body, files} = await MessagePayload.create(this.channels.resolve(interaction.channel_id) as MessageTarget, content).resolveBody().resolveFiles()
        return {...body, files}
    }

    public resetReplyStatus = () => {
        this.replyStatus = "rejected"
    }

    public assertReplyStatus = () => {
        return this.replyStatus === "fulfilled"
    }

    public checkSufficientPermissions = (message: Message) => {
        const embeds = new Embeds(this, message)
        if (message.guild && !(message.channel as TextChannel).permissionsFor(message.guild.members.me!)?.has(["SendMessages", "ReadMessageHistory", "AddReactions", "EmbedLinks", "AttachFiles"])) {
            let setEmbed = false
            if ((message.channel as TextChannel).permissionsFor(message.guild.members.me!)?.has(["EmbedLinks"])) setEmbed = true
            const permMessage =
              `Sorry but the bot is missing permissions that break or prevent the execution of most commands.${setEmbed ? "" : " " + this.getEmoji("kannaFacepalm").toString()}\n` +
              `\`Send Messages\` - Needed for everything? If you can see this message, the bot has this one at least.\n` +
              `\`Embed Links\` - Needed to post message embeds.\n` +
              `\`Add Reactions + Read Message History\` - Needed to add reactions.\n` +
              `\`Attach Files\` - Needed to upload attachments.\n` +
              `Please give the bot sufficient permissions.`
            const permEmbed = embeds.createEmbed()
            permEmbed
            .setTitle(`**Missing Permissions** ${this.getEmoji("kannaFacepalm")}`)
            .setDescription(permMessage)
            setEmbed ? this.send(message, permEmbed) : this.send(message, permMessage)
            return false
        }
        return true
    }

    public isUncachedInteraction = (interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction | 
        ButtonInteraction | StringSelectMenuInteraction) => {
        return !interaction.inCachedGuild() && interaction.channel?.type !== ChannelType.DM
    }

    public shardedGuildCount = async () => {
        if (!this.shard) return this.guilds.cache.size
        const result = await this.shard.fetchClientValues("guilds.cache.size") as number[]
        return result.reduce((acc, count) => acc + count, 0)
    }

    public shardedChannelCount = async () => {
        if (!this.shard) return this.channels.cache.size
        const result = await this.shard.fetchClientValues("channels.cache.size") as number[]
        return result.reduce((acc, count) => acc + count, 0)
    }

    public shardedUserCount = async () => {
        if (!this.shard) return this.users.cache.size
        const result = await this.shard.fetchClientValues("users.cache.size") as number[]
        return result.reduce((acc, count) => acc + count, 0)
    }
}
