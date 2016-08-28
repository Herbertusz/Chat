/* global appRoot */

'use strict';

var ENV = require(`${appRoot}/app/env.js`);
var express = require('express');
var router = express.Router();

router.get('/', function(req, res){

    res.set({
        'Content-Type' : 'text/xml',
        'charset' : 'utf-8'
    });

    res.render('sitemap', {
        'DOMAIN' : ENV.DOMAIN
    });

});

module.exports = router;
