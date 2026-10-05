import express from "express"
import usermodel from "../db/usermodel.js"
import bcrypt from 'bcrypt'
import balancemodel from "../db/netbalances.js"
import { OAuth2Client } from 'google-auth-library';
import genjwttoken from "./jwt.js"
import dotenv from 'dotenv'
dotenv.config()

const authrouter = express.Router()

authrouter.post('/signup', async (req, res) => {
    const userexists = await usermodel.exists({ email: req.body.email })
    if (userexists != null) {
        res.json({ success: true, exits: true })
    }
    else {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) return res.status(500).json({ success: false, message: "Unable to generate a salt." })
            bcrypt.hash(req.body.password, salt, async function (err, hash) {
                const data = {
                    name: req.body.name,
                    email: req.body.email,
                    upi: req.body.upi,
                    password: hash,
                    trips: []
                }
                const insert = await usermodel.insertOne(data)
                const bal = await balancemodel.insertOne({ uid: req.body.email, balances: [] })
                if (insert && bal) {
                    res.status(200).json({ success: true, redirect: '/login' })
                }
                else {
                    res.status(500).json({ success: false })
                }
            });
        });
    }
})

authrouter.post('/login', async (req, res) => {
    const userdata = await usermodel.findOne({ email: req.body.email }, { name: 1, email: 1, password: 1 })
    if (!userdata) {
        res.status(401).json({ success: false, wrong: true })
    }
    else {
        const hash = userdata.password
        bcrypt.compare(req.body.password, hash, function (err, result) {
            if (err) return res.status(500).json({ success: false })
            if (result) {
                const gentoken = genjwttoken(userdata.email, res)
                if (gentoken) res.status(200).json({ success: true, redirect: '/dashboard', name: userdata.name })
                else res.status(500).json({ success: false })
            }
            else {
                res.status(401).json({ success: false, wrong: true })
            }
        });
    }
})


authrouter.post('/googlelogin', async (req, res) => {
    const client = new OAuth2Client()
    const ticket = await client.verifyIdToken({
        idToken: req.body.credential,
        audience: process.env.CLIENT_ID
    })
    const userexits = await usermodel.exists({ email: ticket.payload.email })
    if (userexits) {
        const gentoken = genjwttoken(ticket.payload.email, res)
        if (gentoken) res.status(200).json({ success: true, exists: true, redirect: '/dashboard', name: ticket.payload.name })
        else res.status(500).json({ success: false })
    }
    else {
        await usermodel.insertOne({
            name: ticket.payload.name,
            email: ticket.payload.email,
            upi: null,
            password: null,
            goolesub: ticket.payload.sub,
            trips: []
        })
        const gentoken  = genjwttoken(ticket.payload.email, req)
        if(gentoken) res.json({ success: true, redirect: '/dashboard', name: ticket.payload.name })
        else res.status(500).json({ success: false })
    }
})

authrouter.post('/logout', (req, res) => {
    res.clearCookie("logintoken", {
        path: '/', httpOnly: true, secure: true,
        sameSite: "none"
    })
    res.status(200).json({ success: true })
})

export default authrouter