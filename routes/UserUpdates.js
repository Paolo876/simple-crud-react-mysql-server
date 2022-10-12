const express = require("express");
const router = express.Router();
const { Users } = require("../models");   
const bcrypt = require("bcryptjs");   //password hash
const { validateToken } = require("../middlewares/authMiddleware");
const { sign } = require('jsonwebtoken');

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

// update profile info
router.put("/updateProfile", validateToken, async (req, res) => {
    const id = req.user.id;
    const updates = req.body;

    await Users.update(updates, { where: { id } });
    const user = await Users.findOne({where: { id }});
    const responseData = {
        username: user.username, 
        id: user.id, 
        userInformation: JSON.parse(user.userInformation), 
    }
    const accessToken = sign(responseData, "O7UWf2eGMQNppvpbhd7fHikgUI52P6uwcqMUV4194aeUW88tgxmSVqKFEVzugdm");
    res.json({accessToken, ...responseData });   
})


//change user status
router.put("/user-status", validateToken, async (req, res) => {
    const id = req.user.id;
    await Users.update(req.body, { where: { id } });
    const accessToken = sign({...req.user, ...req.body}, "O7UWf2eGMQNppvpbhd7fHikgUI52P6uwcqMUV4194aeUW88tgxmSVqKFEVzugdm");
    const io = req.app.get('socketio');
    io.of("/users").emit("onLogin", {id: req.user.id, ...req.body }) // <-- emit user id when logged in

    res.json({accessToken, ...req.user, ...req.body });   
})
module.exports = router;