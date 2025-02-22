import {Message, TextChannel} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"

export default class Delete extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Deletes the specified number of messages.",
            help:
            `
            \`delete number\` - Deletes the number of messages, up to 1000
            \`delete number user id\` - Deletes the last x messages by the user
            \`delete number query\` - Deletes the last x messages containing the query
            \`delete number text\` - Deletes only text messages
            \`delete number image\` - Deletes only messages with images
            `,
            examples:
            `
            \`=>delete 1000\`
            \`=>delete 100 badWord\`
            `,
            aliases: ["del", "purge"],
            guildOnly: true,
            cachedGuildOnly: true,
            botPermission: "ManageMessages",
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const typeOption = new SlashCommandOption()
            .setType("string")
            .setName("type")
            .setDescription("Can be a user id/query/text/image.")

        const numberOption = new SlashCommandOption()
            .setType("integer")
            .setName("number")
            .setDescription("Number of messages to delete.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(numberOption)
            .addOption(typeOption)
    }

    public bulkDelete = async (num: number, message: Message, userID: boolean, search: boolean, args: string[], query: string, text: boolean, image: boolean) => {
        const msgArray: string[] = []
        if (userID) {
            const messages = await message.channel.messages.fetch({limit: num}).then((c) => c.map((m: Message) => m))
            for (let i = 0; i < messages.length; i++) {
                if (messages[i].author!.id === args[2].match(/\d+/g)!.join("")) {
                    msgArray.push(messages[i].id)
                }
            }
            await (message.channel as TextChannel).bulkDelete(msgArray, true)
        } else if (search) {
            const messages = await message.channel.messages.fetch({limit: num}).then((c) => c.map((m: Message) => m))
            for (let i = 0; i < messages.length; i++) {
                if (messages[i].embeds[0] ?
                (messages[i].embeds[0].description ? messages[i].embeds[0].description!.toLowerCase().includes(query.trim().toLowerCase()) : false)
                : messages[i].content.toLowerCase().includes(query.trim().toLowerCase())) {
                    msgArray.push(messages[i].id)
                }
            }
            await (message.channel as TextChannel).bulkDelete(msgArray, true)
        } else if (text) {
            const messages = await message.channel.messages.fetch({limit: num}).then((c) => c.map((m: Message) => m))
            for (let i = 0; i < messages.length; i++) {
                if (!message.attachments.size) msgArray.push(messages[i].id)
            }
            await (message.channel as TextChannel).bulkDelete(msgArray, true)
        } else if (image) {
            const messages = await message.channel.messages.fetch({limit: num}).then((c) => c.map((m: Message) => m))
            for (let i = 0; i < messages.length; i++) {
                if (message.attachments.size) msgArray.push(messages[i].id)
            }
            await (message.channel as TextChannel).bulkDelete(msgArray, true)
        } else {
            await (message.channel as TextChannel).bulkDelete(num, true)
        }
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        if (!await perms.checkMod()) return
        if (!message.channel.isSendable()) return
        const delEmbed = embeds.createEmbed()
        let num: number = Number(args[1])
        let userID = false
        let search = false
        let text = false
        let image = false
        let query = ""
        if (args[2]) {
            if (args[2].match(/\d+/g)) {
                userID = true
            } else if (args[2].match(/text/i)) {
                text = true
            } else if (args[2].match(/image/i)) {
                image = true
            } else {
                query = Functions.combineArgs(args, 2)
                search = true
            }
        }

        if (!num) {
            delEmbed.setDescription("Correct usage is =>del (number).")
            return this.reply(delEmbed)
        }

        if (num < 0 || num > 1000) {
            delEmbed.setDescription("You must type a number between 0 and 1000!")
            return this.reply(delEmbed)
        }

        if (message instanceof Message) {
            const loading = message.channel.lastMessage
            await Functions.deferDelete(loading, 0)
            await Functions.deferDelete(message, 0)
        } else {
            await this.reply("Deleting...")
            num += 1
        }

        if (num <= 100) {
            await this.bulkDelete(num, message, userID, search, args, query, text, image)
        } else {
            const iterations = Math.floor(num / 100)
            for (let i = 0; i <= iterations; i++) {
                await this.bulkDelete(100, message, userID, search, args, query, text, image)
            }
            await this.bulkDelete(num % 100, message, userID, search, args, query, text, image)
        }

        if (userID) {
            delEmbed
            .setDescription(`Deleted the last **${args[1]}** messages by <@${args[2].match(/\d+/g)!.join("")}>!`)
        } else if (search) {
            delEmbed
            .setDescription(`Deleted the last **${args[1]}** messages containing **${query}**!`)
        } else if (text) {
            delEmbed
            .setDescription(`Deleted the last **${args[1]}** text messages!`)
        } else if (image) {
            delEmbed
            .setDescription(`Deleted the last **${args[1]}** messages containing images!`)
        } else {
            delEmbed
            .setDescription(`Deleted **${args[1]}** messages in this channel!`)
        }
        const msg = await this.send(delEmbed) as Message
        Functions.deferDelete(msg, 5000)
    }
}
