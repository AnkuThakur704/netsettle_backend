import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

const genjwttoken = async (email, res) => {
    try {
        const token = jwt.sign({ data: email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.cookie("logintoken", token, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 24*60 * 60 * 1000
        })
        return true;
    } catch (error) {
        return false
    }
}

export default genjwttoken