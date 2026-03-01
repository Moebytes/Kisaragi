 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import axios from "axios"
import Booru from "booru"
import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "./../../structures/Permission"

export default class Konachan extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for anime pictures on konachan.",
            help:
            `
            _Note: Underscores are not required._
            \`konachan\` - Get a random image.
            \`konachan link/id\` - Gets the image from the link.
            \`konachan tag\` - Gets an image with the tag.
            \`konachan r18\` - Get a random r18 image.
            \`konachan r18 tag\` - Get an r18 image with the tag.
            \`=>konachan r18 azur lane\`
            `,
            examples:
            `
            \`=>konachan\`
            \`=>konachan kisaragi (azur lane)\`
            `,
            aliases: ["k", "kona", "kchan"],
            random: "none",
            cooldown: 20,
            defer: true,
            subcommandEnabled: true
        })
        const tagOption = new SlashCommandOption()
            .setType("string")
            .setName("tag")
            .setDescription("tags or link to search")
        
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(tagOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
        const konachan = Booru("konachan.com", process.env.KONACHAN_API_KEY as any)
        const konachanEmbed = embeds.createEmbed()
        .setTitle(`**Konachan Search** ${discord.getEmoji("gabUghh")}`)
        .setAuthor({name: "konachan", iconURL: "https://kisaragi.moe/assets/embed/konachan.png"})
        if (!perms.checkNSFW()) return

        let tags: string[] = []
        if (!args[1]) {
            tags = ["pantyhose", "rating:safe"]
        } else if (args[1].toLowerCase() === "r18") {
            if (!perms.checkNSFW()) return
            if (!perms.checkBotDev()) return
            tags = Functions.combineArgs(args, 2).split(",")
            if (!tags) tags = ["pantyhose"]
            tags.push("-rating:safe")
        } else {
            tags = Functions.combineArgs(args, 1).split(",")
            if (!tags) tags = ["pantyhose"]
            tags.push("rating:safe")
        }

        const tagArray: string[] = []
        for (let i = 0; i < tags.length; i++) {
            tagArray.push(tags[i].trim().replace(/ /g, "_"))
        }

        let images: any[] = []
        if (tags.join("").match(/\d\d+/g)) {
            try {
                images = [await axios.get(`https://konachan.com/post.json?tags=id:${tags.join("").match(/\d\d+/g)}`, {headers}).then((r) => r.data)]
            } catch {
                return this.invalidQuery(konachanEmbed, "The url is invalid.")
            }
        } else {
            const rawImages = await konachan.search(tagArray, {limit: 50, random: true})
            if (!rawImages[0]) {
                return this.invalidQuery(konachanEmbed, "Underscores are not required, " +
                "if you want to search multiple terms separate them with a comma. Tags usually start with a last name, try looking up your tag " +
                "on the [**Konachan Website**](https://konachan.com//)")
            }
            // @ts-ignore
            images = rawImages.map((i) => i.data)
        }
        const konachanArray: EmbedBuilder[] = []
        for (let i = 0; i < images.length; i++) {
            const img = images[i]
            if (img.rating !== "s") {
                if (!perms.checkNSFW(true)) continue
                if (!perms.checkBotDev(true)) continue
            }
            const konachanEmbed = embeds.createEmbed()
            .setTitle(`**Konachan Search** ${discord.getEmoji("gabUghh")}`)
            .setAuthor({name: "konachan", iconURL: "https://kisaragi.moe/assets/embed/konachan.png"})
            .setURL(`https://konachan.com/post/show/${img.id}`)
            .setDescription(
                `${discord.getEmoji("star")}_Source:_ ${img.source}\n` +
                `${discord.getEmoji("star")}_Uploader:_ **${img.author}**\n` +
                `${discord.getEmoji("star")}_Creation Date:_ **${Functions.formatDate(new Date(img.created_at*1000))}**\n` +
                `${discord.getEmoji("star")}_Tags:_ ${Functions.checkChar(img.tags, 1900, " ")}\n`
            )
            .setImage(img.sample_url)
            konachanArray.push(konachanEmbed)
        }
        if (!konachanArray[0]) {
            return this.invalidQuery(konachanEmbed)
        }
        if (konachanArray.length === 1) {
            return this.reply(konachanArray[0])
        } else {
            return embeds.createReactionEmbed(konachanArray, true, true)
        }
    }
}
