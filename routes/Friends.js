const express = require("express");
const router = express.Router();
const { Friends, Users } = require("../models");     
const { validateToken } = require("../middlewares/authMiddleware");

//get friends of user
router.get("/user-friends/:userId", async (req, res) => {
    const id = req.params.userId;
    const user = await Users.findOne({where: { id },
        attributes: [],
        include: {   
            model: Users, 
            as:'friendsOf', 
            attributes: ["username", "userInformation", "id", "isLoggedIn", "userStatus"],
            through: {
                attributes: ["status", "createdAt"],
                as:"relationship"
            }
        }
    });
    const { friendsOf } = user.toJSON()
    res.json(friendsOf)
})


//get user-to-user status
router.get("/status/:id", validateToken, async (req,res) => {
    const UserId = req.user.id;
    const FriendId = req.params.id;
    const response = await Friends.findOne({ where: { UserId:FriendId, FriendId:UserId }})
    res.json(response)
})


//send or cancel friend request
router.post("/add", validateToken, async (req, res) => {
    const action = req.body.action;
    const FriendId = req.body.id;
    const UserId = req.user.id;
    const existingRequest = await Friends.findOne({ where: {UserId, FriendId}})
    if(action === "add"){
        if(!existingRequest){
            const response = await Friends.create({UserId, FriendId, status: 'pending'});
            await Friends.create({UserId:FriendId, FriendId:UserId, status: 'awaiting-response'});
            res.json({UserId, FriendId, id: response.id, action})
        } else {
            res.json({error: "Friend request already sent."})
        }
    }
    if(action === "cancel"){
        await Friends.destroy({ where: {UserId, FriendId}});
        await Friends.destroy({ where: {UserId:FriendId, FriendId:UserId}});
        res.json({UserId, FriendId, action})
    }

})

//confirm or decline friend request
router.post("/request-action", validateToken, async (req, res) => {
    const action = req.body.action;
    const FriendId = req.body.id;
    const UserId = req.user.id;
    if(action === "confirm"){
        //check if the friendId sent a friend request
        const existingRequest = await Friends.findOne({ where: {UserId, FriendId}});
        if(existingRequest) {
            await Friends.update({status: "friends"}, { where: {UserId, FriendId}});
            await Friends.update({status: "friends"}, { where: {UserId: FriendId, FriendId: UserId}});
        }
        // update pending status of friend request
        // await Friends.update({status: "friends"}, { where: {UserId: FriendId, FriendId: UserId}});
        // await Friends.create({UserId, FriendId, status: "friends"});
    }
    if(action === "delete") {
        //delete friend request
        await Friends.destroy({ where: {UserId: FriendId, FriendId: UserId}});
        await Friends.destroy({ where: {UserId, FriendId}});
    }
    res.json({FriendId, action})
})
//block friend/user

module.exports = router;