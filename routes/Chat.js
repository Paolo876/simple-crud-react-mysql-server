const express = require("express");
const router = express.Router();
const { ChatMessages, ChatRoom, ChatUsers, Users } = require("../models");     
const { validateToken } = require("../middlewares/authMiddleware");
const { literal, Op } = require("sequelize");

//new message (creates a new chat room with receiver)
router.post("/new-message", validateToken, async (req, res) => {
    const UserId = req.user.id;
    const { message, media, receipientId } = req.body;

    //create chatroom
    const chatRoom = await ChatRoom.create();
    const ChatRoomId = chatRoom.toJSON().id;

    //create chatusers for user & receipient
    await ChatUsers.create({ChatRoomId, UserId, isLastMessageRead: true});
    await ChatUsers.create({ChatRoomId, UserId: receipientId, isLastMessageRead: false});

    //create chatmessage
    await ChatMessages.create({message, media, ChatRoomId, UserId})

    res.json(ChatRoomId)
})

//send message
router.post("/send-message", validateToken, async (req, res) => {
    const UserId = req.user.id;
    const data = {message, media, ChatRoomId} = req.body;
    const result = await ChatMessages.create({...data, UserId})
    const user = await Users.findByPk(UserId, { attributes: ["id", "username", "userInformation"] })
    //update isLastMessageRead property on ChatUsers except user/sender
    await ChatUsers.update({isLastMessageRead: false}, { where: {ChatRoomId, UserId: { [Op.not]: UserId }}})

    // update ChatRoomId updatedAt (for querying purposes)
    const chatRoom = await ChatRoom.findByPk(ChatRoomId)
    chatRoom.changed('updatedAt', true);
    await chatRoom.update({updatedAt: new Date()})

    res.json({...result.toJSON(), User: user})
})

//return chatMessages through chatRoomId, make sure userid is in chatroom
router.get("/chat-room/:id", validateToken, async (req,res) => {
    const ChatRoomId = req.params.id;
    const UserId = req.user.id;
    //check if user is a member of chatRoom
    const isMember = await ChatUsers.findOne({where: {ChatRoomId, UserId}})
    if(isMember){
        const result = await ChatRoom.findByPk(ChatRoomId, {
            attributes: ["id"],
            include: { 
                model: ChatMessages, 
                limit: 20,
                attributes: {exclude: ["ChatRoomId", "UserId"]}, 
                include: {model: Users, attributes: ["id", "username", "userInformation"]},
                order: [['createdAt', 'DESC' ]]
            },
        });
        //update isLastMessageRead property on ChatUsers
        await ChatUsers.update({isLastMessageRead: true}, {where: {ChatRoomId, UserId }})
        res.json(result)
    } else {
        res.json({error: "Failed to fetch data."})
    }
})

// returns chatRoomId if chat exists
router.post("/search-chat", validateToken, async (req,res) => {
    const UserId = req.user.id;
    const FriendId = req.body.id;
    const existingRoom = await ChatUsers.findOne({
        where : { UserId: [ UserId, FriendId ] }, 
        group: "ChatRoomId", 
        having: literal(`count(*) = 2`),
        attributes: ["ChatRoomId"]
    });
    if(existingRoom){
        res.json(existingRoom.ChatRoomId)
    } else {
        res.json({error: "nothing found."})
    }
})

//return user's chatrooms and last message from chat
router.get("/user-chatrooms", validateToken, async (req,res) => {
    const id = req.user.id;
    const result = await ChatUsers.findAll({
        where: { UserId: id}, 
        attributes: ["ChatRoomId"],
        include: {
            raw:true,
            model: ChatRoom, 
            as: "ChatRoom", 
            attributes: ["id"],
            include: [
                {
                    model: ChatMessages,
                    limit: 1,
                    order: [['createdAt', 'DESC']]
                },
                {
                    raw:true,
                    model: Users, as: "members",
                    attributes: ["username", "id", "userInformation"],
                    through: {
                        attributes: ["isLastMessageRead"], 
                        as: "ChatUsers"
                    }
                }
            ],
        },
        order: [
            [ ChatRoom, 'updatedAt', 'DESC']
        ],
        limit : 20  //limit list to 20 (for eager-loading)
    });
    //filter by most recent message
    const chatRooms = result.map(item => ({ 
            chatRoomId: item.ChatRoomId, 
            members: item.ChatRoom.members.map(_item => { return { id:_item.id, userInformation: _item.userInformation, username:_item.username, isLastMessageRead:_item.ChatUsers.isLastMessageRead}}),
            chat: {...item.ChatRoom.ChatMessages[0].toJSON()}
        }
    ));
    res.json(chatRooms);
})

module.exports = router;