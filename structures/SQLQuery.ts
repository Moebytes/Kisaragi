import axios from "axios"
import chalk from "chalk"
import {Message} from "discord.js"
import {Base64 as base64} from "js-base64"
import moment from "moment"
import {Pool, QueryArrayConfig, QueryConfig, QueryResult} from "pg"
import {pgDump} from "pg-dump-restore"
import {S3} from "@aws-sdk/client-s3"
import querystring from "querystring"
import * as Redis from "redis"
import config from "../config.json"
import {Command} from "./Command"
import {Functions} from "./Functions"
import {Settings} from "./Settings"
import fs from "fs"
import path from "path"

const pgPool = process.env.LOCAL_DATABASE === "yes" ? new Pool({
  user: process.env.PG_LOCAL_USER,
  host: process.env.PG_LOCAL_HOST,
  database: process.env.PG_LOCAL_DATABASE,
  password: process.env.PG_LOCAL_PASSWORD,
  port: Number(process.env.PG_LOCAL_PORT)
}) : new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT)
})

const redis = Redis.createClient({
  url: process.env.LOCAL_DATABASE === "yes" ? process.env.LOCAL_REDIS_URL : process.env.REDIS_URL
})

if (process.env.TESTING !== "yes" && process.env.REDIS === "on") redis.connect()

export class SQLQuery {
  constructor(private readonly message: Message) {}

  /** Run query */
  public static run = async (query: QueryConfig | QueryArrayConfig, newData?: boolean): Promise<string[][]> => {
      const start = Date.now()
      let redisResult = null
      if (!newData) {
        try {
          redisResult = await redis.get(JSON.stringify(query)).catch(() => null) as any
          // SQLQuery.logQuery(Object.values(query)[0], start, true)
          if (redisResult) return (JSON.parse(redisResult))?.[0]
        } catch {
          // ignore
        }
      }
      const pgClient = await pgPool.connect()
      try {
          const result: QueryResult<string[]> = await pgClient.query(query)
          // SQLQuery.logQuery(Object.values(query)[0], start)
          await redis.set(JSON.stringify(query), JSON.stringify(result.rows)).catch(() => null)
          return result.rows
        } catch (error) {
          // console.log(error.stack)
          return [["Error"]]
        } finally {
          pgClient.release(true)
        }
  }

  /** Create the Database. */
  public static createDB = async () => {
    const sql = fs.readFileSync(path.join(__dirname, "CreateDB.sql")).toString()
    return SQLQuery.run({text: sql})
  }

  /** Log query */
  public static logQuery = (text: any, start: number, blue?: boolean): void => {
      const duration = Date.now() - start
      const color = blue ? "cyanBright" : "magentaBright"
      const timestamp = `${moment().format("MM DD YYYY hh:mm:ss")} ->`

      const queryString = `${timestamp} Executed query ${text} in ${duration} ms`
      console.log(chalk`{${color} ${queryString}}`)
    }

  /** Flush redis db */
  public static flushDB = async (): Promise<void> => {
      await redis.flushDb()
    }

  /** Redis set */
  public static redisSet = async (key: string, value: string | null, expiration?: number) => {
    if (value === null) value = "null"
    if (expiration) {
      await redis.setEx(key, expiration, value).catch(() => null)
    } else {
      await redis.set(key, value).catch(() => null)
    }
  }

  /** Redis get */
  public static redisGet = async (key: string) => {
    const result = await redis.get(key).catch(() => null) as any
    return result
  }

  /** Fetch a row */
  public fetchRow = async (table: string, update?: boolean): Promise<string[]> => {
    const query: QueryArrayConfig = {
      text: `SELECT * FROM "${table}" WHERE "guild id" = $1`,
      rowMode:"array",
      values: [this.message.guild?.id]
    }
    const result = update ? await SQLQuery.run(query, true) : await SQLQuery.run(query)
    return result[0]
}

  /** Fetch commands */
  public static fetchCommand = async (command: string, column: string): Promise<string[]> => {
    const query: QueryArrayConfig = {
      text: `SELECT "${column}" FROM commands WHERE command IN ($1)`,
      values: [command],
      rowMode: "array"
    }
    const result = await SQLQuery.run(query, true)
    return result[0]
  }

