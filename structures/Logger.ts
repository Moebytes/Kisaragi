import chalk from "chalk"
import moment from "moment"

export class Logger {
    public static returnLog = (content: string, type: string, color: string): void => {
      const timestamp = `${moment().format("MM DD YYYY hh:mm:ss")} ->`
      const logString = `${timestamp} ${type} ${content}`
      return console.log(chalk[color](logString))
   }

    public static getLogColor = (logType: string): string => {
        switch (logType) {
          case "log": return "magentaBright"
          case "warn": return "yellowBright"
          case "error": return "redBright"
          case "debug": return "greenBright"
          case "cmd": return "blueBright"
          case "ready": return "cyanBright"
          default: return "magentaBright"
        }
      }

    public static switchType = (type: string, content: string) => {
          Logger.returnLog(content, type, Logger.getLogColor(type))
      }

    public static log = (content: string) => {
        return Logger.switchType("log", content)
      }

    public static error = (content: string) => {
        return Logger.switchType("error", content)
      }

    public static warn = (content: string) => {
        return Logger.switchType("warn", content)
      }

    public static debug = (content: string) => {
        return Logger.switchType("debug", content)
      }

    public static cmd = (content: string) => {
        return Logger.switchType("cmd", content)
      }

}
