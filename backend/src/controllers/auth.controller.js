import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateTokens = (userId) => {
    const accessToken = jwt.sign({userId}, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn:"15m",
    });

    const refreshToken = jwt.sign({userId},process.env.REFRESH_TOKEN_SECRET, {
        expiresIn:"7d"
    });

    return {accessToken, refreshToken};
}

//store refresh token in redis
const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refresh_token: ${userId}`, refreshToken, "EX", 7*24*60*60);
}

const setCookies = (res, accessToken,refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true, //prevents xss attacks, cross-site scripting attacks
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", //prevents CSRF attacks, cross-site request request forgery
        maxAge: 15*60*1000 //15mins
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true, //prevents xss attacks, cross-site scripting attacks
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", //prevents CSRF attacks, cross-site request request forgery
        maxAge: 7*24*60*60*1000  //7 days
    })
}

export const signUP = async(req, res) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    try {
        const { name, email, password } = req.body;

       //check if email is valid
    //    if(!emailRegex.test(email?.trim())){
    //     return res.status(400).json({message: "Invalid email format"});
    //    }

        //check if email already exists
        const isEmailExist = await User.findOne({email: email?.toLowerCase().trim()});
        if(isEmailExist){
            return res.status(400).json({message: "A user with the email already exists!"});
        }

        const user = await User.create({name, email, password});

        // authenticate
        const {accessToken, refreshToken} = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);

        res.status(201).json({user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,

        }, message: "User created successfully."});


    } catch (error) {
        console.log("Error in sign-up controller", error);
        res.status(500).json({message: error.message});
    }
}

export const signIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        if(!email  || !password){
            return res.status(400).json({message: "Email and password are required!"});
        }
        const user = await User.findOne({ email });
        if(!user){
            return res.status(400).json({message: "Invalid credentials!"});
        }

        const isMatch = await user.comparePassword(password);
        if(!isMatch){
            return res.status(400).json({message: "Invalid credentials!"});
        }

        
        const {accessToken, refreshToken} = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);
        

        return res.status(200).json({user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,

        }, message: "login successfull"});

    } catch (error) {
        console.log("Error in sign in controller",  error.message);
        return res.status(500).json({message: error.message});
    }
}


export const logOut = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if(refreshToken){
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            await redis.del(`refresh_token: ${decoded.userId}`);
        }

        res.clearCookie("refreshToken");
        res.clearCookie("accessToken");
        return res.status(200).json({message: "Logged out successfully."});
    } catch (error) {
        console.log("Error in logout controller", error.message);
        return res.status(500).json({message: "server error", error: error.message});
    }
}

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken){
            return res.status(401).json({message: "No refresh token provided"});
        }

        // verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // check redis
        const storedToken = await redis.get(`refresh_token: ${decoded.userId}`);

        if(storedToken !== refreshToken){
            return res.status(401).json({message: "Invalid refresh token"});
        }

        // generate new access token
        const accessToken = jwt.sign({userId: decoded.userId}, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "15m"
        });

        // set cookie
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15*60*1000,//15min
        });


        return res.status(200).json({message: "Token refreshed successfully"});


    } catch (error) {
         console.log("Error in refresh token controller", error.message);
        return res.status(500).json({message: "server error", error: error.message});
    }
}


export const getProfile = async(req, res)=>{
    try {
        return res.status(200).json(req.user);
    } catch (error) {
        console.error("Error in getProfile controller", error);
        return res.status(500).json({message: "Internal server error"});
    }
}