/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import "dotenv/config"
import {ShardingManager} from "discord.js"
import config from "./config.json"
import path from "path"

const token = process.env.TESTING === "yes" ? process.env.TEST_TOKEN : process.env.TOKEN
const manager = new ShardingManager(path.join(__dirname, "index.js"), {token})
manager.spawn({amount: "auto", delay: 15000, timeout: 10000000})
manager.on("shardCreate", (shard) => console.log(`Launching Shard ${shard.id}`))