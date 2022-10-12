const { Users } = require("../models");

const friendHandlers = (io, socket) => {
    let connectedUsers = io.adapter.connectedUsers || [];

    //realtime friend request: update user on add/ cancel friend req
    socket.on("onAddAndCancelFriend", async (data) => {
        // check if user is connected and emit a friend request
        let user = connectedUsers.find(item => item.id === data.FriendId)
        if(user){
            let userData = await Users.findByPk(data.UserId, {
                attributes: ["isLoggedIn", "userInformation", "userStatus", "username", "id"]
            })
            user.sockets.forEach(item => io.of("users").to(item).emit("newRequest", {...userData.toJSON(), action: data.action}))
        }
    })
}
  
module.exports = friendHandlers;