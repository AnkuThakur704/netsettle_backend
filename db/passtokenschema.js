import mongoose from 'mongoose'

import dotenv from 'dotenv'
dotenv.config();
const dbcon  = process.env.MONGO_URI
mongoose.connect("mongodb://localhost:27017/NetSettle")

const Schema = mongoose.Schema({
    email: String,
    hashtoken:String,
    expiresAt:{
        type:Date,
        index:{expiresAtSecond:5*60*1000}
    }
    
},{timestamps:true})

const passtokenmodel = mongoose.model("passtokens",Schema)
export default passtokenmodel