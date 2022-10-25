const { Users } = require("../models");

const userHandlers = (io, socket) => {
  let user;
  let userFriends;
  //listen to user connecting.
  socket.on("onConnect", async (id) => {
    user = {id, sockets: [socket.id]};  
    if(!io.adapter.connectedUsers) io.adapter.connectedUsers = [];
    if(io.adapter.connectedUsers.some(item => item.id === id)) {
        //if user is already logged in on another device, add the socket id to user object.
        let item = io.adapter.connectedUsers.find(item => item.id === id)
        item.sockets.push(socket.id);
    } else {
        io.adapter.connectedUsers.push(user)
    }
    //get user's friends from db
    let userData = await Users.findOne({where: { id },
      attributes: ["userStatus"],
      include: {   
          model: Users, 
          as:'userFriends', 
          attributes: ["id"],
          through: {attributes: []}
        }
    });

    //store friends id's to userFriends array.
    if(userData){
      userFriends = userData.userFriends.map(item => item.id);

      let connectedFriends = io.adapter.connectedUsers.filter(item => {
        if(userFriends.includes(item.id)) return true;
        return false;
      })
      //emit onLogin event to friend's sockets
      connectedFriends.forEach(item => {
        item.sockets.forEach(_item => {
          io.of("users").to(_item).emit("onLogin", { id, userStatus: userData.userStatus });
        })
      })
    } else {
      userFriends = [];
    }
  })


  //heartbeat is called on interval to check for friends sudden disconnect
  socket.on("heartbeat", () => {
    // emit id of active friends --as array
    if(userFriends && io.adapter.connectedUsers){
      socket.emit('heartbeat', io.adapter.connectedUsers.filter(item => userFriends.includes(item.id)).map(item => item.id));
    }
  })


  socket.on("onLogout", async () => {
    if(io.adapter.connectedUsers && user){
      let item = io.adapter.connectedUsers.find(_item => _item.id === user.id)
      if(item.sockets) item.sockets = [...item.sockets.filter(_item => _item !== socket.id)];
      //if user has no sockets connected, update Users db
      if(item.sockets && item.sockets.length === 0) {
        io.adapter.connectedUsers = [ ...io.adapter.connectedUsers.filter(_item => _item !== item)]
        await Users.update({isLoggedIn: false}, { where: { id: user.id } });
        //emit to friend's sockets
        io.adapter.connectedUsers.filter((_item) => userFriends.includes(_item.id)).forEach(__item => {
          __item.sockets.forEach(____item => io.of("users").to(____item).emit("friend_logout", user.id))
        })
      };
    }  
    user = null;
    userFriends = null; 
  })


  socket.on('disconnect', async () => {
    // if(io.adapter.connectedUsers && user){
    //   let item = io.adapter.connectedUsers.find(_item => _item.id === user.id)
    //   if(item.sockets) item.sockets = [...item.sockets.filter(_item => _item !== socket.id)];
    //   //if user has no sockets connected, update Users db
    //   if(item.sockets && item.sockets.length === 0) {
    //     io.adapter.connectedUsers = [ ...io.adapter.connectedUsers.filter(_item => _item !== item)]
    //     await Users.update({isLoggedIn: false}, { where: { id: user.id } });
    //     //emit to friend's sockets
    //     io.adapter.connectedUsers.filter((_item) => userFriends.includes(_item.id)).forEach(__item => {
    //       __item.sockets.forEach(____item => io.of("users").to(____item).emit("friend_logout", user.id))
    //     })
    //   };
    // }  
    // user = null;
    // userFriends = null; 
    if(io.adapter.connectedUsers && user){
      //remove from socket.adapter.connectedUsers array
      let disconnectedUser = io.adapter.connectedUsers.find(item => item.id === user.id)
      if(disconnectedUser) disconnectedUser.sockets = [ ...disconnectedUser.sockets.filter(item => item !== socket.id)];
      
      //remove connected user if no sockets exist
      if(disconnectedUser && disconnectedUser.sockets.length === 0) {
        io.adapter.connectedUsers.splice(io.adapter.connectedUsers.indexOf(disconnectedUser), 1);
        await Users.update({isLoggedIn: false}, { where: { id: user.id } });
      };
    }
  });
  
}
  
module.exports = userHandlers;