import express from 'express'
import usermodel from '../db/usermodel.js'
import tripmodel from '../db/tripmodel.js'
import balancemodel from '../db/netbalances.js'
import expensemodel from '../db/expenseschema.js'
import { checktoken } from '../tokencheckmiddleware.js'
import { middlewre } from '../middlewre.js'
import settlemodel from '../db/settlement.js'
import crypto from "crypto"
import settlefunc from '../settletrip/settletrip.js'

const router = express.Router()

router.post('/dashboard', checktoken, async (req, res) => {
    const user = await usermodel.findOne({ email: req.email }).lean()
    if (user) {
        const usertrips = user.trips
        const trarr = []
        if (usertrips.length == 0) {
            res.status(200).json({ success: true, nm: user.name })

        }
        if (usertrips.length > 0) {
            for (let i of usertrips) {
                const tripdata = await tripmodel.findOne({ tripCode: i.trcode }).lean()
                trarr.push(tripdata)
            }
            const bal = await balancemodel.findOne({ uid: req.email })
            const totals = [];
            for (let j = 0; j < usertrips.length; j++) {
                let total = 0;
                const exp = await expensemodel.findOne({ tripCode: usertrips[j].trcode })
                if (exp!=null&&exp.transactions != null) {
                    for (let x of exp.transactions) {
                        let amt = Number(x.amount)
                        total += amt;
                    }
                }
                totals.push({ tripCode: usertrips[j].trcode, total: total })

            }
            res.status(200).json({ success: true, nm: user.name, trips: trarr, totals: totals, bal: bal.balances, email: req.email })

        }
    }
    else {
        res.status(404).json({ success: false, redirect: '/login' })
    }
})


router.post('/userdata', middlewre, (req, res) => {
    if (!req.logcheck) {
        res.status(401).json({ success: false, redirect: '/login' })
    }
    else {
        res.status(200).json({ success: true, name: req.body.name, email: req.body.email, redirect: '/dashboard' })
    }
})

router.post('/addtrip', middlewre, async (req, res) => {

    if (!req.logcheck) {
        res.status(200).json({ success: false, redirect: '/login' })
    }
    else {
        const trcode = crypto.randomBytes(4).toString('hex')
        const o = {
            tripName: req.body.tripName,
            tripCode: trcode,
            freezed: false,
            members: [{
                uid: req.body.email,
                name: req.body.name
            }]
        }
        const data = await tripmodel.insertOne(o)
        const expense = await expensemodel.insertOne({tripCode: trcode, transactions:[]})
        const data2 = await usermodel.updateOne({ email: req.body.email }, {
            $push: {
                trips: {
                    trcode: trcode, freezed: false
                }
            }
        })
        const bal = await balancemodel.updateOne({ uid: req.body.email }, { $push: { balances: { tripCode: trcode, amt: 0 } } })
        if (data && data2 && bal &&expense) {
            res.status(200).json({ success: true, name: req.body.name, email: req.body.email, redirect: '/dashboard' })
        }
        else {
            res.status(500).json({ success: false , message: "could not add trip"})
        }
    }
})

router.post("/jointrip", middlewre, async (req, res) => {
    if (!req.logcheck) {
        res.status(401).json({ message: "Unauthorized" })
        return
    }
    const trip = await tripmodel.findOne({ tripCode: req.body.tripCode })
    if (!trip) {
        res.json({ success: false })
    }
    else {
        for (let i of trip.members) {
            if (i.uid === req.body.email) {
                res.json({ success: true, alreadyJoined: true })
                return;
            }
        }
        const addmember = await tripmodel.updateOne({ tripCode: req.body.tripCode }, { $push: { members: { uid: req.body.email, name: req.body.name } } })
        const addtrip = await usermodel.updateOne({ email: req.body.email }, { $push: { trips: { trcode: req.body.tripCode, freezed: false } } })
        const bal = await balancemodel.updateOne({ uid: req.body.email }, { $push: { balances: { tripCode: req.body.tripCode, amt: 0 } } })
        if (addmember && addtrip && bal) {
            res.json({ success: true, redirect: '/dashboard', alreadyJoined: false })
        }
        else {
            res.json({ success: false })
        }
    }
})

