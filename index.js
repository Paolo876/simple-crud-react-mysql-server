const express = require('express');
const app = express(); //initialize express
const cors = require("cors");
const ImageKit = require('imagekit');
require("dotenv").config();
app.use(express.json());
app.use(cors());    //to allow api connection from computer to react project
const db = require("./models"); //import tables from models folder

//socket io
const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "PUT"]
      },
});
app.set("socketio", io);
  
// routers
app.use("/posts", require("./routes/Posts"))
app.use("/comments", require("./routes/Comments"));
app.use("/auth", require("./routes/Users"));
app.use("/user-updates", require("./routes/UserUpdates"));
app.use("/likes", require("./routes/Likes"));
app.use("/friends", require("./routes/Friends"));
app.use("/chat", require("./routes/Chat"));
app.use("/imagekit", require("./routes/ImageKit"));

//eventHandlers
// const postHandlers = require("./events/postHandlers");
// const onConnection = (socket) => {
    
// }

const userHandlers = require("./events/userHandlers");
const friendHandlers = require("./events/friendHandlers");
const chatHandlers = require("./events/chatHandlers");

io.of("users").on("connection", async (socket) => userHandlers(io, socket))
io.of("friends").on("connection", async (socket) => friendHandlers(io, socket))
io.of("chat").on("connection", async (socket) => chatHandlers(io, socket))


db.sequelize.sync()
    .then(()=> {
        httpServer.listen(process.env.PORT || 3001, () => console.log("LISTENING TO PORT 3001"));

    })
    .catch( err => console.log(err))


//connect db to local mysql through config/config.json ****















/**********************************************************************************************************************
 * npm init
 * express
 * cors
 * mysql2
 * nodemon <-- restarts the server after every changes ("add script on package.json to run nodemon")
 *          "start": "nodemon index.js" <-- 'npm start' to run
 * 
 * 
 * sequelize        <-- for writing mysql queries easier and connecting the project to the mysql database
 * sequelize-cli
 *      'sequelize init' to install or 'npx sequelize-cli init' if errors show
 * 
 * bcryptjs - hash passwords
 * jwt(jsonwebtoken) - auth authorization
 * dotenv
 * imagekit
 */

