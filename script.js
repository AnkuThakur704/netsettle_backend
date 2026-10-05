import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import express from "express"
import cors from "cors"
import dotenv from 'dotenv'
import cookieParser from "cookie-parser"
import authrouter from "./auth/authrouter.js";
import router from "./routes/routes.js";


// console.log("DNS:", dns.getServers());
dotenv.config({ path: './.env' })

const app = express()
app.use(cors({
    origin:['http://localhost:5173',"https://netsettle-frontend.vercel.app", "https://netsettle-frontend-gmafapt91-ankuthakur704s-projects.vercel.app"],
    credentials:true
}))

app.options('/*splat', cors());
// app.options('/*splat', cors())
app.set("trust proxy", 1);
app.use(cookieParser())
app.use(express.json())

app.use('/auth', authrouter)
app.use('/routes', router)


app.get('/', (req, res) => {
    res.send("SERVER LIVE")
})



const port = process.env.PORT || 8080
app.listen(port, () => {
    console.log(`Server live: http://localhost:${port}`)
})
