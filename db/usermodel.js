import mongoose from "mongoose";

import dotenv from 'dotenv'
dotenv.config();
const dbcon  = process.env.MONGO_URI
mongoose.connect(dbcon)

const userschema = mongoose.Schema({
    name:String,
    email:String,
    upi:String,
    password:String,
    trips:[{trcode:String,freezed:Boolean}]
})

const usermodel = mongoose.model('Users',userschema)

export default usermodel