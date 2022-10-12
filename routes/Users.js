const express = require("express");
const router = express.Router();
const { Users } = require("../models");   
const bcrypt = require("bcryptjs");   //password hash
const { sign } = require('jsonwebtoken');
const { validateToken } = require("../middlewares/authMiddleware");
const sequelize = require('sequelize');

/**
 * user routes includes : signup, login, authorizeToken, getProfileinfo, search/query
 */

// signup
router.post("/", async (req, res) => {
    const { username, password } = req.body;
    const isTaken = await Users.findOne({ where: { username }});
    if(isTaken){
        res.json({error: "Username already exists."})
    }else{
        bcrypt.hash(password, 10).then( async (data) => {
            const user = await Users.create({
                username,
                password: data,
            })
            const responseData = {
                username: user.username, 
                id: user.id, 
                isLoggedIn : user.isLoggedIn, 
                userStatus: user.userStatus,
                userInformation: null, 
                userFriends: null,
            }
            //save to accessToken
            const accessToken = sign(responseData, "O7UWf2eGMQNppvpbhd7fHikgUI52P6uwcqMUV4194aeUW88tgxmSVqKFEVzugdm");
            res.json({accessToken, ...responseData});
        })
    }
});

// login
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await Users.findOne({ where: { username } });
    if(!user){
        res.json({error: "No user found."})
    } else{
        bcrypt.compare(password, user.password).then( async (match) => {       
            if(!match) {
                res.json({error: "The password you entered is incorrect."});
            } else{
                //set isLoggedInto true
                await Users.update({isLoggedIn: true}, { where: { username } });
                const responseData = {
                    username: user.username, 
                    id: user.id, 
                    userInformation: JSON.parse(user.userInformation), 
                }
                const accessToken = sign(responseData, "O7UWf2eGMQNppvpbhd7fHikgUI52P6uwcqMUV4194aeUW88tgxmSVqKFEVzugdm");
                res.json({accessToken, ...responseData });   
            }
        })    
    }
});

//logout        --update isLoggedIn property to false
router.put("/logout", validateToken, async (req, res) => {
    const id = req.user.id;
    await Users.update({isLoggedIn: false}, { 
        where: { id },
    });

    res.json("SUCCESS")
})


// authorize token available
router.get("/authorize", validateToken, async (req,res) => {
    await Users.update({isLoggedIn: true}, { where: { id:req.user.id } });
    res.json(req.user)
})

// get profile info
router.get("/profile/:id", async (req,res) => {
    const id = req.params.id;
    const user = await Users.findByPk(id, {
        attributes: [ "username", "userInformation", "id", "isLoggedIn", "userStatus"],
        include: {
            model: Users, 
            as:'friendsOf', 
            attributes: [ "username", "userInformation", "id" ],
            through: {
                attributes: ["status", "createdAt"],
                as:"relationship"
            }
        }
    });
    res.json(user)
})

//get current status of user
router.get("/status", validateToken, async (req, res) => {
    const user = await Users.findByPk(req.user.id, {
        attributes: ["userStatus"]
    })
    res.json(user)
})
//search/query users
router.get("/search/:query", async (req,res) => {
    const query = req.params.query.toLowerCase();
    const users = await Users.findAll({
        where: { username: sequelize.where(sequelize.fn('LOWER', sequelize.col('username')), 'LIKE', '%' + query + '%')},
        attributes: [ "username", "userInformation", "id", "isLoggedIn", "userStatus" ],
    });
    res.json(users)
})


module.exports = router;