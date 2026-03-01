 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, Guild, GuildMember, User, BaseGuildTextChannel, ChatInputCommandInteraction} from "discord.js"
import {Kisaragi} from "../structures/Kisaragi"
import fs from "fs"
import path from "path"

const discord = new Kisaragi({intents: []})
// @ts-ignore
discord.getEmoji = () => null

const guild = Reflect.construct(Guild,  [discord, {
        unavailable: false,
        id: "guild-id",
        name: "guild",
        icon: "icon",
        splash: "splash",
        region: "eu-west",
        member_count: 42,
        large: false,
        features: [],
        application_id: "application-id",
        afkTimeout: 1000,
        afk_channel_id: "afk-channel-id",
        system_channel_id: "system-channel-id",
        embed_enabled: true,
        verification_level: 2,
        explicit_content_filter: 3,
        mfa_level: 8,
        joined_at: new Date("2024-01-01").getTime(),
        owner_id: "owner-id",
        channels: [],
        roles: [],
        presences: [],
        voice_states: [],
        emojis: []
    }
])

const user = Reflect.construct(User, [discord, {
        id: "user-id",
        username: "username",
        discriminator: "user#0000",
        avatar: "avatar",
        bot: false
    }
])

const guildMember = Reflect.construct(GuildMember, [discord, {
        id: BigInt(1),
        deaf: false,
        mute: false,
        self_mute: false,
        self_deaf: false,
        session_id: "session-id",
        channel_id: "channel-id",
        nick: "nick",
        joined_at: new Date("2024-01-01").getTime(),
        user: user,
        roles: []
    },
    guild
])

const channel = Reflect.construct(BaseGuildTextChannel, [guild, {
        id: "channel-id",
        name: "guild-channel",
        position: 1,
        parent_id: "123456789",
        permission_overwrites: [],
        topic: "topic",
        nsfw: false,
        last_message_id: "123456789",
        last_pin_timestamp: new Date("2024-01-01").getTime()
    },
    discord
])

const msg = Reflect.construct(Message, [discord, {
        id: BigInt(10),
        type: "DEFAULT",
        content: "content",
        author: user,
        webhook_id: null,
        member: guildMember,
        pinned: false,
        tts: false,
        nonce: "nonce",
        embeds: [],
        attachments: [],
        edited_timestamp: null,
        reactions: [],
        mentions: [],
        mention_roles: [],
        mention_everyone: [],
        hit: false
    },
    channel
])

const int = Reflect.construct(ChatInputCommandInteraction, [discord, {
        data: "command",
        id: BigInt(1),
        user: guildMember,
        entitlements: []
    }
])

const message = {...msg, channel}
const interaction = {...int, channel}

const dummy = {
    edit: (...opts: any) => null,
    react: (...opts: any) => null,
    createReactionCollector: (...opts: any) => {
        return {on: () => null}
    }
}

message.channel.send = (...opts: any) => dummy
message.reply = (...opts: any) => dummy
message.edit = (...opts: any) => dummy
message.react = (...opts: any) => null
interaction.author = user
discord.user = user

interaction.reply = (...opts: any) => {
    if (discord.replyStatus === "fulfilled") {
        discord.replyStatus = "rejected"
    } else if (discord.replyStatus === "pending") {
        discord.replyStatus = "rejected"
    } else {
        discord.replyStatus = "fulfilled"
    }
    return dummy
}
interaction.deferReply = (...opts: any) => {
    if (discord.replyStatus === "fulfilled") {
        discord.replyStatus = "rejected"
    } else if (discord.replyStatus === "pending") {
        discord.replyStatus = "rejected"
    } else {
        discord.replyStatus = "pending"
    }
    return dummy
}
interaction.followUp = (...opts: any) => {
    if (discord.replyStatus === "pending") {
        discord.replyStatus = "fulfilled"
    }
    return dummy
}

const loadCommands = () => {
    const subDirectory = fs.readdirSync(path.join(__dirname, "../commands/"))
    for (let i = 0; i < subDirectory.length; i++) {
        const currDir = subDirectory[i]
        if (currDir === ".DS_Store") continue
        const addFiles = fs.readdirSync(path.join(__dirname, `../commands/${currDir}`))

        let category = currDir
        if (category === "japanese") category = "weeb"
        discord.categories.add(category)

        for (const file of addFiles) {
            if (!file.endsWith(".ts") && !file.endsWith(".js")) continue
            const p = `../commands/${currDir}/${file}`
            const commandName = file.split(".")[0]
            if (commandName === "empty" || commandName === "tempCodeRunnerFile") continue
            const command = new (require(path.join(__dirname, `../commands/${currDir}/${file}`)).default)(discord, interaction)

            command.name = commandName 
            command.category = category
            command.path = p

            discord.commands.set(commandName, command)
        }
    }
}

loadCommands()

export {discord, message, interaction}