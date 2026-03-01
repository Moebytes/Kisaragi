 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class ReactionRoles extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Configures settings for reaction roles.",
            help:
            `
            \`reactionroles\` - Opens the reaction roles prompt
            \`reactionroles [messageID]? @role/rolename? emoji/!emojiName!? dm?\` - Adds a new reaction role with the parameters
            \`reactionroles delete setting\` - Removes a reaction role
            \`reactionroles edit setting [messageID]? @role/rolename? emoji? dm?\` - Edits a reaction role
            \`reactionroles toggle setting\` - Toggles the reaction role on or off
            \`reactionroles reset\` - Deletes all reaction roles.
            `,
            examples:
            `
            \`=>reactionroles\`
            \`=>reactionroles edit 1 [messageID] weebs :anime:\`
            \`=>reactionroles delete 5\`
            `,
            aliases: ["rr"],
            guildOnly: true,
            cachedGuildOnly: true,
            cooldown: 15,
            defer: true,
            subcommandEnabled: true
        })
        const editOption = new SlashCommandOption()
            .setType("string")
            .setName("edit")
            .setDescription("Setting input in the edit subcommand.")

        const settingOption = new SlashCommandOption()
            .setType("string")
            .setName("setting")
            .setDescription("Can be a setting number.")

        const optOption = new SlashCommandOption()
            .setType("string")
            .setName("opt")
            .setDescription("Can be delete/edit/toggle/reset or setting input.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(optOption)
            .addOption(settingOption)
            .addOption(editOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const sql = new SQLQuery(message)
        const perms = new Permission(discord, message)
        if (!await perms.checkMod()) return
        if (!message.channel.isSendable()) return
        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            await reactPrompt(message)
            return
        }

        const reactions = await sql.fetchColumn("guilds", "reaction roles")
        const step = 3.0
        const increment = Math.ceil((reactions ? reactions.length : 1) / step)
        const reactArray: EmbedBuilder[] = []
        for (let i = 0; i < increment; i++) {
            let settings = ""
            for (let j = 0; j < step; j++) {
                if (reactions) {
                    const value = (i*step)+j
                    if (!reactions[value]) break
                    const reaction = JSON.parse(reactions[value])
                    const foundMsg = await discord.fetchMessage(message, reaction.message)
                    const link = foundMsg ? `[**Link**](${foundMsg?.url})` : "None"
                    settings += `**${value + 1} =>**\n` +
                    `${discord.getEmoji("star")}_Message:_ ${link}\n` +
                    `${discord.getEmoji("star")}_Emoji:_ ${reaction.emoji ?? "None"}\n` +
                    `${discord.getEmoji("star")}_Role:_ ${reaction.role ? `<@&${reaction.role}>` : "None"}\n` +
                    `${discord.getEmoji("star")}_DM:_ **${reaction.dm ?? "off"}**\n` +
                    `${discord.getEmoji("star")}_State:_ **${reaction.state ?? "off"}**\n`
                } else {
                    settings = "None"
                }
            }
            const reactEmbed = embeds.createEmbed()
            reactEmbed
            .setTitle(`**Reaction Roles** ${discord.getEmoji("tohruThumbsUp2")}`)
            .setThumbnail(message.guild!.iconURL({extension: "png"})!)
            .setDescription(Functions.multiTrim(`
                Configure reaction roles. [To get a message ID you need to enable developer mode.](https://is.gd/t2ClBu)
                newline
                __Current Settings__
                ${settings}
                newline
                __Edit Settings__
                ${discord.getEmoji("star")}Type a **[message id] between brackets** to set the message.
                ${discord.getEmoji("star")}**Mention a role or type a role name or id** to set the role.
                ${discord.getEmoji("star")}**Send an emoji or type the !emoji name! between exclamation points** to set the emoji.
                ${discord.getEmoji("star")}Type **dm** to toggle dm notifications.
                ${discord.getEmoji("star")}Type **delete (setting number)** to delete a setting.
                ${discord.getEmoji("star")}Type **edit (setting number)** to edit a setting.
                ${discord.getEmoji("star")}Type **toggle (setting number)** to toggle the state.
                ${discord.getEmoji("star")}Type **reset** to delete all settings.
                ${discord.getEmoji("star")}Type **cancel** to exit.
            `))
            reactArray.push(reactEmbed)
        }
        if (reactArray.length > 1) {
            embeds.createReactionEmbed(reactArray)
        } else {
            this.reply(reactArray[0])
        }

        async function reactPrompt(msg: Message) {
            const responseEmbed = embeds.createEmbed()
            .setTitle(`**Reaction Roles** ${discord.getEmoji("tohruThumbsUp2")}`)
            let reactionroles = await sql.fetchColumn("guilds", "reaction roles")
            if (!reactionroles) reactionroles = []
            let [setToggle, setMessage, setEmoji, setRole, setDM] = [false, false, false, false, false]

            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                return discord.send(msg, responseEmbed)
            }
            if (msg.content.toLowerCase() === "reset") {
                await sql.updateColumn("guilds", "reaction roles", null)
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Reaction role settings were wiped!`)
                return discord.send(msg, responseEmbed)
            }
            if (msg.content.toLowerCase().includes("delete")) {
                const num = Number(msg.content.replace(/delete/gi, "").replace(/\s+/g, ""))
                if (Number.isNaN(num)) return msg.reply("Invalid setting number!")
                if (reactionroles ? reactionroles[num - 1] : false) {
                    reactionroles[num - 1] = ""
                    reactionroles = reactionroles.filter(Boolean)
                    await sql.updateColumn("guilds", "reaction roles", reactionroles)
                    responseEmbed
                    .setDescription(`${discord.getEmoji("star")}Setting ${num} was deleted!`)
                    return discord.send(msg, responseEmbed)
                } else {
                    responseEmbed
                    .setDescription(`${discord.getEmoji("star")}Setting not found!`)
                    return discord.send(msg, responseEmbed)
                }
            }

            if (msg.content.toLowerCase().includes("toggle")) {
                const num = Number(msg.content.replace(/toggle/gi, "").replace(/\s+/g, ""))
                if (Number.isNaN(num)) return msg.reply("Invalid setting number!")
                if (reactionroles ? reactionroles[num - 1] : false) {
                    let desc = ""
                    const reaction = JSON.parse(reactionroles[num - 1])
                    if (reaction?.state === "on") {
                        reaction.state = "off"
                        desc = `${discord.getEmoji("star")}Setting ${num} was toggled **off**!`
                    } else {
                        if (reaction.message && reaction.emoji && reaction.role) {
                            reaction.state = "on"
                            desc = `${discord.getEmoji("star")}Setting ${num} was toggled **on**!`
                        } else {
                            desc = `${discord.getEmoji("star")}You need to set the message, role, and emoji to toggle this setting on!`
                        }
                    }
                    reactionroles[num-1] = JSON.stringify(reaction)
                    await sql.updateColumn("guilds", "reaction roles", reactionroles)
                    responseEmbed
                    .setDescription(desc)
                    return discord.send(msg, responseEmbed)
                } else {
                    responseEmbed
                    .setDescription(`${discord.getEmoji("star")}Setting not found!`)
                    return discord.send(msg, responseEmbed)
                }
            }

            if (msg.content.toLowerCase().includes("edit")) {
                const newMsg = msg.content.replace(/edit/g, "").trim().split(" ")
                const tempMsg = newMsg.slice(1).join(" ")
                const num = Number(newMsg[0]) - 1
                if (Number.isNaN(num)) return msg.reply("Invalid setting number!")
                if (reactionroles ? reactionroles[num] : false) {
                    if (tempMsg) {
                        const reaction = JSON.parse(reactionroles[num])
                        const nDM = tempMsg.match(/dm/)?.[0] ?? ""
                        const nMessage = tempMsg.match(/(?<=\[)(.*?)(?=\])/g)?.[0] ?? ""
                        let nEmoji = tempMsg.match(/(<a?:)(.*?)(>)/)?.[0] ?? Functions.unicodeEmoji(tempMsg) ?? ""
                        let nRole = tempMsg.replace(nMessage, "").replace(nEmoji, "").match(/\d{5,}/)?.[0] ?? tempMsg.match(/(?<=<@&)(.*?)(?=>)/g)?.[0] ?? ""
                        if (!nRole) {
                            const roleName = tempMsg?.replace(/toggle/, "").replace(/dm/, "").replace(nEmoji, "").replace(/(!)(.*?)(!)/, "").replace(/(\[)(.*?)(\])/g, "").replace(/(<@&)(.*?)(>)/g, "")?.trim()
                            const roleSearch = discord.getRole(message.guild!, roleName)
                            if (roleSearch) {
                                nRole = roleSearch.id
                            }
                        }
                        if (!nEmoji) {
                            const emojiName = tempMsg.match(/(?<=!)(.*?)(?=!)/)?.[0]
                            if (emojiName) {
                                if (nMessage?.trim()) {
                                    const foundMsg = await discord.fetchMessage(message, nMessage)
                                    if (!foundMsg) return message.reply(`Invalid message ${discord.getEmoji("kannaFacepalm")}`)
                                    const foundReact = foundMsg.reactions.cache.find((r) => r.emoji.name?.toLowerCase().includes(emojiName.toLowerCase()))
                                    if (foundReact) {
                                        nEmoji = discord.getEmojiGlobal(foundReact.emoji.id ?? "") ?? foundReact.emoji.id ?? ""
                                    } else {
                                        nEmoji = discord.getEmojiGlobal(emojiName) ?? ""
                                    }
                                } else {
                                    nEmoji = discord.getEmojiGlobal(emojiName) ?? ""
                                }
                            }
                        } else {
                            nEmoji = Functions.unicodeEmoji(tempMsg) ? Functions.unicodeEmoji(tempMsg) : (discord.getEmojiGlobal(nEmoji) ?? "")
                        }
                        let editDesc = ""
                        if (nMessage?.trim()) {
                            const foundMsg = await discord.fetchMessage(message, nMessage)
                            if (!foundMsg) return message.reply(`Invalid message ${discord.getEmoji("kannaFacepalm")}`)
                            reaction.message = nMessage
                            editDesc += `${discord.getEmoji("star")}Message set to [**Link**](${foundMsg.url})!\n`
                        }
                        if (nEmoji) {
                            reaction.emoji = nEmoji
                            editDesc += `${discord.getEmoji("star")}Emoji set to ${nEmoji}!\n`
                        }
                        if (nRole) {
                            reaction.role = nRole
                            editDesc += `${discord.getEmoji("star")}Role set to <@&${nRole}>!\n`
                        }
                        if (nDM) {
                            if (reaction.dm === "on") {
                                reaction.dm = "off"
                                editDesc += `${discord.getEmoji("star")}DM notifications are **off**!\n`
                            } else {
                                reaction.dm = "on"
                                editDesc += `${discord.getEmoji("star")}DM notifications are **on**!\n`
                            }
                        }
                        if ((reaction.state === "off") && (reaction.message && reaction.emoji && reaction.role)) {
                            reaction.state = "on"
                            editDesc += `${discord.getEmoji("star")}State is **on**!\n`
                        }
                        if (reaction.message && reaction.emoji) {
                            const foundMsg = await discord.fetchMessage(message, reaction.message)
                            const id = nEmoji.match(/\d+/)?.[0] ?? nEmoji
                            if (foundMsg && !foundMsg.reactions.cache.has(id)) {
                                try {
                                    await foundMsg.react(id)
                                    editDesc += `${discord.getEmoji("star")}This message didn't have this reaction, so I added it!\n`
                                } catch {
                                    // Do nothing
                                }
                            }
                        }
                        if (!editDesc) return msg.reply(`No additions were made, canceled ${discord.getEmoji("kannaFacepalm")}`)
                        reactionroles[num] = JSON.stringify(reaction)
                        await sql.updateColumn("guilds", "reaction roles", reactionroles)
                        responseEmbed
                        .setDescription(editDesc)
                        return discord.send(msg, responseEmbed)
                    } else {
                        return discord.send(msg, responseEmbed.setDescription("No edits specified!"))
                    }
                } else {
                    responseEmbed
                    .setDescription(`${discord.getEmoji("star")}Setting not found!`)
                    discord.send(msg, responseEmbed)
                    return
                }
            }

            const newDM = msg.content.match(/dm/)?.[0] ?? ""
            const newToggle = msg.content.match(/toggle/)?.[0] ?? ""
            const newMessage = msg.content.match(/(?<=\[)(.*?)(?=\])/g)?.[0] ?? ""
            let newEmoji = msg.content.match(/(<a?:)(.*?)(>)/)?.[0] ?? Functions.unicodeEmoji(msg.content) ?? ""
            let newRole = msg.content.replace(newMessage, "").replace(newEmoji, "").match(/\d{5,}/)?.[0] ?? msg.content.match(/(?<=<@&)(.*?)(?=>)/g)?.[0] ?? ""
            if (!newRole) {
                const roleName = msg.content?.replace(/toggle/, "").replace(/dm/, "").replace(newEmoji, "").replace(/(!)(.*?)(!)/, "").replace(/(\[)(.*?)(\])/g, "").replace(/(<@&)(.*?)(>)/g, "")?.trim()
                const roleSearch = discord.getRole(message.guild!, roleName)
                if (roleSearch) {
                    newRole = roleSearch.id
                }
            }
            if (!newEmoji) {
                const emojiName = msg.content.match(/(?<=!)(.*?)(?=!)/)?.[0]
                if (emojiName) {
                    if (newMessage?.trim()) {
                        const foundMsg = await discord.fetchMessage(message, newMessage)
                        if (!foundMsg) return message.reply(`Invalid message ${discord.getEmoji("kannaFacepalm")}`)
                        const foundReact = foundMsg.reactions.cache.find((r) => r.emoji.name?.toLowerCase().includes(emojiName.toLowerCase()))
                        if (foundReact) {
                            newEmoji = discord.getEmojiGlobal(foundReact.emoji.id ?? "") ?? foundReact.emoji.id ?? ""
                        } else {
                            newEmoji = discord.getEmojiGlobal(emojiName) ?? ""
                        }
                    } else {
                        newEmoji = discord.getEmojiGlobal(emojiName) ?? ""
                    }
                }
            } else {
                newEmoji = Functions.unicodeEmoji(msg.content) ? Functions.unicodeEmoji(msg.content) : (discord.getEmojiGlobal(newEmoji) ?? "")
            }
            if (newToggle) setToggle = true
            if (newMessage?.trim()) setMessage = true
            if (newEmoji) setEmoji = true
            if (newRole) setRole = true
            if (newDM) setDM = true

            let description = ""
            const obj = {} as any

            if (setMessage) {
                const foundMsg = await discord.fetchMessage(message, newMessage)
                if (!foundMsg) return message.reply(`Invalid message ${discord.getEmoji("kannaFacepalm")}`)
                obj.message = newMessage
                description += `${discord.getEmoji("star")}Message set to [**Link**](${foundMsg.url})!\n`
            }

            if (setEmoji) {
                obj.emoji = newEmoji
                description += `${discord.getEmoji("star")}Emoji set to ${newEmoji}!\n`
            }

            if (setRole) {
                obj.role = newRole
                description += `${discord.getEmoji("star")}Role set to <@&${newRole}>!\n`
            }

            if (setDM) {
                obj.dm = "on"
                description += `${discord.getEmoji("star")}DM notifications are **on**!\n`
            } else {
                obj.dm = "off"
            }

            if (setMessage && setEmoji && setRole) {
                obj.state = "on"
                description += `${discord.getEmoji("star")}State is **on**!\n`
            } else {
                obj.state = "off"
            }

            if (setToggle && !(setMessage && setEmoji && setRole)) {
                description += `${discord.getEmoji("star")}You need to set the message, emoji, and role to turn on the state!\n`
            }

            if (setMessage && setEmoji) {
                const foundMsg = await discord.fetchMessage(message, newMessage)
                const id = newEmoji.match(/\d+/)?.[0] ?? newEmoji
                if (foundMsg && !foundMsg.reactions.cache.has(id)) {
                    try {
                        await foundMsg.react(id)
                        description += `${discord.getEmoji("star")}This message didn't have this reaction, so I added it!\n`
                    } catch {
                        // Do nothing
                    }
                }
            }

            if (!description) return msg.reply(`No additions were made, canceled ${discord.getEmoji("kannaFacepalm")}`)
            reactionroles.push(obj)
            await sql.updateColumn("guilds", "reaction roles", reactionroles)

            responseEmbed
            .setDescription(description)
            return discord.send(msg, responseEmbed)
        }

        await embeds.createPrompt(reactPrompt)
    }
}
