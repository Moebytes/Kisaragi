import {GuildMember, Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Role extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Adds or removes a role from a user.",
          help:
          `
          \`role add user role\` - Adds the role to the specified user
          \`role del user role\` - Deletes the role from the specified user
          `,
          examples:
          `
          \`=>role add @user @kawaii\`
          \`=>role del @user @normie\`
          `,
          guildOnly: true,
          aliases: [],
          cooldown: 5,
          subcommandEnabled: true
        })
        const roleOption = new SlashCommandOption()
            .setType("role")
            .setName("role")
            .setDescription("The role to add/del.")
            .setRequired(true)

        const userOption = new SlashCommandOption()
            .setType("user")
            .setName("user")
            .setDescription("The user to add/del the role.")
            .setRequired(true)

        const addOption = new SlashCommandOption()
            .setType("string")
            .setName("add")
            .setDescription("Can be add/del.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(addOption)
            .addOption(userOption)
            .addOption(roleOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        if (!await perms.checkMod()) return

        const roleEmbed = embeds.createEmbed()
        .setTitle(`**Role** ${discord.getEmoji("akariLurk")}`)
        if (!args[3] || !/\d+/.test(args[2])) {
          return message.reply({embeds: [roleEmbed.setDescription("You must type =>role <add or del> (user) (role)")]})
        } else {
            let userID = args[2].match(/\d+/)?.[0] || ""
            let member = await message.guild?.members.fetch(userID)!
            const roleName: string = args[3]
            const snowflake: RegExp = /\d+/
            let roleID: string = roleName.substring(roleName.search(snowflake))
            if (roleID.includes(">")) roleID = roleID.slice(0, -1)
            const role = message.guild!.roles.cache.get(roleID)
            if (!role) return this.reply(roleEmbed.setDescription(`The role **${roleName}** could not be found.`))

            switch (args[1]) {
              case "add": {
                  try {
                    await member.roles.add(role)
                    await this.reply(roleEmbed.setDescription(`${member.displayName} now has the ${role} role!`))
                  } catch {
                    return this.reply(`I need the **Manage Roles** permission ${discord.getEmoji("kannaFacepalm")}`)
                  }
                  break
              }
              case "del": {
                try {
                  await member.roles.remove(role)
                  await this.reply(roleEmbed.setDescription(`${member.displayName} no longer has the ${role} role!`))
                } catch {
                  return this.reply(`I need the **Manage Roles** permission ${discord.getEmoji("kannaFacepalm")}`)
                }
                break
              }
              default:
                return this.reply(`You must specify whether you want to **add** or **del** a role ${discord.getEmoji("kannaFacepalm")}`)
            }
        }

  }
}
