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

export default class Safebooru extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for anime pictures on safebooru.",
            help:
            `
            _Note: Underscores are not required. This is safebooru, so r18 only gets you "questionable" images._
            \`safebooru\` - Get a random image.
            \`safebooru link/id\` - Gets the image from the link.
            \`safebooru tag\` - Gets an image with the tag.
            \`safebooru r18\` - Get a random questionable image.
            \`safebooru r18 tag\` - Get a questionable image with the tag.
            `,
            examples:
            `
            \`=>safebooru\`
            \`=>safebooru tenma gabriel white\`
            \`=>safebooru r18 gabriel dropout\`
            `,
            aliases: ["safe"],
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

    public getImage = async (dir: string, image: string) => {
        const headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
        try {
            await axios.head(`https://safebooru.org/samples/${dir}/sample_${image.replace("png", "jpg")}`, {headers})
            return `https://safebooru.org/samples/${dir}/sample_${image.replace("png", "jpg")}`
        } catch {
            return `https://safebooru.org/images/${dir}/${image}`
        }
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const safebooru = Booru("safebooru")
        const perms = new Permission(discord, message)
        const headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
        const safebooruEmbed = embeds.createEmbed()
        .setAuthor({name: "safebooru", iconURL: "https://kisaragi.moe/assets/embed/safebooru.png"})
        .setTitle(`**Safebooru Search** ${discord.getEmoji("gabUghh")}`)
        if (!perms.checkNSFW()) return

        let tags: string[] = []
        if (!args[1]) {
            tags = ["pantyhose", "rating:safe"]
        } else if (args[1].toLowerCase() === "r18") {
            if (!perms.checkNSFW()) return
            if (!perms.checkBotDev()) return
            tags = Functions.combineArgs(args, 2).split(",")
            if (!tags.join("")) tags = ["pantyhose"]
            tags.push("-rating:safe")
        } else {
            tags = Functions.combineArgs(args, 1).split(",")
            tags.push("rating:safe")
        }

        const tagArray: string[] = []
        for (let i = 0; i < tags.length; i++) {
            tagArray.push(tags[i].trim().replace(/ /g, "_"))
        }

        let images: any[] = []
        if (tags.join("").match(/\d\d+/g)) {
            try {
                images = [await axios.get(`https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&id=${tags.join("").match(/\d\d+/g)}`, {headers}).then((r) => r.data)]
            } catch {
                return this.invalidQuery(safebooruEmbed, "The url is invalid.")
            }
        } else {
            const rawImages = await safebooru.search(tagArray, {limit: 10, random: true})
            if (!rawImages[0]) {
                return this.invalidQuery(safebooruEmbed, "Underscores are not required, " +
                "if you want to search multiple terms separate them with a comma. Tags usually start with a last name; try looking up your tag " +
                "on the [**Safebooru Website**](https://safebooru.org/)")
            }
            // @ts-ignore
            images = rawImages.map((i) => i.data)
        }
        const safebooruArray: EmbedBuilder[] = []
        for (let i = 0; i < images.length; i++) {
            const img = images[i]
            const image = await this.getImage(img.directory, img.image)
            const safebooruEmbed = embeds.createEmbed()
            .setAuthor({name: "safebooru", iconURL: "https://kisaragi.moe/assets/embed/safebooru.png"})
            .setTitle(`**Safebooru Search** ${discord.getEmoji("gabUghh")}`)
            .setURL(`https://safebooru.org/index.php?page=post&s=view&id=${img.id}`)
            .setDescription(
                `${discord.getEmoji("star")}_Uploader:_ **${img.owner}**\n` +
                `${discord.getEmoji("star")}_Tags:_ ${Functions.checkChar(String(img.tags), 1900, " ")}\n` +
                `_Image not showing? Click_ [**here**](${image})`
            )
            .setImage(image)
            safebooruArray.push(safebooruEmbed)
        }
        if (!safebooruArray[0]) {
            return this.invalidQuery(safebooruEmbed)
        }
        if (safebooruArray.length === 1) {
            return this.reply(safebooruArray[0])
        } else {
            return embeds.createReactionEmbed(safebooruArray, true, true)
        }
    }
}
