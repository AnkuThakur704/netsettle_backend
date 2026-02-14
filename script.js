import express from "express"
import cors from "cors"
import usermodel from "./db/usermodel.js"
import bcrypt from "bcrypt"
import dotenv from 'dotenv'
import jwt from "jsonwebtoken"
import cookieParser from "cookie-parser"
import { checktoken } from "./tokencheckmiddleware.js"
import { middlewre } from "./middlewre.js"
import tripmodel from "./db/tripmodel.js"
import crypto from "crypto"
import expensemodel from "./db/expenseschema.js"
import balancemodel from "./db/netbalances.js"
import settlemodel from "./db/settlement.js"
dotenv.config({ path: './.env' })

const app = express()
app.set("trust proxy", 1);
app.use(cors({
    origin:['http://localhost:5173',"https://netsettle-frontend.vercel.app"],
    credentials:true
}))
app.use(cookieParser())
app.use(express.json())
app.post('/signup',async(req,res)=>{
    const eml = await usermodel.findOne({email:req.body.email})
    if(eml){
        res.json({success:true,exits:true})
        
    }
    else{
        bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(req.body.password, salt,async function(err, hash) {
        const data ={
            name:req.body.name,
            email:req.body.email,
            upi:req.body.upi,
            password:hash,
            trips:[]
        }
        const insert  = await usermodel.insertOne(data)
        const bal =  await balancemodel.insertOne({uid:req.body.email,balances:[]})
        if(insert&&bal){
            console.log("data inserted")
            res.json({success:true,redirect:"/login"})
        }
        else{
            console.log("instertion failed")
            res.json({success:false})
        }
    });
});
    }
    
    
})

app.post('/login',async(req,res)=>{
    const eml = await  usermodel.findOne({email:req.body.email}).lean()
    if(!eml){
        res.json({success:false,wrong:true})    }
    else{
        const hash= eml.password
        bcrypt.compare(req.body.password, hash, function(err, result) {
    if(result){
        const token = jwt.sign({data: eml.email}, process.env.JWT_SECRET,{expiresIn:'1h'});
        res.cookie("logintoken",token,{
            path:'/',
            httpOnly:true,
            secure:true,
            sameSite:"none",
            maxAge:60*60*1000
        })
        res.json({success:true,redirect:'/dashboard',name:eml.name})
    }
    else{
        res.json({success:false,wrong:true})
    }
});
    }
})

app.post('/dashboard',checktoken,async(req,res)=>{
    const user = await usermodel.findOne({email:req.email}).lean()
    if(user){
        const usertrips = user.trips
        const trarr = []
        if(usertrips.length==0){
            res.json({success:true,nm:user.name,redirect:'/dashboard'})
        
        }
        if(usertrips.length>0){
             for(let i of usertrips){
            const tripdata = await tripmodel.findOne({tripCode:i.trcode}).lean()
            trarr.push(tripdata)
        }
        const bal = await balancemodel.findOne({uid:req.email})
        const totals = [];
        for(let j =0;j<usertrips.length;j++){
            let total = 0;
            const exp =  await expensemodel.find({tripCode:usertrips[j].trcode})
            for(let x of exp){
                let amt = Number(x.amount)
                total+= amt;
            }
            totals.push({tripCode:usertrips[j].trcode,total:total})

        }
         res.json({success:true,nm:user.name,redirect:'/dashboard',trips:trarr,totals:totals,bal:bal.balances,email:req.email})
        
        }
    }
    else{
        res.json({success:false})
    }

    
})

app.post('/home',(req,res)=>{
    const token = req.cookies.logintoken
        jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
            if(decoded){
                res.json({success:true,redirect:'/dashboard'})
            }
            else{
                res.json({success:false})
            }
    });
})

app.post('/newtrip',middlewre,async(req,res)=>{
     if(!req.logcheck){
        res.json({success:false,redirect:'/login'})
     }
     else{
        res.json({success:true,name:req.body.name,email:req.body.email})
     }
})

