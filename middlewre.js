import jwt from "jsonwebtoken"
import usermodel from "./db/usermodel.js";
export const middlewre = async(req,res,next)=>{
     const token = req.cookies.logintoken
            jwt.verify(token, process.env.JWT_SECRET, async function(err, decoded) {
                if(decoded){
                    req.logcheck = true;
                    const user = await usermodel.findOne({email:decoded.data})
                    if(user){
                        req.body.name = user.name;
                        req.body.email = decoded.data
                        next();
                    }
                    else{
                        req.logcheck = false;
                        next();
                    }
                }
                else{
                    req.logcheck = false;
                    next();
                }
        });
}