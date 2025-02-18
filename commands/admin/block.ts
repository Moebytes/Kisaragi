import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Permission} from "../../structures/Permission"
import {SQLQuery} from "../../structures/SQLQuery"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Block extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Configure settings for word and invite filtering.",
            help:
            `
            _Note: You can type multiple options in one command._
            \`block\` - Opens the interactive block prompt.
            \`block word1 word2...\` - Adds blocked words.
            \`block enable/disable\` - Toggles filtering on or off.
            \`block exact/partial\` - Sets the matching algorithm.
            \`block asterisk\` - Toggles asterisk filtering.
            \`block invite\` - Block invites to other servers
            \`block delete (number)\` - Deletes a word.
            \`block reset\` - Deletes all words.
            `,
            examples:
            `
            \`=>block badword\`
            \`=>block delete 1\`
            \`=>block asterisk disable\`
            \`=>block partial\`
            \`=>block reset\`
            `,
            guildOnly: true,
            aliases: ["filter"],
            permission: "MANAGE_MESSAGES",
            botPermission: "MANAGE_MESSAGES",
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const optOption = new SlashCommandOption()
            .setType("string")
            .setName("opt")
            .setDescription("Can be word/enable/disable/exact/partial/asterisk/invite/delete/reset.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(optOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const sql = new SQLQuery(message)
        const embeds = new Embeds(discord, message)
        if (!message.channel.isSendable()) return
        if (!await perms.checkAdmin()) return
        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            await blockPrompt(message)
            return
        }
        const words = await sql.fetchColumn("guilds", "blocked words")
        let match = await sql.fetchColumn("guilds", "block match")
        let toggle = await sql.fetchColumn("guilds", "block toggle")
        let asterisk = await sql.fetchColumn("guilds", "asterisk")
        let invite = await sql.fetchColumn("guilds", "invite")
        let promo = await sql.fetchColumn("guilds", "self promo")
        if (!toggle) toggle = "off"
        if (!match) match = "partial"
        if (!asterisk) asterisk = "off"
        if (!invite) invite = "off"
        if (!promo) promo = "None"
        let wordList = ""
        if (words) {
            for (let i = 0; i < words.length; i++) {
                wordList += `**${i + 1} - ${words[i]}**\n`
            }
        } else {
            wordList = "None"
        }
        const blockEmbed = embeds.createEmbed()
        blockEmbed
        .setTitle(`**Blocked Words** ${discord.getEmoji("gabuChrist")}`)
        .setThumbnail(message.guild!.iconURL({extension: "png"}) || message.author!.displayAvatarURL({extension: "png"}))
        .setDescription(Functions.multiTrim(`
        Add or remove blocked words.
        newline
        **Exact** - Only matches the exact word.
        **Partial** - Also matches if the word is partially in another word.
        **Asterisk** - Whether messages containing asterisks will be blocked.
        **Invite** - Delete invite links to other servers
        **Self Promo Channel** - Ignores invites sent to this channel
        newline
        __Word List__
        ${wordList}
        newline
        __Current Settings__
        ${discord.getEmoji("star")}_Filtering is **${toggle}**._
        ${discord.getEmoji("star")}_Matching algorithm set to **${match}**._
        ${discord.getEmoji("star")}_Asterisk filtering is **${asterisk}**._
        ${discord.getEmoji("star")}_Invite filtering is **${invite}**._
        ${discord.getEmoji("star")}_Self promo channel set to **${promo}**._
        newline
        __Edit Settings__
        ${discord.getEmoji("star")}_**Type any words**, separated by a space, to add blocked words._
        ${discord.getEmoji("star")}_Type **enable** or **disable** to enable/disable filtering._
        ${discord.getEmoji("star")}_Type **exact** or **partial** to set the matching algorithm._
        ${discord.getEmoji("star")}_Type **asterisk** to toggle asterisk filtering._
        ${discord.getEmoji("star")}_Type **invite** to toggle invite filtering._
        ${discord.getEmoji("star")}_**Mention a channel** to set the self promo channel._
        ${discord.getEmoji("star")}_Type **delete (word number)** to delete a word._
        ${discord.getEmoji("star")}_**You can type multiple options** to enable all at once._
        ${discord.getEmoji("star")}_Type **reset** to delete all words._
        ${discord.getEmoji("star")}_Type **cancel** to exit_.
        `))
        this.reply(blockEmbed)

        async function blockPrompt(msg: Message) {
            let words = await sql.fetchColumn("guilds", "blocked words")
            const responseEmbed = embeds.createEmbed()
            responseEmbed.setTitle(`**Blocked Words** ${discord.getEmoji("gabuChrist")}`)
            let [setOn, setOff, setExact, setPartial, setWord, setAsterisk, setInvite, setPromo] = [] as boolean[]
            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                return discord.send(msg, responseEmbed)
            }
            if (msg.content.toLowerCase() === "reset") {
                await sql.updateColumn("guilds", "blocked words", null)
                await sql.updateColumn("guilds", "block toggle", "off")
                await sql.updateColumn("guilds", "block match", "partial")
                await sql.updateColumn("guilds", "asterisk", "off")
                await sql.updateColumn("guilds", "invite", "off")
                await sql.updateColumn("guilds", "self promo", null)
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}All blocked words were deleted!`)
                return discord.send(msg, responseEmbed)
            }
            if (msg.content.toLowerCase().includes("delete")) {
                const num = Number(msg.content.replace(/delete/gi, "").replace(/\s+/g, ""))
                if (num) {
                    if (words) {
                        words[num - 1] = ""
                        words = words.filter(Boolean)
                        await sql.updateColumn("guilds", "blocked words", words)
                        responseEmbed
                        .setDescription(`${discord.getEmoji("star")}Setting ${num} was deleted!`)
                        return discord.send(msg, responseEmbed)
                    }
                } else {
                    responseEmbed
                    .setDescription(`${discord.getEmoji("star")}Setting not found!`)
                    discord.send(msg, responseEmbed)
                }
            }

            const newPromo = msg.content.match(/(?<=<#)(.*?)(?=>)/gi)?.[0] ?? ""
            const newMsg = msg.content.replace(/enable/gi, "").replace(/disable/gi, "").replace(/exact/gi, "")
            .replace(/partial/gi, "").replace(/asterisk/gi, "").replace(/invite/gi, "").replace(newPromo, "")
            if (msg.content.match(/enable/gi)) setOn = true
            if (msg.content.match(/disable/gi)) setOff = true
            if (msg.content.match(/exact/gi)) setExact = true
            if (msg.content.match(/partial/gi)) setPartial = true
            if (msg.content.match(/asterisk/gi)) setAsterisk = true
            if (msg.content.match(/invite/gi)) setInvite = true
            if (newPromo) setPromo = true
            if (newMsg.trim()) setWord = true

            let wordArray = newMsg.split(" ")

            if (setOn && setOff) {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}You cannot disable/enable at the same time.`)
                return discord.send(msg, responseEmbed)
            }

            if (setExact && setPartial) {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}You can only choose one matching algorithm.`)
                return discord.send(msg, responseEmbed)
            }

            let description = ""

            if (words) {
                for (let i = 0; i < words.length; i++) {
                    for (let j = 0; j < wordArray.length; j++) {
                        if (words[i] === wordArray[j]) {
                            description += `${discord.getEmoji("star")}**${wordArray[j]}** is already blocked!`
                            wordArray[j] = ""
                            wordArray = wordArray.map((w) => w.trim()).filter(Boolean)
                        }
                    }
                }
            }

            if (setWord) {
                setOn = true
                await sql.updateColumn("guilds", "blocked words", wordArray)
                description += `${discord.getEmoji("star")}Added **${wordArray.join(", ")}**!\n`
            }
            if (setExact) {
                await sql.updateColumn("guilds", "block match", "exact")
                description += `${discord.getEmoji("star")}Matching algorithm set to **exact**!\n`
            }
            if (setPartial) {
                await sql.updateColumn("guilds", "block match", "partial")
                description += `${discord.getEmoji("star")}Matching algorithm set to **partial**!\n`
            }
            if (setOn) {
                await sql.updateColumn("guilds", "block toggle", "on")
                description += `${discord.getEmoji("star")}Filtering is **enabled**!\n`
            }
            if (setOff) {
                await sql.updateColumn("guilds", "block toggle", "off")
                description += `${discord.getEmoji("star")}Filtering is **disabled**!\n`
            }
            if (setAsterisk) {
                if (asterisk === "off") {
                    await sql.updateColumn("guilds", "asterisk", "on")
                    description += `${discord.getEmoji("star")}Asterisk filtering is **on**!\n`
                } else {
                    await sql.updateColumn("guilds", "asterisk", "off")
                    description += `${discord.getEmoji("star")}Asterisk filtering is **off**!\n`
                }
            }
            if (setInvite) {
                if (invite === "off") {
                    await sql.updateColumn("guilds", "invite", "on")
                    description += `${discord.getEmoji("star")}Invite filtering is **on**!\n`
                } else {
                    await sql.updateColumn("guilds", "invite", "off")
                    description += `${discord.getEmoji("star")}Invite filtering is **off**!\n`
                }
            }
            if (setPromo) {
                await sql.updateColumn("guilds", "self promo", newPromo)
                description += `${discord.getEmoji("star")}Self promo channel set to <#${newPromo}>!\n`
            }
            if (!description) description = `${discord.getEmoji("star")}Invalid arguments provided, canceled the prompt.`
            responseEmbed
            .setDescription(description)
            return discord.send(msg, responseEmbed)
        }
        return embeds.createPrompt(blockPrompt)
    }
}