app.post('/addtrip',async(req,res)=>{
    const trcode =  crypto.randomBytes(4).toString('hex')
    const o = {
        tripName:req.body.tripName,
        tripCode:trcode,
        freezed: false,
        members:[{uid:req.body.email,
            name:req.body.member
        }]
    }
    const data = await tripmodel.insertOne(o)
    const data2 =  await usermodel.updateOne({email:req.body.email},{$push:{trips:{trcode:trcode,freezed:false
    }}})
    const bal = await balancemodel.updateOne({uid:req.body.email},{$push:{balances:{tripCode:trcode,amt:0}}})
    if(data&&data2&&bal){
        res.json({success:true,redirect:'/dashboard'})
    }
    else{
        console.log("could not add trip")
        res.json({success:false})
    }
})

app.post('/logout',(req,res)=>{
    res.clearCookie("logintoken",{path:'/',httpOnly:true,secure:true,
            sameSite:"none"})
    res.json({success:true})
})

app.post("/jointrip",async(req,res)=>{
    const trip = await tripmodel.findOne({tripCode:req.body.tripCode})
    if(!trip){
        res.json({success:false})
    }
    else{
        for(let i of trip.members){
            if(i.uid===req.body.email){
                res.json({success:true,alreadyJoined:true})
                return;
            }
        }
        const addmember =  await tripmodel.updateOne({tripCode:req.body.tripCode},{$push:{members:{uid:req.body.email,name:req.body.name}}})
                const addtrip = await usermodel.updateOne({email:req.body.email},{$push:{trips:{trcode:req.body.tripCode,freezed:false}}})
                   const bal = await balancemodel.updateOne({uid:req.body.email},{$push:{balances:{tripCode:req.body.tripCode,amt:0}}})
                if(addmember&&addtrip&&bal){
                    res.json({success:true,redirect:'/dashboard',alreadyJoined:false})
                }
                else{
                    res.json({success:false})
                }
    }
})

app.post('/edittrip/:tripcode',middlewre,async(req,res)=>{
    if(req.logcheck){
        const trip  = await tripmodel.findOne({tripCode:req.params.tripcode})
        const expenses = await expensemodel.find({tripCode:req.params.tripcode})
        const s = await settlemodel.findOne({tripCode:req.params.tripcode}).lean()
        let stl = []
        if(s){
            for(let c of s.s){
            const p = await usermodel.findOne({email:c.p})
            const r = await usermodel.findOne({email:c.r})
            stl.push({p:p.name,r:r.name,amt:c.amt})
        }
        }
    if(trip&&expenses){
        let balances = []
        for(let i of trip.members){
            let uid =  i.uid
            const bal =  await balancemodel.findOne({uid:uid,"balances.tripCode":req.params.tripcode})
            for(let j of bal.balances){
                if(j.tripCode===req.params.tripcode){
                    balances.push({uid:uid,bal:j.amt})
                }
            }
        }
         res.json({logcheck:true,tripname:trip.tripName,tripcode:trip.tripCode,members:trip.members,expenses:expenses,balances:balances,freezed:trip.freezed,s:s?stl:[]})
    }
    else{
        console.log("no trip found")
    }
    }
    else{
        res.json({logcheck:false})
    }
})

app.post("/addexpense",async(req,res)=>{
    const adddata = await expensemodel.insertOne({tripCode:req.body.tripCode,paidby:req.body.paidby,amount:req.body.amount,paidfor:req.body.paidfor})
    let n = req.body.n
    const amount = Number(req.body.amount);
    const addpayer = await balancemodel.updateOne({uid:req.body.paidbyuid,"balances.tripCode":req.body.tripCode},{$inc:{"balances.$.amt":(amount/n)*(n-1)}})
    for(let i of req.body.members){
        if(i.uid!=req.body.paidbyuid){
            const addothers = await balancemodel.updateOne({uid:i.uid,"balances.tripCode":req.body.tripCode},{$inc:{"balances.$.amt":-1*(amount/n)}})
        }
    }
    if(adddata&&addpayer){
        res.json({success:true})
    }
    else{
        console.log("failed")
        res.json({success:false})
    }
})

