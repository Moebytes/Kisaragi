import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Kisaragi} from "../../structures/Kisaragi"
import {SQLQuery} from "../../structures/SQLQuery"

export default class Leaderboard extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Show the guild xp leaderboard.",
          help:
          `
          \`leaderboard\` - Posts the leaderboard
          `,
          examples:
          `
          \`=>leaderboard\`
          `,
          guildOnly: true,
          cachedGuildOnly: true,
          aliases: ["lb", "top"],
          cooldown: 3,
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
      const sql = new SQLQuery(message)

      let scores = await sql.fetchColumn("guilds", "scores")
      if (!scores?.[0]) return this.reply(`This server has no scores ${discord.getEmoji("kannaFacepalm")}`)
      scores = scores.sort((a: any, b: any) => (Number(JSON.parse(a).score) > Number(JSON.parse(b).score)) ? -1 : 1)
      const iterations = Math.ceil(message.guild!.memberCount / 10)
      const step = 10

      const embedArray: EmbedBuilder[] = []

      for (let i = 0; i < iterations; i++) {
        const topEmbed = embeds.createEmbed()
        let description = ""
        for (let j = 0; j < step; j++) {
          const k = (i*step) + j
          if (!scores[k]) break
          const user = JSON.parse(scores[k])
          description +=
          `${discord.getEmoji("star")}_User:_ <@${user.id}>\n` +
          `${discord.getEmoji("star")}_Points:_ **${user.score}**\n` +
          `${discord.getEmoji("star")}_Level:_ **${user.level}**\n`
        }
        topEmbed
        .setTitle(`**${message.guild!.name}'s Leaderboard** ${discord.getEmoji("hanaDesires")}`)
        .setThumbnail(message.guild!.iconURL({extension: "png"}) as string)
        .setDescription(description)
        embedArray.push(topEmbed)
      }

      if (!embedArray[0]) return this.reply(`There are no scores ${discord.getEmoji("kannaFacepalm")}`)
      if (embedArray.length === 1) {
        this.reply(embedArray[0])
      } else {
        embeds.createReactionEmbed(embedArray)
      }
  }
}
