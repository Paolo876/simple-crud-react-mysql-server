const { ChatUsers, ChatRoom, ChatMessages, Users } = require("../models");

const chatHandlers = (io, socket) => {
    let currentRoom = null;     // current room id of user
    let currentUser = null;     // user id
    let activeRooms;     //[{room: 1, users: [1,2]}]

    if(socket.adapter.activeRooms) {
        activeRooms = socket.adapter.activeRooms
    } else {
        socket.adapter.activeRooms = [];
        activeRooms = socket.adapter.activeRooms;
    }

    //join room
    socket.on("room", data => {
        const { room, user } = data;
        currentUser = user;
        currentRoom = room;
        socket.join(room)   //join room
        const existingRoom = activeRooms.find(item => item.room === room)
        if(existingRoom){
            existingRoom.users.push(user)
        } else {
            activeRooms.push({room, users:[user]})
        }
    })

    //leave room (manually)
    socket.on("leave", data => {
        const { room, user } = data;
        socket.leave(room)  //leave room

        const existingRoom = activeRooms.find(item => item.room === room)
        if(existingRoom) {
            existingRoom.users.splice(existingRoom.users.indexOf(user), 1)
            if (existingRoom.users.length === 0) activeRooms.splice(activeRooms.indexOf(existingRoom), 1)
        }
        currentRoom = null;
        currentUser = null; //null just in case the user logout, to delete the value.
    })

    //on socket disconnect
    socket.on("disconnect", () => {
        if(currentRoom) {
            const existingRoom = activeRooms.find(item => item.room === currentRoom)
            existingRoom.users.splice(existingRoom.users.indexOf(currentUser), 1)
            if (existingRoom.users.length === 0) activeRooms.splice(activeRooms.indexOf(existingRoom), 1)
            socket.leave(currentRoom)  //leave room
        }
    })

    //listen to new chat room created
    socket.on("new-chat-room", async (data) => {       
        const chatRoom = await ChatRoom.findByPk(data, {
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
        })
        const result = { 
            chatRoomId: chatRoom.id, 
            members: chatRoom.members.map(_item => { return { id:_item.id, userInformation: _item.userInformation, username:_item.username, isLastMessageRead:_item.ChatUsers.isLastMessageRead}}),
            chat: {...chatRoom.ChatMessages[0].toJSON()}
        };
        const connectedMembers = io.adapter.connectedUsers.filter(item => result.members.map(_item => _item.id).includes(item.id))
        if(connectedMembers) connectedMembers.forEach(item => item.sockets.forEach(_item => io.of("users").to(_item).emit("chat-list-new-room", result)))
    })
    //listen to messages sent
    socket.on("send-message", async (data) => {
        //emit message to everyone in the same chat room
        io.of("chat").in(data.ChatRoomId).emit("receive-message", data)

        //check if user in chatroom is logged in
        const chatUsers = await ChatUsers.findAll({where: {ChatRoomId:data.ChatRoomId}, attributes: ["UserId"]})
        const chatUsersArr = chatUsers.map(item => item.UserId) 
        const connectedMembers = io.adapter.connectedUsers.filter(item => chatUsersArr.includes(item.id))

        //update isLastMessageRead to true for connected members
        await ChatUsers.update({isLastMessageRead: true}, {where: {ChatRoomId: data.ChatRoomId, UserId: connectedMembers.map(item => item.id)}})

        //if user is in connectedUsers, emit to user's sockets 
        connectedMembers.forEach(item => item.sockets.forEach(_item => io.of("users").to(_item).emit("chat-list-new-message", data)))
    })
}
module.exports = chatHandlers;