app.post("/settletrip",async(req,res)=>{
    let balances =  req.body.balances
    let s = []
    let flag =  true
    let count = 0;
    while(flag){
        let min = balances[0]
        let minI = 0;
        for(let i=0;i<balances.length;i++){
            if(balances[i].bal<min.bal){
                min =  balances[i]
                minI = i;
            }
        }
        let max = balances[0]
        let maxI = 0;
        for(let j=0;j<balances.length;j++){
            if(balances[j].bal>max.bal){
                max =  balances[j]
                maxI = j;
            }
        }
        let dega = Math.min(Math.abs(max.bal),Math.abs(min.bal))
        s.push({"p":min.uid,"r":max.uid,"amt":dega,paid:false})
        balances[minI].bal+=dega
        balances[maxI].bal-= dega
        let k = 0;
        flag = false;
        for(k of balances){
            if(k.bal<0||k.bal>=1) flag = true;
        }
        count++;
        if(count>=10) break
    }
    if(count>=10){
        res.json({success:false})
    }
    await settlemodel.insertOne({tripCode:req.body.tripCode,s:s})
    const members  =  req.body.members
    await tripmodel.updateOne({tripCode:req.body.tripCode},{$set:{freezed:true}})
    for(let u of members){
        await usermodel.updateOne({email:u.uid,"trips.trcode":req.body.tripCode},{$set:{"trips.$.freezed":true}})
    }
    res.json({
        success:true,
        stlmnt:s
    })
})

app.delete("/deltrip",async(req,res)=>{
    const del = await usermodel.updateOne({email:req.body.email},{$pull:{trips:{trcode:req.body.tripCode}}})
    res.json({success:true})
})

app.post('/settleup',middlewre,async(req,res)=>{
    if(req.logcheck){
        const s = await settlemodel.find({"s.p":req.body.email}).lean()
        let stlmnts = []
        let total = 0
                for(let i of s){
            for(let j of i.s){
                if(j.p===req.body.email&&!j.paid){
                    total+=j.amt
                    const nm = await usermodel.findOne({email: j.r},{name:1,upi:1})
                    const tr = await tripmodel.findOne({tripCode:i.tripCode},{tripName:1})
                    stlmnts.push({tripCode:i.tripCode,remail:j.r,amt:j.amt,rname:nm.name,upi:nm.upi,tripName:tr.tripName})
                }
            }
        }
        res.json({success:true,s:stlmnts,total:total})
    }
})

app.post('/recieve',middlewre,async(req,res)=>{
    const s = await settlemodel.find({"s.r":req.body.email}).lean()
    let rec =[]
    let rtotal =0;
    for(let i of s){
            for(let j of i.s){
                if(j.r===req.body.email&&!j.paid){
                    rtotal+=j.amt
                    const nm = await usermodel.findOne({email: j.p},{name:1,upi:1})
                    const tr = await tripmodel.findOne({tripCode:i.tripCode},{tripName:1})
                    rec.push({tripCode:i.tripCode,pemail:j.p,amt:j.amt,pname:nm.name,upi:nm.upi,tripName:tr.tripName,remail:req.body.email})
                }
            }
        }
    res.json({success:true,rs:rec,rtotal:rtotal})
})

app.post("/recieved",async(req,res)=>{
    const tr= await settlemodel.updateOne({tripCode:req.body.tripCode,"s.r":req.body.email,"s.p":req.body.payer,"s.paid":false},{$set:{"s.$.paid":true}})
    res.json({success:true})
})

app.listen(process.env.PORT||8080,()=>{
    console.log(`Server live`)
})
