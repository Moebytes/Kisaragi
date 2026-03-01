 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import axios from "axios"
import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "./../../structures/Permission"

export default class Genshin extends Command {
    private readonly defaults = [
        "Klee", "Amber", "Ayaka", "Barbara", "Chevreuse", "Chiori", "Dehya", "Emilie", "Faruzan",
        "Fischl", "Furina", "Ganyu", "Hu-Tao", "Keqing", "Kirara", "Kokomi", "Layla", "Lynette", "Mona",
        "Nahida", "Navia", "Nilou", "Noelle", "Qiqi", "Sayu", "Shenhe", "Sigewinne", "Xiangling", "Yae-Miko",
        "Raiden", "Yanfei", "Yaoyao", "Yelan", "Yoimiya", "Yun-Jin", "Lumine"
    ]
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Gets information on a genshin impact character.",
            help:
            `
            \`genshin\` - Gets some picked characters.
            \`genshin character\` - Gets information on the character.
            `,
            examples:
            `
            \`=>genshin klee\`
            \`=>genshin lumine\`
            `,
            aliases: ["genshinimpact"],
            random: "none",
            cooldown: 10,
            subcommandEnabled: true
        })
        const characterOption = new SlashCommandOption()
            .setType("string")
            .setName("character")
            .setDescription("Character to search for.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(characterOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        if (discord.checkMuted(message)) if (!perms.checkNSFW()) return
        let query = Functions.combineArgs(args, 1).trim().replace(/ +/g, "-")
        if (!query) {
            query = this.defaults[Math.floor(Math.random()*this.defaults.length)].trim()
        }

        let thumb = "icon-big.png"
        let image = "gacha-splash.png"
        let name = ""

        if (query.toLowerCase() === "lumine") {
            image = "portraitf.png"
            thumb = "icon-big-lumine.png"
            query = "traveler-anemo"
            name = "Lumine"
        } else if (query.toLowerCase() === "aether") {
            image = "portraitm.png"
            thumb =  "icon-big-aether.png"
            query = "traveler-anemo"
            name = "Aether"
        }
        
        const json = await axios.get(`https://genshin.jmp.blue/characters/${query}`).then((r) => r.data)

        if (!name) name = json?.name
        if (!name) {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "genshin impact", iconURL: "https://kisaragi.moe/assets/embed/genshin.png"})
            .setTitle(`**Genshin Impact Search** ${discord.getEmoji("kleePout")}`))
        }
        const genshinEmbed = embeds.createEmbed()
        genshinEmbed
        .setAuthor({name: "genshin impact", iconURL: "https://kisaragi.moe/assets/embed/genshin.png"})
        .setTitle(`**Genshin Impact Search** ${discord.getEmoji("kleePout")}`)
        .setURL(`https://genshin-impact.fandom.com/wiki/${name}`)
        .setThumbnail(`https://genshin.jmp.blue/characters/${json.id}/${thumb}`)
        .setImage(`https://genshin.jmp.blue/characters/${json.id}/${image}`)
        .setDescription(
            `${discord.getEmoji("star")}_Character:_ **${name}**\n` +
            `${discord.getEmoji("star")}_Title:_ **${json.title ? json.title : "None"}**\n` +
            `${discord.getEmoji("star")}_Nation:_ **${json.nation}**\n` +
            `${discord.getEmoji("star")}_Affiliation:_ **${json.affiliation}**\n` +
            `${discord.getEmoji("star")}_Vision:_ **${json.vision}**\n` +
            `${discord.getEmoji("star")}_Weapon:_ **${json.weapon}**\n` +
            `${discord.getEmoji("star")}_Birthday:_ **${json.birthday ? Functions.formatDate(json.birthday).split(",")[0] : "Unknown"}**\n` +
            `${discord.getEmoji("star")}_Constellation:_ **${json.constellation}**\n` +
            `${discord.getEmoji("star")}_Rarity:_ **${json.rarity}${discord.getEmoji("starYellow")}**\n` +
            `${discord.getEmoji("star")}_Release Date:_ **${Functions.formatDate(json.release)}**\n` +
            `${discord.getEmoji("star")}_Description:_ ${json.description}\n`
        )
        return this.reply(genshinEmbed)
    }
}