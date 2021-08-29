const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth")
const request = require("request")
const config = require("config")
const { check, validationResult} = require("express-validator/check")

const Profile = require("../../models/Profile")
const User = require("../../models/User");
const { response } = require("express");

//GET     api/profile/me
//@desc   get current users profile
//@access Private
router.get("/me", auth, async (req,res)=> {
    try{
        const profile = await Profile.findOne({ user: req.user.id }).populate("user", 
        ["name", "avatar"]);

        if(!profile){
            return res.status(400).json({msg: "There is no profile for this user"})
        }
        res.json(profile)
    } catch(err){
        console.error(err.message);
        res.status(500).send("Server Error")
    }
})

//create or update profile for user
//POST api/profile
//Private

router.post("/", [ auth, [
    check("status", "Status is required").not().isEmpty(),
    check("Skills", "Skills is required").not().isEmpty()
]], async (req,res)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array() })
    }
    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body

    //build profile object to insert into db
    const profileFields = {}
    profileFields.user = req.user.id;
    if(company) profileFields.company = company;
    if(website) profileFields.website = website;
    if(location) profileFields.location = location;
    if(bio) profileFields.bio = bio;
    if(status) profileFields.status = status;
    if(githubusername) profileFields.githubusername = githubusername;
    if(skills){
        //will turn into an array
        profileFields.skills = skills.split(",").map(skill => skill.trim());
    }
    //build social object
    profileFields.social = {}
    if(youtube) profileFields.social.youtube = youtube;
    if(twitter) profileFields.social.twitter = twitter;
    if(facebook) profileFields.social.facebook = facebook;
    if(linkedin) profileFields.social.linkedin = linkedin;
    if(instagram) profileFields.social.instagram = instagram;
    
    try{
        let profile = await Profile.findOne({user: req.user.id})

        if(profile) {
            //update profile if exists
            profile = await Profile.findOneAndUpdate(
                {user: req.user.id}, 
                { $set: profileFields}, 
                {new:true});
            return res.json(profile)
        }

        //create profile if didnt exist
        profile = newProfile(profileFields);

        await profile.save();
        res.json(profile)
    }catch(err){
        console.error(err.message);
        res.status(500).send("Server Error")
    }
})

// GET api/profile
// get all profiles
// public

router.get("/",async (req,res)=>{
    try {
        const profile =  await Profile.find().populate("user", ["name", "avatar"]);
        res.json(profile)
    }catch(err) {
        console.erroe(err.message);
        res.status(500).send("Sever Error")
    }
});

// GET api/profile/user/:user_id
// get profile by id

router.get("/user/:user_id",async (req,res)=>{
    try {
        const profile =  await Profile.findOne({
            user: req.params.user_id
        }).populate("user", ["name", "avatar"]);

    if(!profile){
        return res.status(400).json({msg: "Profile not found" })
    }
        res.json(profile)
    }catch(err) {
        console.erroe(err.message);
        if(err.kind === "ObjectId"){
            return res.status(400).json({msg: "Profile not found" })
        }
        res.status(500).send("Sever Error")
    }
})

//DELETE api/profile
// delete profile , user, and posts
//private

router.delete("/", auth, async (req,res)=>{
    try {
        //TODO: remove user posts
        //remove profile
         await Profile.findOneAndRemove({user:req.user.id});
        //remove user
         await User.findOneAndRemove({_id:req.user.id});
        res.json({msg: "User removed"})
    }catch(err) {
        console.erroe(err.message);
        res.status(500).send("Sever Error")
    }
});

// PUT api/profile/experience
// adding experience to profile
// private
router.put("/experience", [auth,[
    check("title", "Title is required").not().isEmpty(),
    check("company", "Company is required").not().isEmpty(),
    check("from", "From date is required").not().isEmpty(),
]], 
async (req,res) => {
 const errors = validationResult(req);
 if(!errors.isEmpty()){
     return res.status(400).json({errors: errors.array()})
 }
 const {
     title,
     company,
     location,
     from,
     to,
     current,
     description
 } = req.body

 const newExp = {
     title,
     company,
     location,
     from,
     to,
     current,
     description
 }

 try{
    const profile = await Profile.findOne({user: req.user.id});

    profile.experience.unshift(newExp);

    await profile.save();
    res.json(profile)
 }catch(err){
     console.err(err.message)
     res.status(500).send("server error")
 }

})

//DELETE api/profile/experience/:exp_id
// delete experience from profile
// private

router.delete("/experience/:exp_id", auth, async (req,res) => {
    try {
        //getting profiloe of user
        const profile = await Profile.findOne({user:req.user.id})

        //get remove index
        const removeIndex = profile.experinece.map(item => item.id).indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        //saving
        await profile.save();

        res.json(profile)
    } catch (err) {
        console.err(err.message)
        res.status(500).send("server error")
    }
})

//PUT api/profile/eduction
// add profiloe education
// private

router.put("/education", [auth,[
    check("school", "school is required").not().isEmpty(),
    check("degree", "Degree is required").not().isEmpty(),
    check("from", "From date is required").not().isEmpty(),
    check("fieldofstudy", "Field of study is required").not().isEmpty(),
]], 
async (req,res) => {
 const errors = validationResult(req);
 if(!errors.isEmpty()){
     return res.status(400).json({errors: errors.array()})
 }
 const {
    school,
     degree,
     fieldofstudy,
     from,
     to,
     current,
     description
 } = req.body

 const newEdu = {
    school,
     degree,
     fieldofstudy,
     from,
     to,
     current,
     description
 }

 try{
    const profile = await Profile.findOne({user: req.user.id});

    profile.education.unshift(newEdu);

    await profile.save();
    res.json(profile)
 }catch(err){
     console.err(err.message)
     res.status(500).send("server error")
 }

})

//DELETE api/profile/education/:edu_id
// delete education from profile
// private

router.delete("/education/:edu_id", auth, async (req,res) => {
    try {
        //getting profiloe of user
        const profile = await Profile.findOne({user:req.user.id})

        //get remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

        profile.education.splice(removeIndex, 1);

        //saving
        await profile.save();

        res.json(profile)
    } catch (err) {
        console.err(err.message)
        res.status(500).send("server error")
    }
})

//GET api/profilgithub/:username
// get user repos from ighub
// public
router.get("/github/:username", (req,res) => {
    try {
        const option = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: { "user-agent":"node.js"}
        };

        request(options, (err, reponse, body) => {
            if(error) console.error(error);

            if(response.statusCode !== 200) {
                res.statusCode(404).json({ msg: "No Github profile found"})
            }
        })
    } catch (error) {
        console.err(err.message)
        res.status(500).send("server error")
    }
})

module.exports = router