  /** Fetch aliases */
  public fetchAliases = async (update?: boolean): Promise<string[]> => {
      const query: QueryArrayConfig = {
        text: `SELECT aliases FROM commands`,
        rowMode: "array"
      }
      const result = await SQLQuery.run(query, true)
      return result[0]
  }

  /** Fetch prefix */
  public static fetchPrefix = async (message: Message, update?: boolean): Promise<string> => {
    if (!message?.guild?.id) return "=>"
    const query: QueryArrayConfig = {
        text: `SELECT prefix FROM guilds WHERE "guild id" = $1`,
        rowMode: "array",
        values: [message.guild?.id]
    }
    const result = update ? await SQLQuery.run(query, true) : await SQLQuery.run(query)
    if (!result) {
        await SQLQuery.initGuild(message)
        return "=>"
      } else {
        return String(result) ? String(result) : "=>"
      }
  }

  /** Fetch column */
  public fetchColumn = async (table: string, column: string, key?: string | boolean, value?: string | boolean): Promise<any> => {
    const query: QueryArrayConfig = key ? {
      text: `SELECT "${column}" FROM "${table}" WHERE "${key}" = $1`,
      rowMode: "array",
      values: [value]
    } : {
      text: `SELECT "${column}" FROM "${table}" WHERE "guild id" = $1`,
      rowMode: "array",
      values: [this.message.guild?.id]
    }
    const result = await SQLQuery.run(query, true)
    const data = result?.[0]?.[0]
    if (data) {
      if (data === "[]" || data === "{}") return null
      return JSON.parse(JSON.stringify(data))
    }
    return null
  }

  /** Fetch Column Static */
  public static fetchColumn = async (table: string, column: string, key?: string | boolean, value?: string | boolean) => {
    const query: QueryArrayConfig = {
      text: `SELECT "${column}" FROM "${table}" WHERE "${key}" = $1`,
      rowMode: "array",
      values: [value]
    }
    const result = await SQLQuery.run(query, true)
    const data = result?.[0]?.[0]
    if (data) {
      if (data === "[]" || data === "{}") return null
      return JSON.parse(JSON.stringify(data))
    }
    return null
  }

  /** Selects a column. */
  public static selectColumn = async (table: string, column: string, update?: boolean): Promise<any> => {
    const query: QueryArrayConfig = {
      text: `SELECT "${column}" FROM "${table}"`,
      rowMode: "array"
    }
    const result = update ? await SQLQuery.run(query, true) : await SQLQuery.run(query, true)
    return result.flat()
  }

  /** Insert into table */
  public static insertInto = async (table: string, column: string, value: any): Promise<void> => {
      const query: QueryConfig = {
        text: `INSERT INTO "${table}" ("${column}") VALUES ($1)`,
        values: [value]
      }
      await SQLQuery.run(query, true)
  }

