import {ChatInputCommandInteraction, Message, GuildMember} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption, ContextMenuCommand} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"

export default class Avatar extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Posts the avatar of a user.",
          help:
          `
          \`avatar\` - Posts your avatar
          \`avatar @user1 @user2\` - Posts the avatar(s) of the mentioned user(s)
          `,
          examples:
          `
          \`=>avatar\`
          `,
          aliases: ["av"],
          random: "none",
          cooldown: 5,
          subcommandEnabled: true,
          contextEnabled: true
        })
        const userOption = new SlashCommandOption()
            .setType("mentionable")
            .setName("user")
            .setDescription("Posts avatar of this user.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(userOption)
        
        this.context = new ContextMenuCommand()
          .setName(this.constructor.name)
          .setType("user")
          .toJSON()
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const avatarEmbed = embeds.createEmbed()

        if (!args[1]) {
          return this.reply(avatarEmbed
            .setDescription(`**${message.author!.username}'s Profile Picture**`)
            .setImage(await discord.displayAvatar(message)))
        }

        if (!message.guild) {
          let interaction = message as unknown as ChatInputCommandInteraction
          const member = interaction.options.getMentionable("user") as GuildMember
          const user = await this.discord.users.fetch(args[1])
          let avatar = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=512`
          if (member.avatar) avatar = `https://cdn.discordapp.com/guilds/${message.guildId}/users/${user.id}/avatars/${member.avatar}.webp?size=512`
          return this.reply(avatarEmbed
            .setDescription(`**${user.username}'s Profile Picture**`)
            .setURL(avatar)
            .setImage(avatar))
        }

        let ids = args.slice(1).map((a) => a.match(/\d+/)?.[0] || "")
        let members = await Promise.all(ids.map((id) => message.guild?.members.fetch(id)))

        for (const member of members) {
          if (!member) continue
          const avatar = member.displayAvatarURL({extension: "png", size: 512})
          await this.reply(avatarEmbed
            .setDescription(`**${member.user.username}'s Profile Picture**`)
            .setURL(avatar)
            .setImage(avatar))
        }
  }
}
