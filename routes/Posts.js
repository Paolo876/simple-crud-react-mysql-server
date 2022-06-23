const express = require("express");
const router = express.Router();
const { Posts, Users, Likes } = require("../models");     //import an instance of the Posts model
const { validateToken } = require("../middlewares/authMiddleware");


// get all posts
router.get("/", async (req, res) => {
    const postsList = await Posts.findAll({
        include: [
            {
            model: Users,
            attributes: ["username"],
            required: true
        },
        {
            model: Likes,    //no required tag, some post may not have any likes
            attributes: ["id", "PostId", "UserId"]
        }
    ]
    });
    res.json(postsList)
});


// get post by id
router.get("/byId/:id", async (req, res) => {
    const id = req.params.id;
    // const post = await Posts.findByPk(id);          //findByPk <-find a column in the db using primary key(id)
    const post = await Posts.findOne({
        where: {
            id
        },
        include: [{
            model: Users,
            attributes: ["username"],
            required: true
        }]
    });         
    res.json(post);
});

//get post by user id
router.get("/user/:userId", async (req, res) => {
    const UserId = req.params.userId;
    const posts = await Posts.findAll({
        where: { UserId },
        include: [
        {
            model: Likes,    //no required tag, some post may not have any likes
            attributes: ["id", "PostId", "UserId"]
        }
    ]
    });
    res.json(posts);
})


// new post
router.post("/", validateToken, async (req, res) => {
    const UserId = req.user.id;
    const post = req.body;
    await Posts.create({...post, UserId});
    res.json(post)
});

//delete post
router.delete("/:postid", validateToken, async (req,res) => {
    const id = req.params.postid;
    const UserId = req.user.id;
    await Posts.destroy({ 
        where: { id, UserId }
    })
    res.json(true)
})

module.exports = router;



// ** NOTE: sequelize functions should always be asynchronous