/* global */

'use strict';

let UserModel;
const ENV = require.main.require('../app/env.js');
const log = require.main.require('../libs/log.js');
const express = require('express');
const router = express.Router();
// const session = require('express-session');

router.use(function(req, res, next){
    UserModel = require.main.require(`../app/models/${ENV.DBDRIVER}/user.js`)(req.app.get('db'));
    next();
});

router.post('/', function(req, res){
    if (req.body.submit){
        const data = {
            username : req.body.username,
            password : req.body.password
        };

        UserModel
            .getUser(data)
            .then(function(user){
                if (user){
                    req.session.login = {
                        loginned : true,
                        userId : user.id,
                        userName : user.name,
                        error : null
                    };
                }
                else {
                    req.session.login = {
                        loginned : false,
                        error : 'Nem jó!!!'
                    };
                }
                res.redirect('/');
            })
            .catch(function(error){
                log.error(error);
            });
    }
});

module.exports = router;
