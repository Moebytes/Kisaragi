import chalk from "chalk"
import moment from "moment"
import {ActivityType} from "discord.js"
import {Kisaragi} from "../structures/Kisaragi"
import {SQLQuery} from "../structures/SQLQuery"

export default class Ready {
    constructor(private readonly discord: Kisaragi) {}

    public run = async () => {
      await this.discord.application?.emojis.fetch()
      this.discord.user?.setPresence({activities: [{type: ActivityType.Playing, name: `=>help | ${this.discord.guilds.cache.size} guilds`, state: "dnd"}]})
      const timestamp = `${moment().format("MM DD YYYY hh:mm:ss")} ->`
      const logString = `${timestamp} Logged in as ${this.discord.user!.tag}!`
      const readyString = `${timestamp} Ready in ${this.discord.guilds.cache.size} guilds on ${this.discord.channels.cache.size} channels, for a total of ${this.discord.users.cache.size} users.`
      console.log(chalk.magentaBright(logString))
      console.log(chalk.magentaBright(readyString))
      SQLQuery.cleanup()
      this.discord.postGuildCount()
    }
}
