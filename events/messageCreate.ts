import {Collection, Message, ChannelType, AttachmentBuilder, TextChannel, MessageType} from "discord.js"
import path from "path"
import responses from "../assets/json/responses.json"
import {CommandFunctions} from "../structures/CommandFunctions"
import {Cooldown} from "../structures/Cooldown.js"
import {Kisaragi} from "../structures/Kisaragi.js"
import {Block} from "../structures/Block"
import {Detector} from "../structures/Detector"
import {Embeds} from "../structures/Embeds"
import {Functions} from "../structures/Functions"
import {Generate} from "../structures/Generate"
import {Haiku} from "../structures/Haiku"
import {Letters} from "../structures/Letters"
import {Link} from "../structures/Link"
import {Permission} from "../structures/Permission"
import {Points} from "../structures/Points"
import {SQLQuery} from "../structures/SQLQuery"

const responseTextCool = new Set()
const responseImageCool = new Set()
const haikuCool = new Set()
const firstMessage = new Set()
const globalChatCool = new Set()
const pointCool = new Collection() as Collection<string, Set<string>>

export default class MessageCreate {
    constructor(private readonly discord: Kisaragi) {}

    public run = async (message: Message) => {
      const discord = this.discord
      if (message.partial) message = await message.fetch()
      const letters = new Letters(this.discord)
      const points = new Points(this.discord, message)
      const haiku = new Haiku(this.discord, message)
      const detect = new Detector(this.discord, message)
      const block = new Block(this.discord, message)
      const cmdFunctions = new CommandFunctions(this.discord, message)
      const links = new Link(this.discord, message)
      const generate = new Generate(this.discord, message)
      const embeds = new Embeds(this.discord, message)
      const perms = new Permission(this.discord, message)
      const sql = new SQLQuery(message)

      let prefix = await SQLQuery.fetchPrefix(message)
      if (!prefix) prefix = "=>"

      if (message.author.bot) return
      if (await this.discord.blacklistStop(message)) return

      if (!this.discord.checkMuted(message)) {
        if (message.guild) {
          const globalChat = await sql.fetchColumn("guilds", "global chat")
          if (globalChat && !message.content.startsWith(prefix) && !message.author.bot) {
            const globalChannel = message.guild.channels.cache.find((c) => c.id === globalChat)
            if (message.channel.id === globalChannel?.id) {
              if (globalChatCool.has(message.author.id)) return this.discord.reply(message, `You hit the rate limit for **global chat**! Wait 3 seconds before trying again. ${this.discord.getEmoji("kannaHungry")}`)
              if (message.content.length > 300) return this.discord.reply(message, `There is a limit of 300 characters on the global chat. ${this.discord.getEmoji("sagiriBleh")}`)
              if (message.mentions.users.size) return this.discord.reply(message, `You can't mention anyone on the global chat. ${this.discord.getEmoji("sagiriBleh")}`)
              if (block.containsInvite()) return this.discord.reply(message, `You can't post invite links on the global chat. ${this.discord.getEmoji("sagiriBleh")}`)
              if (message.attachments.first()) message.content = message.attachments.first()!.url
              const cleaned = message.content.replace(/@/g, `@\u200b`)
              const translated = await Functions.googleTranslate(cleaned)
              if (Functions.badWords(translated, true)) return this.discord.reply(message, `You can't post messages containing profane or dirty words. ${this.discord.getEmoji("sagiriBleh")}`)
              let globalChannels = await SQLQuery.selectColumn("guilds", "global chat")
              globalChannels = globalChannels.filter(Boolean)
              for (let i = 0; i < globalChannels.length; i++) {
                if (globalChannels[i] === message.channel.id) continue
                const sourceChan = message.channel as TextChannel
                const chan = this.discord.channels.cache.find((c) => c.id === globalChannels[i]) as TextChannel
                chan.send(`\`#${sourceChan.name}\` ${message.author.tag} -> ${translated}`)
                globalChatCool.add(message.author.id)
                setTimeout(() => {
                  globalChatCool.delete(message.author.id)
                }, 3000)
              }
            }
          }
          block.blockWord()
          block.blockInvite()
          block.everyone()
          block.gallery()
          detect.detectAnime()
          detect.swapRoles()
          detect.source()
          const haikuEmbed = await haiku.haiku()
          if (haikuEmbed) {
            if (haikuCool.has(message.author.id) || haikuCool.has(message.guild?.id)) {
              const reply = await this.discord.send(message, `<@${message.author.id}>, You hit the rate limit for **haiku**! Please wait 3 seconds before trying again. ${this.discord.getEmoji("kannaHungry")}`)
              Functions.deferDelete(reply, 3000)
              return
            }
            const id = message.guild?.id ?? message.author.id
            haikuCool.add(id)
            setTimeout(() => haikuCool.delete(id), 3000)
            return this.discord.send(message, haikuEmbed)
          }

          if (!pointCool.get(message.guild.id)?.has(message.author.id)) {
            points.calcScore()
            pointCool.get(message.guild.id)?.add(message.author.id)
            const pointTimeout = await sql.fetchColumn("guilds", "point timeout")
            setTimeout(() => {
              pointCool.get(message.guild?.id ?? "")?.delete(message.author.id)
            }, pointTimeout ? Number(pointTimeout) : 60000)
          }

          if (!firstMessage.has(message.guild.id)) {
            await embeds.updateColor()
            perms.continueTempBans()
            perms.continueTempMutes()
            cmdFunctions.autoCommand()
            firstMessage.add(message.guild.id)
            pointCool.set(message.guild.id, new Set())
          }
        }
        const responseToggle = await sql.fetchColumn("guilds", "response")
        if (responseToggle === "on") {
          if (responses.text[message.content.trim().toLowerCase()]) {
            const response = message.content.trim().toLowerCase()
            if (!message.author!.bot) {
              if (responseTextCool.has(message.author.id) || responseTextCool.has(message.guild?.id)) {
                const reply = await this.discord.send(message, `<@${message.author.id}>, You hit the rate limit for **${response}**! Wait 3 seconds before trying again. ${this.discord.getEmoji("kannaHungry")}`)
                await Functions.deferDelete(reply, 3000)
                return Functions.deferDelete(message, 0)
              }
              const id = message.guild?.id ?? message.author.id
              responseTextCool.add(id)
              setTimeout(() => responseTextCool.delete(id), 3000)
              let text = responses.text[response]
              if (text === "f") {
                text = this.discord.getEmoji("FU")
              } else if (text === "rip") {
                text = this.discord.getEmoji("rip")
              } else if (Array.isArray(text)) {
                text = text.join("")
              }
              return this.discord.send(message, text)
            }
          }
          if (responses.image[message.content.trim().toLowerCase()]) {
            const response = message.content.trim().toLowerCase()
            if (!message.author!.bot) {
              if (responseImageCool.has(message.author.id) || responseImageCool.has(message.guild?.id)) {
                const reply = await this.discord.send(message, `<@${message.author.id}>, You hit the rate limit for **${response}**! Please wait 10 seconds before trying again.`)
                await Functions.deferDelete(reply, 3000)
                return Functions.deferDelete(message, 0)
              }
              const id = message.guild?.id ?? message.author.id
              responseImageCool.add(id)
              setTimeout(() => responseImageCool.delete(id), 10000)
              return this.discord.send(message, "", new AttachmentBuilder(responses.image[response]))
            }
         }
        }
        if (this.discord.checkBotMention(message)) {
          const args = message.content.slice(`<@!${this.discord.user?.id}>`.length).trim().split(/ +/g)
          if (args[0]) {
            cmdFunctions.runCommand(message, args)
          } else {
            this.discord.reply(message, `My prefix is set to "**${prefix}**"!\n`)
          }
        }
        if (!message.content.trim().startsWith(prefix) && message.content.match(/https?:\/\//)) {
          const linkToggle = await sql.fetchColumn("guilds", "links")
          if (linkToggle === "on") await links.postLink()
          return
        }
      }

      if (!message.content.trim().startsWith(prefix)) return
      if (message.content.trim() === prefix) return
      const args = message.content.trim().slice(prefix.length).split(/ +/g)
      if (args[0] === undefined) return
      const cmd = args[0].toLowerCase()
      const command = cmdFunctions.findCommand(cmd)
      if (!command) return cmdFunctions.noCommand(cmd)
      if (command.options.unlist && !perms.checkBotDev()) return
      if (command.options.voteLocked && !await perms.checkVoteLocked()) return
      if (command.options.premium && !perms.checkPremium()) return
      command.message = message

      if (!discord.checkSufficientPermissions(message)) return
      if (command.options.guildOnly) {
        if (message.channel.type === ChannelType.DM) return this.discord.send(message, `<@${message.author.id}>, sorry but you can only use this command in guilds. ${this.discord.getEmoji("kannaFacepalm")}`)
      }

      const disabledCategories = await sql.fetchColumn("guilds", "disabled categories")
      if (disabledCategories?.includes(command.category) && cmd !== "help") {
        return this.discord.reply(message, `Sorry, commands in the category **${command.category}** were disabled on this server. ${this.discord.getEmoji("mexShrug")}`)
      }

      const cooldown = new Cooldown(this.discord, message)
      const onCooldown = cooldown.cmdCooldown(command.name, command.options.cooldown)
      if (onCooldown && (message.author?.id !== process.env.OWNER_ID)) return this.discord.reply(message, onCooldown)
      if (command.options.unlist && message.author.id !== process.env.OWNER_ID) return this.discord.reply(message, `Only the bot developer can use commands not listed on the help command. ${this.discord.getEmoji("sagiriBleh")}`)

      sql.usageStatistics(command.path)
      this.discord.muted = false
      const msg = await this.discord.send(message, `**Loading** ${this.discord.getEmoji("kisaragiCircle")}`) as Message
      this.discord.muted = this.discord.checkMuted(message)

      try {
        await command.run(args)
        const msgCheck = message.channel.messages
        if (msgCheck.cache.has(msg.id)) Functions.deferDelete(msg, 1000)
      } catch (err: any) {
        this.discord.send(message, this.discord.cmdError(message, err))
      }
    }
  }
