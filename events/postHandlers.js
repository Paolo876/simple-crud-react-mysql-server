const postHandlers = (io, socket) => {
  const sendComment = (payload) => {
    io.emit("receive_comment", payload)
  }

  const onConnection = (payload) => {
    io.of("/posts").on("connection", (socket) => {
      // socket.on("send_comment", sendComment);
      
    })
  }

  // socket.on("send_comment", sendComment);

  return {
    sendComment,
    onConnection
  }
}



module.exports = postHandlers;