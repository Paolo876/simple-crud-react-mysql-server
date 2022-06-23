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
            attributes: ["username"],
            required: true
        }],

    });          
    
    //findAll comments where the Column PostId is equal to the id from request
    // const users = await Users.findAll({
    //     where: {id : comments.UserId}
    // })
    res.json(comments);
});

// post new commment
router.post("/", validateToken, async (req, res) => {
    const response = await Comments.create(req.body);
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