import dns from "dns";

dns.setServers(["8.8.8.8"]);
import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config();
const dbcon = process.env.MONGO_URI
mongoose.connect(dbcon)

const expenses = mongoose.Schema({
    tripCode: String,
    transactions: [{
        paidby: String,
        amount: Number,
        paidfor: String
    }]
}, {
    timestamps: true
})

const expensemodel = mongoose.model("expensemodel", expenses)

export default expensemodel