const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth")
const jwt = require("jsonwebtoken")
const config = require("config")
const bcrypt = require("bcryptjs")
const { check, validationResult} = require("express-validator/check")

const User = require("../../models/User")

//log in
//POST     api/auth
//@desc    auth user and get token
//@access  Public
router.post("/", [
    check("email", "Please include valid email").isEmail(),
    check("password", "Password is required").exists()
], async (req,res)=> {
    const errors = validationResult(req)
    //check for errors
    if (!errors.isEmpty()) {
        //if there are errors
        return res.status(400).json({ errors: errors.array()})
    }

    const {email, password} = req.body
    
    try{
    //see if user exists
    let user = await User.findOne({ email });
    if (!user) {
        //send error if already exists
        return res.status(400).json({errors: [ { msg: "Invalid Credentials" } ] })
    }

    //return jsonwebtoken
    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        return res.status(400).json({errors: [ { msg: "Invalid Credentials" } ] })
    }

    const payload = {
        user: {
            id: user.id
        }
    }

    jwt.sign(
        payload, 
        config.get("jwtSecret"),
        { expiresIn: 360000 },
        (err, token) => {
            if (err) throw err;
            res.json({ token })
        }
        )
  
    } catch(err) {
        console.error(err.message);
        res.status(500).send("Server error")
    }


   

})

//GET     api/auth
//@desc   
//@access Public
router.get("/", auth, async (req,res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user)
    }catch(err) {
        console.error(err.message);
        res.status(500).send("server error")
    }
})

module.exports = router