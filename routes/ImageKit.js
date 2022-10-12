const express = require("express");
const router = express.Router();
const { validateToken } = require("../middlewares/authMiddleware");
const ImageKit = require('imagekit');
const fs = require('fs')
const imagekit = new ImageKit({
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY
});

// get authentication
router.get('/', (req, res) => {
    var result = imagekit.getAuthenticationParameters();
    res.send(result);
});

//delete image
router.delete("/delete/:id", validateToken, (req,res) => {
    const id = req.params.id;

    imagekit.deleteFile(id, function(error, result) {
        if(error) {
            res.json({error}); 
        } else {
            res.json(id)
        }
    });
})




module.exports = router;