router.post('/edittrip/:tripcode', middlewre, async (req, res) => {
    if (req.logcheck) {
        const trip = await tripmodel.findOne({ tripCode: req.params.tripcode })
        const expenses = await expensemodel.findOne({ tripCode: req.params.tripcode })
        const s = await settlemodel.findOne({ tripCode: req.params.tripcode }).lean()
        let stl = []
        if (s) {
            for (let c of s.s) {
                const p = await usermodel.findOne({ email: c.p }, { name: 1 })
                const r = await usermodel.findOne({ email: c.r }, { name: 1 })
                stl.push({ p: p.name, r: r.name, amt: c.amt })
            }
        }
        if (trip) {
            let balances = []
            for (let i of trip.members) {
                let uid = i.uid
                const bal = await balancemodel.findOne({ uid: uid, "balances.tripCode": req.params.tripcode })
                for (let j of bal.balances) {
                    if (j.tripCode === req.params.tripcode) {
                        balances.push({ uid: uid, bal: j.amt })
                    }
                }
            }
            res.json({ logcheck: true, tripname: trip.tripName, tripcode: trip.tripCode, members: trip.members, expenses: expenses, balances: balances, freezed: trip.freezed, s: s ? stl : [] })
        }
        else {
            res.status(404).json({ message: "Invalid trip code" })
        }
    }
    else {
        res.status(401).json({ logcheck: false })
    }
})

router.post("/addexpense", async (req, res) => {
    const adddata = await expensemodel.updateOne({tripCode: req.body.tripCode}, {$push:{transactions: {paidby: req.body.paidby, amount: req.body.amount, paidfor: req.body.paidfor}}})
    let n = req.body.n
    const amount = Number(req.body.amount);
    const addpayer = await balancemodel.updateOne({ uid: req.body.paidbyuid, "balances.tripCode": req.body.tripCode }, { $inc: { "balances.$.amt": (amount / n) * (n - 1) } })
    for (let i of req.body.members) {
        if (i.uid != req.body.paidbyuid) {
            await balancemodel.updateOne({ uid: i.uid, "balances.tripCode": req.body.tripCode }, { $inc: { "balances.$.amt": -1 * (amount / n) } })
        }
    }
    if (adddata && addpayer) {
        res.json({ success: true })
    }
    else {
        res.json({ success: false })
    }
})

router.post("/settletrip", async (req, res) => {
    const result = await settlefunc(req, res)
    console.log("this is result: ", result)
    res.json(result)
})

router.delete("/deltrip", async (req, res) => {
    try {
        await usermodel.updateOne({ email: req.body.email }, { $pull: { trips: { trcode: req.body.tripCode } } })
        res.status(200).json({ success: true })
    } catch (error) {
        res.status(500).json({message:"Unable to delete the trip for you."})
    }
})

router.post('/settleup', middlewre, async (req, res) => {
    if (req.logcheck) {
        const s = await settlemodel.find({ "s.p": req.body.email }).lean()
        let stlmnts = []
        let total = 0
        for (let i of s) {
            for (let j of i.s) {
                if (j.p === req.body.email && !j.paid) {
                    total += j.amt
                    const nm = await usermodel.findOne({ email: j.r }, { name: 1, upi: 1 })
                    const tr = await tripmodel.findOne({ tripCode: i.tripCode }, { tripName: 1 })
                    stlmnts.push({ tripCode: i.tripCode, remail: j.r, amt: j.amt, rname: nm.name, upi: nm.upi, tripName: tr.tripName })
                }
            }
        }
        res.status(200).json({ success: true, s: stlmnts, total: total })
    }
    else res.status(401).json({message:"you should be logged in to perform this action"})
})

router.post('/recieve', middlewre, async (req, res) => {
    if(!req.logcheck){
        res.status(401).json({message:"You should be logged in to perform this action."})
        return
    }
    const s = await settlemodel.find({ "s.r": req.body.email }).lean()
    let rec = []
    let rtotal = 0;
    for (let i of s) {
        for (let j of i.s) {
            if (j.r === req.body.email && !j.paid) {
                rtotal += j.amt
                const nm = await usermodel.findOne({ email: j.p }, { name: 1, upi: 1 })
                const tr = await tripmodel.findOne({ tripCode: i.tripCode }, { tripName: 1 })
                rec.push({ tripCode: i.tripCode, pemail: j.p, amt: j.amt, pname: nm.name, upi: nm.upi, tripName: tr.tripName, remail: req.body.email })
            }
        }
    }
    res.status(200).json({ success: true, rs: rec, rtotal: rtotal })
})

router.post("/recieved", async (req, res) => {
    try {
        await settlemodel.updateOne({ tripCode: req.body.tripCode, "s.r": req.body.email, "s.p": req.body.payer, "s.paid": false }, { $set: { "s.$.paid": true } })
        res.status(200).json({ success: true })
    } catch (error) {
        res.status(500).json({message: error})
    }
})

export default router