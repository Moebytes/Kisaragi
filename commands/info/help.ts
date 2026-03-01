/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder} from "discord.js"
import {SlashCommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import * as config from "../../config.json"
import {SQLQuery} from "../../structures/SQLQuery"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Help extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Lists all bot commands and describes how to use them.",
            help:
            `
            Looking for help on the help command, how ironic!
            \`help\` - Lists all commands
            \`help command\` - Gets detailed help on a command
            \`help !category\` - Only post the specific category
            \`help dm\` - Sends a compact list through dm's
            `,
            examples:
            `
            \`=>help\`
            \`=>help help\`
            \`=>help !website 2\`
            `,
            aliases: ["h"],
            cooldown: 20,
            defer: true,
            slashEnabled: true
        })
        const commandOption = new SlashCommandOption()
            .setType("string")
            .setName("command")
            .setDescription("This can be dm, a specific command, or !category to retrieve a category.")

        this.slash = new SlashCommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addStringOption(commandOption)
            .toJSON()
    }

    public emojiMap: any = {
        "admin": "raphiOMG",
        "anime": "gabYes",
        "botdev": "no",
        "config": "akariLurk",
        "fun": "chinoSmug",
        "game": "yaoi",
        "heart": "kannaPat",
        "booru": "madokaLewd",
        "info": "kannaCurious",
        "weeb": "kannaHungry",
        "level": "kannaXD",
        "image": "tohruSmug",
        "misc": "karenXmas",
        "misc 2": "sataniaDead",
        "mod": "kannaFreeze",
        "music": "poiHug",
        "music 2": "yes",
        "music 3": "vigneDead",
        "reddit": "aquaWut",
        "twitter": "gabSip",
        "video": "vigneXD",
        "waifu": "karenSugoi",
        "website": "tohruThumbsUp2",
        "website 2": "mexShrug",
        "website 3": "think"
    }
    
    public imageMap: any = {
        "admin": "https://kisaragi.moe/assets/banners/admin.png",
        "anime": "https://kisaragi.moe/assets/banners/anime.png",
        "botdev": "https://kisaragi.moe/assets/banners/botdev.png",
        "config": "https://kisaragi.moe/assets/banners/config.png",
        "fun": "https://kisaragi.moe/assets/banners/fun.png",
        "game": "https://kisaragi.moe/assets/banners/game.png",
        "heart": "https://kisaragi.moe/assets/banners/heart.png",
        "booru": "https://kisaragi.moe/assets/banners/booru.png",
        "info": "https://kisaragi.moe/assets/banners/info.png",
        "weeb": "https://kisaragi.moe/assets/banners/weeb.png",
        "level": "https://kisaragi.moe/assets/banners/level.png",
        "image": "https://kisaragi.moe/assets/banners/image.png",
        "misc": "https://kisaragi.moe/assets/banners/misc.png",
        "misc 2": "https://kisaragi.moe/assets/banners/misc%202.png",
        "mod": "https://kisaragi.moe/assets/banners/mod.png",
        "music": "https://kisaragi.moe/assets/banners/music.png",
        "music 2": "https://kisaragi.moe/assets/banners/music%202.png",
        "music 3": "https://kisaragi.moe/assets/banners/music%203.png",
        "reddit": "https://kisaragi.moe/assets/banners/reddit.png",
        "twitter": "https://kisaragi.moe/assets/banners/twitter.png",
        "video": "https://kisaragi.moe/assets/banners/video.png",
        "waifu": "https://kisaragi.moe/assets/banners/waifu.png",
        "website": "https://kisaragi.moe/assets/banners/website.png",
        "website 2": "https://kisaragi.moe/assets/banners/website%202.png",
        "website 3": "https://kisaragi.moe/assets/banners/website%203.png"
    }

    public thumbMap: any = {
        "admin": "https://cdn.discordapp.com/emojis/1280922651984138260.png",
        "anime": "https://cdn.discordapp.com/emojis/1280922668698173500.png",
        "botdev": "https://cdn.discordapp.com/emojis/1280922779473940560.png",
        "config": "https://cdn.discordapp.com/emojis/1280922887926059091.png",
        "fun": "https://cdn.discordapp.com/emojis/1280923131237629973.gif",
        "game": "https://cdn.discordapp.com/emojis/1280923170706165771.png",
        "heart": "https://cdn.discordapp.com/emojis/1280923184522330264.png",
        "booru": "https://cdn.discordapp.com/emojis/1280922770720424038.png",
        "info": "https://cdn.discordapp.com/emojis/1280923275198992454.png",
        "weeb": "https://cdn.discordapp.com/emojis/1280923306438037535.png",
        "level": "https://cdn.discordapp.com/emojis/1280923336842678283.png",
        "image": "https://cdn.discordapp.com/emojis/1280923254608892028.png",
        "misc": "https://cdn.discordapp.com/emojis/1280923465670725754.png",
        "misc 2": "https://cdn.discordapp.com/emojis/1280923487850205346.png",
        "mod": "https://cdn.discordapp.com/emojis/1280923499988521032.png",
        "music": "https://cdn.discordapp.com/emojis/1280923530178854993.png",
        "music 2": "https://cdn.discordapp.com/emojis/1280923562043248730.png",
        "music 3": "https://cdn.discordapp.com/emojis/1280923547660849173.png",
        "reddit": "https://cdn.discordapp.com/emojis/1280923741039231057.png",
        "twitter": "https://cdn.discordapp.com/emojis/1280924124092567594.png",
        "video": "https://cdn.discordapp.com/emojis/1280924222759239842.png",
        "waifu": "https://cdn.discordapp.com/emojis/1280924243894210705.png",
        "website": "https://cdn.discordapp.com/emojis/1280924254816309279.png",
        "website 2": "https://cdn.discordapp.com/emojis/1280924275263541248.png",
        "website 3": "https://cdn.discordapp.com/emojis/1280924265994125343.png"
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        
        const categories = [...discord.categories.values()]
        const commands = [...discord.commands.values()]
        const helpEmbedArray: EmbedBuilder[] = []
        if (args[1] && !args[1].startsWith("!") && args[1]?.toLowerCase() !== "dm" && args[1] !== "2") {
            const helpDir = discord.commands.get("helpInfo")!
            helpDir.message = message
            return helpDir.run(args)
        }
        if (args[1]?.toLowerCase() === "dm") {
            const dmEmbeds: EmbedBuilder[] = []
            const step = 10.0
            const increment = Math.ceil(categories.length / step)
            for (let i = 0; i < increment; i++) {
                const dmEmbed = embeds.createEmbed()
                for (let j = 0; j < step; j++) {
                    let help = ""
                    const k = (i*step)+j
                    const category = categories[k]
                    if (!category) break
                    let counter = 0
                    for (let m = 0; m < commands.length; m++) {
                        const command = commands[m]
                        if (command.category !== category) continue
                        if (command.options.unlist === true) continue
                        if (command.options.nsfw === true) continue
                        help += `\`${command.name}\` `
                        counter++
                    }
                    dmEmbed
                    .addFields([{name: `${discord.getEmoji(this.emojiMap[category])} ${Functions.toProperCase(category)} (${counter})`.trim(), value: help || "Not available" as any}])
                }
                dmEmbed
                .setAuthor({name: "help", iconURL: "https://kisaragi.moe/assets/embed/help.png"})
                .setTitle(`**Help** ${discord.getEmoji("aquaUp")}`)
                .setDescription(`_Reactions cannot be removed in dm's, so remove them yourself._`)
                if (!discord.checkMuted(message)) dmEmbed.addFields([{name: `${discord.getEmoji("raphiSmile")} Additional Links`, value: `[Website](${config.website}) | [Invite](${config.invite}) | [Support](${config.support})`}])
                dmEmbeds.push(dmEmbed)
            }
            embeds.createReactionEmbed(dmEmbeds, false, false, 1, message.author)
            let rep = await this.reply(`Sent you the commands list! Make sure you have direct messages enabled, globally and server wide. ${discord.getEmoji("karenSugoi")}`)
            if (args[2] === "delete") Functions.deferDelete(rep, 3000)
            return
        }
        let prefix = await SQLQuery.fetchPrefix(message)
        if (!prefix) prefix = "=>"
        let setIndex = -1
        for (let i = 0; i < categories.length; i++) {
            let help = ""
            const category = categories[i]
            for (let j = 0; j < commands.length; j++) {
                const command = commands[j]
                if (command.category !== category) continue
                if (command.options.unlist === true) continue
                if (command.options.nsfw === true) continue
                const starEmoji = "star" //command.options.premium ? "premiumstar" : "star"
                help += `${discord.getEmoji(starEmoji)}\`${command.name}\`` + ` -> _${command.options.description}_\n`
            }
            if (args[1]?.startsWith("!")) {
                let input = Functions.combineArgs(args, 1).replace("!", "").trim().toLowerCase()
                if (input === "japanese") input = "weeb"
                setIndex = categories.indexOf(input)
            }
            const helpEmbed = embeds.createEmbed()
            helpEmbed
            .setTitle(`**${Functions.toProperCase(category)} Commands** ${discord.getEmoji(this.emojiMap[category])}`)
            .setAuthor({name: "help", iconURL: "https://kisaragi.moe/assets/embed/help.png"})
            .setImage(this.imageMap[category])
            .setThumbnail(discord.muted ? "" : this.thumbMap[category])
            .setDescription(
                `Type \`${prefix}help (command)\` for detailed help info! ${discord.getEmoji("aquaUp")}\n` +
                `To display only one category, use \`${prefix}help !(category)\` ${discord.getEmoji("gabYes")}\n` +
                `_Click on a reaction twice to toggle compact mode._\n` + help)
            if (!discord.checkMuted(message)) helpEmbed.addFields([{name: `${discord.getEmoji("raphiSmile")} Additional Links`, value: `[Website](${config.website}) | [Invite](${config.invite}) | [Support](${config.support})`}])
            helpEmbedArray.push(helpEmbed)
        }
        if (setIndex > -1) {
            return this.reply(helpEmbedArray[setIndex])
        } else {
            if (args[1] === "2") {
                embeds.createHelpEmbed(helpEmbedArray, 2)
            } else {
                embeds.createHelpEmbed(helpEmbedArray)
            }
        }
    }
}
