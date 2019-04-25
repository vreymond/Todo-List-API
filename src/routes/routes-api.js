let express = require('express');
let jwt = require ('jsonwebtoken');
let router = express.Router();
let logger = require('../lib/logger').logger;


router.post('/login_check', (req, res) => {
   
    logger.debug(JSON.stringify(req.body));

    const user = req.body;
    const token = jwt.sign({user}, 'secret_key');
    res.json({
        token: token
    })
});

router.get('/lists/all', (req, res) => {
    res.json({
        text: 'protected data'
    });
});



module.exports = router;