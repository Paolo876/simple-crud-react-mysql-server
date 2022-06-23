const express = require('express');
const app = express(); //initialize express
const cors = require("cors");
require("dotenv").config();
app.use(express.json())
app.use(cors());    //to allow api connection from computer to react project

const db = require("./models"); //import tables from models folder

// routers
const postRouter = require("./routes/Posts");
app.use("/posts", postRouter)

const commentsRouter = require("./routes/Comments");
app.use("/comments", commentsRouter);

const usersRouter = require("./routes/Users");
app.use("/auth", usersRouter);

const likesRouter = require("./routes/Likes");
app.use("/likes", likesRouter);


db.sequelize.sync().then(()=> {
    app.listen(process.env.PORT || 3001, ()=> {
        console.log("LISTENING TO PORT 3001")
    })    
}).catch(err => {
    console.log(err)
})

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
 */

