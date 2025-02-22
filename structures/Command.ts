import {Message, EmbedBuilder, ChatInputCommandInteraction, SlashCommandSubcommandBuilder, 
RESTPostAPIChatInputApplicationCommandsJSONBody, AttachmentBuilder, MessageReplyOptions,
RESTPostAPIContextMenuApplicationCommandsJSONBody, ContextMenuCommandInteraction} from "discord.js"
import {Kisaragi} from "./Kisaragi"

interface CommandOptions {
  params: string
  description: string
  help: string
  examples: string
  enabled: boolean
  guildOnly: boolean
  cachedGuildOnly: boolean
  aliases: string[]
  cooldown: number
  permission: string
  botPermission: string
  random: "none" | "string" | "specific" | "ignore"
  unlist: boolean
  nsfw: boolean
  botdev: boolean
  voteLocked: boolean
  premium: boolean
  defer: boolean
  slashEnabled: boolean
  subcommandEnabled: boolean
  contextEnabled: boolean
}

export class Command {
  public name: string
  public category: string
  public path: string
  public options: CommandOptions
  public slash: RESTPostAPIChatInputApplicationCommandsJSONBody
  public subcommand: SlashCommandSubcommandBuilder
  public context: RESTPostAPIContextMenuApplicationCommandsJSONBody

  constructor(public discord: Kisaragi, public message: Message, {
      params = "",
      description = "No description provided.",
      help = "This command is not documented.",
      examples = "There are no examples.",
      enabled = true,
      guildOnly = false,
      cachedGuildOnly = false,
      aliases = [""],
      cooldown = 3,
      permission = "SendMessages",
      botPermission = "SendMessages",
      random = "ignore" as "none" | "string" | "specific" | "ignore",
      unlist = false,
      nsfw = false,
      botdev = false,
      voteLocked = false,
      premium = false,
      defer = false,
      slashEnabled = false,
      subcommandEnabled = false,
      contextEnabled = false
    }) {
      this.name = ""
      this.category = ""
      this.path = ""
      this.options = {params, description, help, examples, enabled, guildOnly, cachedGuildOnly, aliases, cooldown, permission, 
      botPermission, random, unlist, nsfw, botdev, voteLocked, premium, defer, slashEnabled, subcommandEnabled, contextEnabled}
      this.slash = null as unknown as RESTPostAPIChatInputApplicationCommandsJSONBody
      this.subcommand = null as unknown as SlashCommandSubcommandBuilder
      this.context = null as unknown as RESTPostAPIContextMenuApplicationCommandsJSONBody
    }

  get help() {
      return this.options
  }

  public run = async (args: string[]): Promise<void | Message | string> => {}

  public reply = (embeds: EmbedBuilder | EmbedBuilder[] | string, 
    files?: AttachmentBuilder | AttachmentBuilder[], opts?: MessageReplyOptions) => {
    return this.discord.reply(this.message, embeds, files, opts)
  }

  public send = (embeds: EmbedBuilder | EmbedBuilder[] | string, 
    files?: AttachmentBuilder | AttachmentBuilder[], opts?: MessageReplyOptions) => {
    return this.discord.send(this.message, embeds, files, opts)
  }

  public edit = (msg: Message, embeds: EmbedBuilder | EmbedBuilder[] | string, 
    files?: AttachmentBuilder | AttachmentBuilder[], opts?: MessageReplyOptions) => {
    return this.discord.edit(msg, embeds, files, opts)
  }

  public deferReply = (interaction?: ChatInputCommandInteraction | ContextMenuCommandInteraction) => {
    return this.discord.deferReply(interaction ? interaction : this.message as any)
  }

  public noQuery = (embed: EmbedBuilder, text?: string) => {
    const discord = this.discord
    const desc = text ? `${discord.getEmoji("star")}You must provide a search query. ${text}` : `${discord.getEmoji("star")}You must provide a search query.`
    embed.setDescription(desc)
    this.reply(embed)
  }

  public invalidQuery = (embed: EmbedBuilder, text?: string) => {
    const discord = this.discord
    const desc = text ? `${discord.getEmoji("star")}No results were found. ${text}` : `${discord.getEmoji("star")}No results were found.`
    embed.setDescription(desc)
    this.reply(embed)
  }
}
