 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Collection, Message} from "discord.js"
import {Kisaragi} from "./Kisaragi"

const procBlock = new Collection()
const globalProcBlock = new Collection()

export class ProcBlock {
    public constructor(private readonly discord: Kisaragi, private readonly message: Message) {}
    public getID = () => {
        if (this.message.guild) {
            return this.message.guild.id
        } else {
            return this.message.author.id
        }
    }
    public getProcBlock = () => {
        if (procBlock.has(this.getID())) {
            return true
        } else {
            return false
        }
    }

    public setProcBlock = (remove?: boolean) => {
        if (remove) {
            procBlock.delete(this.getID())
        } else {
            procBlock.set(this.getID(), true)
        }
    }

    public getGlobalProcBlock = () => {
        if (globalProcBlock.has(this.discord.user!.id)) {
            return true
        } else {
            return false
        }
    }

    public setGlobalProcBlock = (remove?: boolean) => {
        if (remove) {
            globalProcBlock.delete(this.discord.user!.id)
        } else {
            globalProcBlock.set(this.discord.user!.id, true)
        }
    }
}
