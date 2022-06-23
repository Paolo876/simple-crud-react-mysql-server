/*  - validates jwt token -
*   post new comment route validates accessToken before proceeding to add the comment
*/

const { verify } = require("jsonwebtoken");

const validateToken = (req, res, next) => {
    const accessToken = req.header("accessToken");  //provided from frontend post route { header }
    if(!accessToken) return res.json({ error: "User not logged in!"});

    try {
        const validToken = verify(accessToken, "O7UWf2eGMQNppvpbhd7fHikgUI52P6uwcqMUV4194aeUW88tgxmSVqKFEVzugdm");
        req.user = validToken;
        if(validToken){
            return next();
        }
    } catch (error) {
        return res.json({error})
    }
}

module.exports = { validateToken };