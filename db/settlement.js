import mongoose from "mongoose"

import dotenv from 'dotenv'
dotenv.config();
const dbcon  = process.env.MONGO_URI
mongoose.connect(dbcon)

const settleschema = mongoose.Schema({
    tripCode:String,
    s:[{
        p:String,
        r:String,
        amt:Number,
        paid:Boolean
    }]
})

const settlemodel = mongoose.model("settlements",settleschema)

export default settlemodel