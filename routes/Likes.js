const express = require("express");
const router = express.Router();
const { Likes } = require("../models");     
const { validateToken } = require("../middlewares/authMiddleware");


router.post("/", validateToken, async (req,res) => {
    const { PostId } = req.body;
    const UserId = req.user.id;

    let response = await Likes.findOne({where : { PostId, UserId}});   //find if user already liked the post
    if(!response){
        response = await Likes.create({
            PostId,
            UserId,
        });
        res.json({response, isLiked:true});
    } else {
        await Likes.destroy({
            where: {
                PostId,
                UserId,
            }
        });
        res.json({response, isLiked:false});
    }


    
})

module.exports = router;
