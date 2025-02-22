import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import fs from "fs"
import {Command} from "../../structures/Command"
import config from "./../../config.json"
import pack from "./../../package.json"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Info extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Posts info on the bot.",
          help:
          `
          \`info\` - Posts bot info
          `,
          examples:
          `
          \`=>info\`
          `,
          aliases: ["about"],
          random: "none",
          cooldown: 5,
          subcommandEnabled: true
        })
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)

        let cmdCount = discord.commands.size

        const description =
        `[Kisaragi](https://azurlane.koumakan.jp/Kisaragi) was a Mutsuki-Class Destroyer of the Imperial Japanese Navy ` +
        `during World War II. She was sunken at the [Battle of Wake Island](https://en.wikipedia.org/wiki/Battle_of_Wake_Island) by American aircraft. ` +
        `Kisaragi is part of [Azur Lane](https://en.wikipedia.org/wiki/Azur_Lane), which is basically a game where cute anime girl personifications of World War II battleships battle it out. ` +
        `Azur Lane also has an [Anime](https://myanimelist.net/anime/38328/Azur_Lane) series.`

        const infoEmbed = embeds.createEmbed()
        .setTitle(`**Kisaragi Bot Info** ${discord.getEmoji("tohruSmug")}`)
        .setURL(config.repo)
        .setThumbnail(discord.user!.displayAvatarURL({extension: "png"}))
        .setDescription(
            `${discord.getEmoji("star")}_Description:_ ${description}\n` +
            `${discord.getEmoji("star")}_Version:_ **${pack.version}**\n` +
            `${discord.getEmoji("star")}_Creator_: **Moebytes**\n` +
            `${discord.getEmoji("star")}_Library_: **Discord.js**\n` +
            `${discord.getEmoji("star")}_Runtime:_ **Node.js**\n` +
            `${discord.getEmoji("star")}_Language:_ **Typescript**\n` +
            `${discord.getEmoji("star")}_Database:_ **PostgreSQL**\n` +
            `${discord.getEmoji("star")}_Guilds:_ **${await discord.shardedGuildCount()}**\n` +
            `${discord.getEmoji("star")}_Channels:_ **${await discord.shardedChannelCount()}**\n` +
            `${discord.getEmoji("star")}_Users:_ **${await discord.shardedUserCount()}**\n` +
            `${discord.getEmoji("star")}_Emojis:_ **${discord.emojis.cache.size}**\n` +
            `${discord.getEmoji("star")}_Commands_: **${cmdCount}**\n`+
            `${discord.getEmoji("star")}_Prefix_: Your prefix is set to **${await SQLQuery.fetchPrefix(message)}**.\n`+
            `[**Website**](${config.website})\n` +
            `[**Invite Link**](${config.invite})\n` +
            `[**Support Server**](${config.support})\n` +
            `[**Github Repository**](${config.repo})`
        )
        return this.reply(infoEmbed)
    }
}
