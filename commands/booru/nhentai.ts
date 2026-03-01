/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandOption} from "../../structures/SlashCommandOption"
import {API, Doujin} from "nhentai"
import blacklist from "../../assets/json/blacklist.json"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "./../../structures/Permission"

const nhentai = new API()

export default class $nHentai extends Command {
    private readonly embeds = new Embeds(this.discord, this.message)
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches a doujinshi on nhentai.",
            help:
            `
            \`nhentai\` - Gets a random doujinshi (after a quality filter)
            \`nhentai query\` - Searches for a doujinshi with the query
            \`nhentai url/id\` - Gets a doujinshi by url or id
            \`nhentai random\` - Gets a truly random doujinshi, not recommended
            `,
            examples:
            `
            \`=>nhentai stockings\`
            \`=>nhentai\`
            `,
            aliases: ["nh"],
            random: "none",
            cooldown: 15,
            defer: true,
            nsfw: true,
            unlist: true,
            subcommandEnabled: false
        })
    }

    // nhentai Doujin
    public getNhentaiDoujin = (doujin: Doujin, id: number) => {
        const discord = this.discord
        const artists = doujin.tags.artists.map((t) => t.name)
        const categories = doujin.tags.categories.map((t) => t.name)
        const characters = doujin.tags.characters.map((t) => t.name)
        const parodies = doujin.tags.parodies.map((t) => t.name)
        const groups = doujin.tags.groups.map((t) => t.name)
        const languages = doujin.tags.languages.map((t) => t.name)
        const tags = doujin.tags.tags.map((t) => t.name)
        const checkArtists = artists ? Functions.checkChar(artists.join(" "), 50, " ") : "None"
        const checkCharacters = characters ? Functions.checkChar(characters.join(" "), 50, " ") : "None"
        const checkTags = tags ? Functions.checkChar(tags.join(" "), 50, " ") : "None"
        const checkParodies = parodies ? Functions.checkChar(parodies.join(" "), 50, " ") : "None"
        const checkGroups = groups ? Functions.checkChar(groups.join(" "), 50, " ") : "None"
        const checkLanguages = languages ? Functions.checkChar(languages.join(" "), 50, " ") : "None"
        const checkCategories = categories ? Functions.checkChar(categories.join(" "), 50, " ") : "None"
        const doujinPages: EmbedBuilder[] = []
        for (let i = 0; i < doujin.pages.length; i++) {
            const nhentaiEmbed = this.embeds.createEmbed()
            nhentaiEmbed
            .setAuthor({name: "nhentai", iconURL: "https://kisaragi.moe/assets/embed/nhentai.png"})
            .setTitle(`**${doujin.titles.english}**`)
            .setURL(doujin.url)
            .setDescription(
            `${discord.getEmoji("star")}_Japanese Title:_ **${doujin.titles.japanese}**\n` +
            `${discord.getEmoji("star")}_ID:_ **${id}**\n` +
            `${discord.getEmoji("star")}_Artists:_ ${checkArtists}\n` +
            `${discord.getEmoji("star")}_Characters:_ ${checkCharacters}\n` +
            `${discord.getEmoji("star")}_Tags:_ ${checkTags} ${checkParodies}` +
            `${checkGroups} ${checkLanguages} ${checkCategories}\n`
            )
            .setThumbnail(doujin.cover.url)
            .setImage(doujin.pages[i].url)
            doujinPages.push(nhentaiEmbed)
        }
        this.embeds.createReactionEmbed(doujinPages, true, true)
    }

    public nhentaiRandom = async (filter?: boolean) => {
        const perms = new Permission(this.discord, this.message)
        try {
            const doujin = await nhentai.randomDoujin()
            if (filter) {
                for (let i = 0; i < doujin!.tags.all.length; i++) {
                    if (doujin!.tags.all[i].name) await this.nhentaiRandom(true)
                    for (let j = 0; j < blacklist.nhentai.length; j++) {
                        if (doujin!.tags.all[i].name === atob(blacklist.nhentai[j])) {
                            await this.nhentaiRandom(true)
                        }
                    }
                }
            }
            return doujin
        } catch {
            return this.nhentaiRandom(filter)
        }
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        if (!perms.checkNSFW()) return
        if (!perms.checkBotDev()) return

        if (!args[1]) {
            const doujin = await this.nhentaiRandom(true)
            this.getNhentaiDoujin(doujin, doujin!.mediaId)
            return
        } else {
            if (args[1].toLowerCase() === "random") {
                const doujin = await this.nhentaiRandom(false)
                this.getNhentaiDoujin(doujin, doujin!.mediaId)
                return
            }
            const tag = Functions.combineArgs(args, 1)
            if (tag.match(/\d+/g) !== null) {
                const doujin = await nhentai.fetchDoujin(tag.match(/\d+/g)!.toString())
                this.getNhentaiDoujin(doujin!, doujin!.mediaId)
            } else {
                const result = await nhentai.search(tag)
                if (!result.doujins[0]) {
                    const nHentaiEmbed = this.embeds.createEmbed()
                    .setAuthor({name: "nhentai", iconURL: "https://kisaragi.moe/assets/embed/nhentai.png"})
                    .setTitle(`**nHentai Search**`)
                    return this.invalidQuery(nHentaiEmbed, "Try searching on the [**nhentai Website**](https://nhentai.net/).")
                }
                let counter = 0
                let index = Math.floor(Math.random() * (result.doujins.length - result.doujins.length/2) + result.doujins.length/2)
                let doujin = result.doujins[index]
                while (doujin.tags.all.map((t) => t.name).join("")) {
                    index = Math.floor(Math.random() * (result.doujins.length - result.doujins.length/2) + result.doujins.length/2)
                    doujin = result.doujins[index]
                    if (counter >= result.doujins.length) {
                        return this.invalidQuery(this.embeds.createEmbed()
                        .setAuthor({name: "nhentai", iconURL: "https://kisaragi.moe/assets/embed/nhentai.png"})
                        .setTitle(`**nHentai Search**`))
                    }
                    counter++
                }
                this.getNhentaiDoujin(doujin, doujin.mediaId)
            }
        }
    }
}
