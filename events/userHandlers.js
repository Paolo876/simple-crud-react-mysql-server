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
      // connectedFriends = [];
    }
  })


  //heartbeat is called on interval to check for friends sudden disconnect
  socket.on("heartbeat", () => {
    // emit id of active friends --as array
      socket.emit('heartbeat', userFriends && io.adapter.connectedUsers && io.adapter.connectedUsers.filter(item => userFriends.includes(item.id)).map(item => item.id));
  })


  socket.on("onLogout", async () => {
    if(io.adapter.connectedUsers && user){
      let item = io.adapter.connectedUsers.find(item => item.id === user.id)
      item.sockets && item.sockets.splice(item.sockets.indexOf(socket.id), 1);      //double check this
      if(item.sockets && item.sockets.length === 0) {
        io.adapter.connectedUsers.splice(io.adapter.connectedUsers.indexOf(item), 1);
        await Users.update({isLoggedIn: false}, { where: { id: user.id } });
      };
    }

    //emit only to friends sockets ****
    // socket.broadcast.emit('heartbeat', socket.adapter.connectedUsers && socket.adapter.connectedUsers.filter(item => userFriends.includes(item.id)).map(item => item.id));

  })


  socket.on('disconnect', async () => {
    if(io.adapter.connectedUsers && user){
      //remove from socket.adapter.connectedUsers array
      let disconnectedUser = io.adapter.connectedUsers.find(item => item.id === user.id)
      if(disconnectedUser) disconnectedUser.sockets.splice(disconnectedUser.sockets.indexOf(socket.id), 1);
      
      //remove connected user if no sockets exist
      if(disconnectedUser && disconnectedUser.sockets.length === 0) {
        io.adapter.connectedUsers.splice(io.adapter.connectedUsers.indexOf(disconnectedUser), 1);
        await Users.update({isLoggedIn: false}, { where: { id: user.id } });
      };
    }
  });
}
  
module.exports = userHandlers;