import mongoose from "mongoose"


import dotenv from 'dotenv'
dotenv.config();
const dbcon  = process.env.MONGO_URI
mongoose.connect(dbcon)

const tripSchema = mongoose.Schema({
    tripName:String,
    tripCode:String,
    freezed:Boolean,
    members:[
        {
            uid:String,
            name:String
        }
    ]
})

const tripmodel =mongoose.model("trips",tripSchema)
export default  tripmodel