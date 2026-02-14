import jwt from "jsonwebtoken"
export const checktoken = (req,res,next)=>{
    const token = req.cookies.logintoken
    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
        if(decoded){
            const email = decoded.data
            req.email = email
            next()
        }
        else{
            res.json({success:false,redirect:'/login'})
        }
});
}