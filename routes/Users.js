const express = require("express");
const router = express.Router();
const { Users } = require("../models");     //import an instance of the Posts model
const bcrypt = require("bcryptjs");   //password hash
const { sign } = require('jsonwebtoken');
const { validateToken } = require("../middlewares/authMiddleware");

// signup
router.post("/", async (req, res) => {
    const { username, password } = req.body;
    const isTaken = await Users.findOne({ where: { username }});
    if(isTaken){
        res.json({error: "Username already taken."})
    }else{
        bcrypt.hash(password, 10).then( async (data) => {
            const user = await Users.create({
                username,
                password: data,
            })
            const accessToken = sign({ username: user.username, id: user.id }, "O7UWf2eGMQNppvpbhd7fHikgUI52P6uwcqMUV4194aeUW88tgxmSVqKFEVzugdm");
            res.json({accessToken, username: user.username, id: user.id, userInformation: user.userInformation});
        })
    }

});

// login
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await Users.findOne({where: { username }});
    if(!user){
        res.json({error: "No user found."})
    } else{
        bcrypt.compare(password, user.password).then( match => {       
            if(!match) {
                res.json({error: "The password you entered is incorrect."});
            } else{
                const accessToken = sign({ username: user.username, id: user.id, userInformation: JSON.parse(user.userInformation) }, "O7UWf2eGMQNppvpbhd7fHikgUI52P6uwcqMUV4194aeUW88tgxmSVqKFEVzugdm");
                res.json({accessToken, username: user.username, id: user.id, userInformation: JSON.parse(user.userInformation)});   
            }
        })    
    }
});

// authorize token available
router.get("/authorize", validateToken, async (req,res) => {
    res.json(req.user)
})

// get profile info
router.get("/profile/:id", async (req,res) => {
    const id = req.params.id;

    const user = await Users.findByPk(id, {
        attributes: {
            exclude: ["password"]
        }
    });

    res.json(user)
})

// update profile info
router.put("/updateProfile", validateToken, async (req, res) => {
    const id = req.user.id;
    const updates = req.body;

    await Users.update(updates, { where: { id }});
    const user = await Users.findOne({where: { id }});

    const accessToken = sign({ username: user.username, id: user.id, userInformation: JSON.parse(user.userInformation)}, "O7UWf2eGMQNppvpbhd7fHikgUI52P6uwcqMUV4194aeUW88tgxmSVqKFEVzugdm");
    res.json({accessToken, username: user.username, id: user.id, userInformation: JSON.parse(user.userInformation)});

})


// update password info 
router.put("/changePassword", validateToken, async (req, res) => {
    const id = req.user.id;
    const { oldPassword, newPassword } = req.body;
    const user = await Users.findOne({where: { id }});

    //compare old passwords
    bcrypt.compare(oldPassword, user.password).then( async (match) => {       
        if(!match) {
            res.json({error: "The password you entered is incorrect."});
        } else{
            // update new password
            bcrypt.hash(newPassword, 10).then( (data) => {
                Users.update({password: data}, { where: { id }})
                res.json("Password updated!")
            })
        }
    })

})

module.exports = router;



// ** NOTE: sequelize functions should always be asynchronous