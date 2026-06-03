import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config();
const dbcon  = process.env.MONGO_URI
mongoose.connect(dbcon)

const expenses = mongoose.Schema({
    tripCode:String,
    paidby:String,
    amount:Number,
    paidfor:String
},{
    timestamps:true
})

const expensemodel =  mongoose.model("expensemodel",expenses)

export default expensemodel