  /** Insert a command */
  public static insertCommand = async (name: string, path: string, command: Command): Promise<void> => {
  const cmd = command.options
  const query: QueryConfig = {
      text: `INSERT INTO commands (command, aliases, path, cooldown, help, examples, "guild only", random, permission, "bot permission") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      values: [name, cmd.aliases, path, cmd.cooldown, cmd.help, cmd.examples, cmd.guildOnly, cmd.random, cmd.permission, cmd.botPermission]
    }
  await SQLQuery.run(query, true)
  }

  /** Update prefix */
  public static updatePrefix = async (message: Message, prefix: string): Promise<void> => {
  const query: QueryConfig = {
      text: `UPDATE "guilds" SET "prefix" = $1 WHERE "guild id" = $2`,
      values: [prefix, message.guild?.id]
    }
  await SQLQuery.run(query, true)
  SQLQuery.fetchPrefix(message, true)
  }

  /** Update column in table */
  public updateColumn = async (table: string, column: string, value: any, key?: string, keyVal?: string): Promise<void> => {
      let query: QueryConfig
      if (key) {
        query = {
          text: `UPDATE "${table}" SET "${column}" = $1 WHERE "${key}" = $2`,
          values: [value, keyVal]
        }
      } else {
        query = {
          text: `UPDATE "${table}" SET "${column}" = $1 WHERE "guild id" = $2`,
          values: [value, this.message.guild?.id]
        }
      }
      await SQLQuery.run(query, true)
  }

  /** Update column static */
  public static updateColumn = async (table: string, column: string, value: any, key: string, keyVal: string): Promise<void> => {
    const query: QueryConfig = {
        text: `UPDATE "${table}" SET "${column}" = $1 WHERE "${key}" = $2`,
        values: [value, keyVal]
    }
    await SQLQuery.run(query, true)
  }

  /** Update command */
  public static updateCommand = async (name: string, path: string, command: Command): Promise<void> => {
  const cmd = command.options
  const query: QueryConfig = {
    text: `UPDATE commands SET aliases = $2, cooldown = $3, help = $4, examples = $5, "guild only" = $6, random = $7, permission = $8, "bot permission" = $9, path = $10 WHERE "command" = $1`,
    values: [name, cmd.aliases, cmd.cooldown, cmd.help, cmd.examples, cmd.guildOnly, cmd.random, cmd.permission, cmd.botPermission, path]
  }
  await SQLQuery.run(query, true)
  }

  /** Delete the guild from database. */
  public static deleteGuild = async (guildID: string): Promise<void> => {
      const query: QueryConfig = {
        text: `DELETE FROM "guilds" WHERE "guild id" = $1`,
        values: [guildID]
      }
      await SQLQuery.run(query, true)
  }

  /** Delete a row */
  public static deleteRow = async (table: string, column: string, value: any): Promise<void> => {
    const query: QueryConfig = {
      text: `DELETE FROM "${table}" WHERE "${column}" = $1`,
      values: [value]
    }
    await SQLQuery.run(query, true)
  }

  /** Drops a table. */
  public static dropTable = async (table: string): Promise<void> => {
    const query: QueryConfig = {
      text: `DROP TABLE "${table}"`
    }
    await SQLQuery.run(query, true)
  }

  /** Deletes all entries in a table. */
  public static purgeTable = async (table: string): Promise<void> => {
    const query: QueryConfig = {
      text: `DELETE FROM "${table}"`
    }
    await SQLQuery.run(query, true)
  }

  /** Order guilds table by guild member count */
  public static orderTables = async (): Promise<void> => {
        const query: QueryConfig = {
          text: `SELECT members FROM "guilds" ORDER BY
          CASE WHEN "guild id" = '578604087763795970' THEN 0 ELSE 1 END, members ASC`
        }
        await SQLQuery.run(query, true)
  }

  /** Initialize guild settings */
  public static initGuild = async (message: Message, force?: boolean) => {
    const settings = new Settings(message)
    const query: QueryArrayConfig = {
          text: `SELECT "guild id" FROM guilds`,
          rowMode: "array"
    }
    const result = await SQLQuery.run(query, true)
    const found = result.find((id: string[]) => String(id) === message.guild?.id) as any
    if (!found || force) {
          try {
            await SQLQuery.insertInto("guilds", "guild id", message.guild?.id)
          } catch {
            // Do nothing
          }
          await settings.initAll()
          await SQLQuery.orderTables()
    }
    return
  }

  /** Gets all tables. */
  public static getTables = async () => {
    const query: QueryConfig = {
      text: `SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema = 'public' ORDER BY table_name`
    }
    const result = await SQLQuery.run(query, true) as any
    return result.map((r: any) => r.table_name) as string[]
  }

  /** Deletes all rows from all tables. */
  public static purgeDB = async () => {
    const tables = await SQLQuery.getTables()
    for (let i = 0; i < tables.length; i++) {
      await SQLQuery.dropTable(tables[i])
    }
    return
  }

  /** Deletes duplicate records. */
  public static deleteDuplicates = async (table: string, key: string) => {
    const query: QueryConfig = {
      text: `DELETE FROM "${table}" T1 USING "${table}" T2
      WHERE T1.ctid < T2.ctid AND T1."${key}" = T2."${key}"`
    }
    await SQLQuery.run(query, true)
  }

  /** Deletes user data on account deletion */
  public static deleteUser = async (id: string) => {
    await SQLQuery.deleteRow("misc", "user id", id).catch(() => null)
    await SQLQuery.deleteRow("oauth2", "user id", id).catch(() => null)
  }

  /** Revokes an oauth2 entry */
  public static revokeOuath2 = async (id: string) => {
    const token = await SQLQuery.fetchColumn("oauth2", "access token", "user id", id)
    if (!token) return
    const clientID = process.env.TESTING === "yes" ? process.env.TEST_CLIENT_ID : process.env.CLIENT_ID
    const clientSecret = process.env.TESTING === "yes" ? process.env.TEST_CLIENT_SECRET : process.env.CLIENT_SECRET
    await axios.post(`https://discordapp.com/api/oauth2/token/revoke`, querystring.stringify({
      client_id: clientID,
      client_secret: clientSecret,
      token
    }))
    await SQLQuery.deleteRow("oauth2", "access token", token)
  }

  /** Inits an oauth2 entry */
  public static initOauth2 = async (code: string) => {
    try {
    const clientID = process.env.TESTING === "yes" ? process.env.TEST_CLIENT_ID : process.env.CLIENT_ID
    const clientSecret = process.env.TESTING === "yes" ? process.env.TEST_CLIENT_SECRET : process.env.CLIENT_SECRET
    const redirectURI = process.env.TESTING === "yes" ? config.oauth2Testing : config.oauth2
    const data = await axios.post(`https://discordapp.com/api/oauth2/token`, querystring.stringify({
      client_id: clientID,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectURI,
      scope: "identify,email,connections,guilds,guilds.join,gdm.join"
    })).then((r) => r.data)
    const accessToken = data.access_token
    const refreshToken = data.refresh_token
    const tokenType = data.token_type
    const info = await axios.get(`https://discordapp.com/api/users/@me`, {
      headers: {authorization: `${tokenType} ${accessToken}`}
    }).then((r) => r.data)
    const connections = await axios.get(`https://discordapp.com/api/users/@me/connections`, {
      headers: {authorization: `${tokenType} ${accessToken}`}
    }).then((r) => r.data)
    const guilds = await axios.get(`https://discordapp.com/api/users/@me/guilds`, {
      headers: {authorization: `${tokenType} ${accessToken}`}
    }).then((r) => r.data)
    const tag = `${info.username}#${info.discriminator}`
    try {
      await SQLQuery.insertInto("oauth2", "user id", info.id)
    } catch {
        // Do Nothing
    } finally {
      await SQLQuery.updateColumn("oauth2", "access token", accessToken, "user id", info.id)
      await SQLQuery.updateColumn("oauth2", "refresh token", refreshToken, "user id", info.id)
      await SQLQuery.updateColumn("oauth2", "email", info.email, "user id", info.id)
      await SQLQuery.updateColumn("oauth2", "user tag", tag, "user id", info.id)
      await SQLQuery.updateColumn("oauth2", "connections", connections, "user id", info.id)
      await SQLQuery.updateColumn("oauth2", "guilds", guilds, "user id", info.id)
    }
    } catch {
      return Promise.reject("Error")
    }
  }

  /** Revokes twitter oauth */
  public static revokeTwitterOauth = async (userID: string) => {
    await SQLQuery.updateColumn("oauth2", "twitter token", null, "user id", userID)
    await SQLQuery.updateColumn("oauth2", "twitter secret", null, "user id", userID)
  }

  /** Inits twitter oauth */
  public static twitterOauth = async (token: string, verifier: string) => {
    try {
    const data = await axios.post(`https://api.twitter.com/oauth/access_token?oauth_token=${token}&oauth_verifier=${verifier}`).then((r) => querystring.parse(r.data))
    const twitterToken = data.oauth_token
    const twitterSecret = data.oauth_token_secret
    const username = data.screen_name
    const userID = data.user_id
    const connections = await SQLQuery.selectColumn("oauth2", "connections")
    let index = -1
    twit:
    for (let i = 0; i < connections.length; i++) {
      for (let j = 0; j < connections[i].length; j++) {
        const curr = JSON.parse(connections[i][j])
        if (curr.type === "twitter" && curr.id === userID) {
          index = i
          break twit
        }
      }
    }
    if (index === -1) return Promise.reject("Twitter id not found")
    const discordID = await SQLQuery.fetchColumn("oauth2", "user id", "connections", connections[index])
    await SQLQuery.updateColumn("oauth2", "twitter token", twitterToken, "user id", discordID)
    await SQLQuery.updateColumn("oauth2", "twitter secret", twitterSecret, "user id", discordID)
    await SQLQuery.updateColumn("oauth2", "screen name", username, "user id", discordID)
    await SQLQuery.updateColumn("oauth2", "twitter id", userID, "user id", discordID)
    } catch {
      return Promise.reject("Error")
    }
  }

  public static revokeRedditOauth = async (id: string) => {
    const refreshToken = await SQLQuery.fetchColumn("oauth2", "reddit refresh", "user id", id)
    if (!refreshToken) return
    const headers = {authorization: `Basic ${base64.encode(`${process.env.REDDIT_APP_ID}:${process.env.REDDIT_APP_SECRET}`)}`}
    await axios.post(`https://www.reddit.com/api/v1/revoke_token`, querystring.stringify({
      token: refreshToken,
      token_type_hint: "refresh_token"
    }), {headers})
    await SQLQuery.updateColumn("oauth2", "reddit token", null, "user id", id)
    await SQLQuery.updateColumn("oauth2", "reddit refresh", null, "user id", id)
  }

  public static refreshRedditToken = async (id: string) => {
    const headers = {authorization: `Basic ${base64.encode(`${process.env.REDDIT_APP_ID}:${process.env.REDDIT_APP_SECRET}`)}`}
    const refreshToken = await SQLQuery.fetchColumn("oauth2", "reddit refresh", "user id", id)
    if (!refreshToken) return Promise.reject("No refresh token")
    const data = await axios.post(`https://www.reddit.com/api/v1/access_token`, querystring.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    }), {headers}).then((r) => r.data)
    const redditToken = data.access_token
    await SQLQuery.updateColumn("oauth2", "reddit token", redditToken, "user id", id)
    return redditToken
  }

  public static redditOuath = async (code: string) => {
    try {
    const headers = {authorization: `Basic ${base64.encode(`${process.env.REDDIT_APP_ID}:${process.env.REDDIT_APP_SECRET}`)}`}
    const data = await axios.post(`https://www.reddit.com/api/v1/access_token`, querystring.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redditRedirect
    }), {headers}).then((r) => r.data)
    const redditToken = data.access_token
    const refreshToken = data.refresh_token
    const me = await axios.get(`https://oauth.reddit.com/api/v1/me`, {headers: {authorization: `bearer ${redditToken}`}}).then((r) => r.data)
    const name = me.name
    const connections = await SQLQuery.selectColumn("oauth2", "connections")
    let index = -1
    reddit:
    for (let i = 0; i < connections.length; i++) {
      for (let j = 0; j < connections[i].length; j++) {
        const curr = JSON.parse(connections[i][j])
        if (curr.type === "reddit" && curr.name === name) {
          index = i
          break reddit
        }
      }
    }
    if (index === -1) return Promise.reject("Reddit name not found")
    const discordID = await SQLQuery.fetchColumn("oauth2", "user id", "connections", connections[index])
    await SQLQuery.updateColumn("oauth2", "reddit token", redditToken, "user id", discordID)
    await SQLQuery.updateColumn("oauth2", "reddit refresh", refreshToken, "user id", discordID)
    await SQLQuery.updateColumn("oauth2", "reddit name", name, "user id", discordID)
    } catch {
      return Promise.reject("Error")
    }
  }

  /** Update usage statistics */
  public usageStatistics = async (cmdPath: string) => {
    const command = await this.fetchColumn("commands", "command", "path", cmdPath)
    const cmdUsage = await this.fetchColumn("commands", "usage", "command", command)
    const newUsage = Number(cmdUsage) ? Number(cmdUsage) + 1 : 1
    await this.updateColumn("commands", "usage", newUsage, "command", command)
    if (this.message.guild) {
      let guildUsage = await this.fetchColumn("guilds", "usage")
      if (!guildUsage) {
        guildUsage = {}
      } else {
        guildUsage = JSON.parse(guildUsage)
      }
      if (guildUsage[command]) {
        guildUsage[command] = Number(guildUsage[command]) + 1
      } else {
        guildUsage[command] = 1
      }
      guildUsage.total = Functions.sumObjectValues(guildUsage, "total")
      await this.updateColumn("guilds", "usage", guildUsage)
    }
    let userUsage = await this.fetchColumn("misc", "usage", "user id", this.message.author.id)
    await SQLQuery.updateColumn("misc", "username", this.message.author.tag, "user id", this.message.author.id)
    if (!userUsage) {
      try {
        await SQLQuery.insertInto("misc", "user id", this.message.author.id)
      } catch {
        // Do nothing
      }
      userUsage = {}
    } else {
      userUsage = JSON.parse(userUsage)
    }
    if (userUsage[command]) {
      userUsage[command] = Number(userUsage[command]) + 1
    } else {
      userUsage[command] = 1
    }
    userUsage.total = Functions.sumObjectValues(userUsage, "total")
    await this.updateColumn("misc", "usage", userUsage, "user id", this.message.author.id)
  }

  /** Retrieve all command info */
  public static allCommands = async (category?: string) => {
    const commands = await SQLQuery.selectColumn("commands", "command")
    const commandArray = [] as any
    for (let i = 0; i < commands.length; i++) {
      const commandObj = {} as any
      const command = commands[i]
      commandObj.command = command
      const aliases = await SQLQuery.fetchColumn("commands", "aliases", "command", commands)
      const path = await SQLQuery.fetchColumn("commands", "path", "command", command)
      const category = path.match(/(?<=commands\/)(.*?)(?=\/)/)?.[0] ?? "unknown"
      const cooldown = await SQLQuery.fetchColumn("commands", "cooldown", "command", command)
      const help = await SQLQuery.fetchColumn("commands", "help", "command", command)
      const examples = await SQLQuery.fetchColumn("commands", "examples", "command", command)
      commandObj.aliases = aliases ?? "none"
      commandObj.category = category
      commandObj.cooldown = cooldown
      commandObj.help = Functions.multiTrim(help).replace(/`/g, "")
      commandObj.examples = Functions.multiTrim(examples).replace(/`/g, "")
      commandArray.push(commandObj)
      console.log(JSON.stringify(commandObj, null, 4))
    }
    if (category) {
      return commandArray.filter((a: any) => {
        if (a.category.toLowerCase() === category.toLowerCase()) {
          return true
        } else {
          return false
        }
      })
    }
    return commandArray
  }

  /** Cleanup old records */
  public static cleanup = async () => {
    const query: QueryConfig = {
      text: `DELETE FROM collectors WHERE timestamp < NOW() - INTERVAL '7 days'`
    }
    await SQLQuery.run(query, true)
  }

  public static backupDB = async () => {
    if (process.env.DATABASE_BACKUPS !== "yes") return
    const folder = path.join(__dirname, "./dump")
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, {recursive: true})
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `Kisaragi-${timestamp}.dump`
    const backupPath = path.join(folder, filename)

    let connection = {
        username: process.env.PG_USER!,
        host: process.env.PG_HOST!,
        database: process.env.PG_DATABASE!,
        password: process.env.PG_PASSWORD!,
        port: Number(process.env.PG_PORT)
    }
    await pgDump(connection, {
        filePath: backupPath,
        noOwner: true
    })

    const backupData = fs.readFileSync(backupPath)

    const r2 = new S3({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
      }
    })
    let bucket = process.env.BACKUP_BUCKET!
    await r2.putObject({Bucket: bucket, Key: filename, Body: backupData,
    Expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)})

    fs.unlinkSync(backupPath)
  }
}
