/**
 *
 */

'use strict';

const ENV = require.main.require('../app/env.js');
const express = require('express');
const router = express.Router();

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
