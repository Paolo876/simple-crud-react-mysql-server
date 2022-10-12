const express = require("express");
const router = express.Router();
const { Comments, Users } = require("../models");     
const { validateToken } = require("../middlewares/authMiddleware");

// get comments from id
router.get("/:postId", async (req, res) => {
    const postId = req.params.postId;   //the id from the get request**
    const comments = await Comments.findAll({ 
        where: {PostId: postId },
        include: [{
            model: Users,
            attributes: ["username", "userInformation"],
            required: true
        }],

    });          
    res.json(comments);
});

// post new commment
router.post("/", validateToken, async (req, res) => {
    const response = await Comments.create(req.body);
    const {io, socket} = req.app.get("socketio");
    const postHandlers = require("../events/postHandlers");
    postHandlers(io, socket).sendComment(req.body)
    res.json(response);
})

// delete comment
router.delete("/:commentId", validateToken, async (req, res) => {
    const id = req.params.commentId;

    const response = await Comments.destroy({
        where : { id }
   });
    res.json(response)
})

module.exports = router;