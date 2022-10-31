const { Users } = require("../models");

const userHandlers = (io, socket) => {
  let user;         //{id: /user's id/, sockets: /array of user's sockets/}
  let userFriends = [];  //array of all of user's friends' id
  let connectedFriends = [];  //array of objects of user's friends currently connected to the app.

  //listen to user connecting.
  socket.on("onConnect", async (id) => {
    user = { id, sockets: [socket.id] };  
    if(!io.adapter.connectedUsers) io.adapter.connectedUsers = [];  

    //if user is already logged in on another device, add the socket id to user object.
    const currentUser = io.adapter.connectedUsers.find(item => item.id === id);
    currentUser ? currentUser.sockets.push(socket.id) : io.adapter.connectedUsers.push(user);

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
      connectedFriends = io.adapter.connectedUsers.filter(item => userFriends.includes(item.id))  //check friends currently connected to the app

      //emit onLogin event to every connected friends' sockets
      connectedFriends.forEach(item => {
        item.sockets.forEach(_item => io.of("users").to(_item).emit("onLogin", { id, userStatus: userData.userStatus }))
      })
    }
  })

  //statusChange listens to user status changes
  socket.on("statusChange", async (data) => {
    if(!io.adapter.connectedUsers) io.adapter.connectedUsers = [];  
    connectedFriends = io.adapter.connectedUsers.filter(item => userFriends.includes(item.id));   //update connectedFriends array
    const items = [...connectedFriends, io.adapter.connectedUsers.find(item => item.id === user.id)];   //include user's current sockets on emit
    await Users.update({ userStatus: data.userStatus }, { where: { id: data.id } });
    //emit to connectedFriends
    items.forEach(item => item.sockets.forEach(_item => io.of("users").to(_item).emit("statusChange", data)))
  })

  //heartbeat is called on interval to check for friends sudden disconnect
  socket.on("heartbeat", () => {
    if(!io.adapter.connectedUsers) io.adapter.connectedUsers = [];  
    connectedFriends = io.adapter.connectedUsers.filter(item => userFriends.includes(item.id));   //update connectedFriends array
    socket.emit('heartbeat', connectedFriends.map(item => item.id));  //emit only the id's of connected friends
  })

  socket.on("onLogout", async () => {
    if(io.adapter.connectedUsers && user){
      let item = io.adapter.connectedUsers.find(_item => _item.id === user.id)
      if(item.sockets) item.sockets = [...item.sockets.filter(_item => _item !== socket.id)];
      //if user has no sockets connected, update Users db
      if(item.sockets && item.sockets.length === 0) {
        io.adapter.connectedUsers = [ ...io.adapter.connectedUsers.filter(_item => _item !== item)]   //remove user from io connectedUsers
        await Users.update({isLoggedIn: false}, { where: { id: user.id } });    //update isLoggedIn property from db to false

        //emit to friend's sockets
        // io.adapter.connectedUsers.filter((_item) => userFriends.includes(_item.id)).forEach(__item => {
        //   __item.sockets.forEach(____item => io.of("users").to(____item).emit("friend_logout", user.id))
        // })
        connectedFriends.forEach(__item => {
            __item.sockets.forEach(____item => io.of("users").to(____item).emit("friend_logout", user.id))
          })
      };
    }  
    user = null;
    userFriends = []; 
    connectedFriends = [];
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
        io.adapter.connectedUsers = io.adapter.connectedUsers.filter(item => item !== disconnectedUser)
        // io.adapter.connectedUsers.splice(io.adapter.connectedUsers.indexOf(disconnectedUser), 1);
        await Users.update({isLoggedIn: false}, { where: { id: user.id } });
      };
    }
  });
}
  
module.exports = userHandlers;