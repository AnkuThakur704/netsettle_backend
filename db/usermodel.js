import mongoose from "mongoose";

import dotenv from 'dotenv'
dotenv.config();
const dbcon  = process.env.MONGO_URI

mongoose.connect("mongodb://localhost:27017/NetSettle")

const userschema = mongoose.Schema({
    name:String,
    email:String,
    upi:String,
    password:String,
    goolesub:String,
    trips:[{trcode:String,freezed:Boolean}]
})

const usermodel = mongoose.model('Users',userschema)

export default usermodel