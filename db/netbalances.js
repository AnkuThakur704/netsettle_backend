import mongoose from "mongoose"

import dotenv from 'dotenv'
dotenv.config();
const dbcon  = process.env.MONGO_URI
mongoose.connect(dbcon)

const netBalances = mongoose.Schema({
    uid:String,
    balances:[
        {tripCode:String,
            amt:Number
        }
    ]
})

const balancemodel =  mongoose.model("netbalances",netBalances)
export default balancemodel