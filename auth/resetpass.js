import usermodel from "./db/usermodel.js"
import bcrypt from "bcrypt"
import crypto from "crypto"
import nodemailer from 'nodemailer'
import passtokenmodel from "./db/passtokenschema.js"

app.post("/sendtoken", async (req, res) => {
    const verifyemail = await usermodel.findOne({ email: req.body.email })
    if (verifyemail != null) {

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.GOOGLE_APP_PASSWORD,
            },
        });
        const restoken = crypto.randomBytes(32).toString("hex")
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(restoken, salt, async function (err, hash) {
                if (err) {
                    console.log(err)
                }
                else {
                    const pt = await passtokenmodel.insertOne({
                        email: req.body.email,
                        hashtoken: hash,
                        expiresAt: Date.now() + 60 * 60 * 1000
                    })
                }
            });
        });
        console.log("before sending")
        try {
            const info = await transporter.sendMail({
                from: "ankuhakur277@gmail.com",
                to: req.body.email,
                subject: "Reset Password",
                text: `Reset your password by clicking on the following link: http://localhost:5173/setpass?email=${req.body.email}&token=${restoken}`,
            })
            console.log("email success")
            console.log("email sent: ", info.messageId)
        } catch (error) {
            console.log("error email: ", error)
            // res.json({success:false})
        }
        console.log("after sending email")
        // res.json({success:true})


    }
    res.json({ success: true })

})

app.post("/verifypasstoken", async (req, res) => {
    const hash = await passtokenmodel.findOne({ email: req.body.email }, { hashtoken: 1 })
    console.log("hashtoken: ", hash)
    // decrypt
    bcrypt.compare(req.body.token, hash.hashtoken, function (err, result) {
        console.log("result: ", result)
        console.log("error:", err)
        res.json({ success: true, valid: true })
    });
})

app.post("/updatepass", async (req, res) => {
    console.log(req.body)
    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(req.body.newpass, salt, async function (err, hash) {
            const x = await usermodel.updateOne({ email: req.body.email }, { $set: { password: hash } })
            if (x.modifiedCount == 1) {
                console.log("before redirect")
                return res.json({ success: true, redirect: '/login' })
            }
        });
    });

    res.status(422)
})