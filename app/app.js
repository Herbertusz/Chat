/* global */

'use strict';

var io;
var http = require('http');
var express = require('express');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var sessionModule = require('express-session');
var FileStore = require('session-file-store')(sessionModule);
var MongoClient = require('mongodb').MongoClient;
var log = require(`../libs/log.js`);

var app, server, session, dbConnectionString;

app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.set('public path', `${__dirname}/public`);

app.use(favicon(`${__dirname}/public/favicon.png`));
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));
app.use(cookieParser());
app.use(express.static(app.get('public path')));

// Adatbázis kapcsolódás
dbConnectionString = require(`../app/models/dbconnect.js`);
const connectPromise = MongoClient
    .connect(dbConnectionString)
    .then(function(db){

        app.set('db', db);

        // Session
        session = sessionModule({
            secret : "Kh5Cwxpe8wCXNaWJ075g",
            resave : false,
            saveUninitialized : false,
            reapInterval : -1,
            store : new FileStore({
                path : `../tmp`,
                ttl : 86400,  // 1 nap
                logFn : function(message){
                    log.error(message);
                }
            })
        });
        app.use(session);

        // Layout
        require(`../app/routes/layout.js`)(app);

        // Websocket
        server = http.createServer(app);
        io = require(`../app/websocket.js`)(server, session, app);
        app.set('io', io);

        // Route
        const routes = [
            ['/', './routes/index'],
            ['/chat', './routes/chat'],
            ['/videochat', './routes/videochat'],
            ['/login', './routes/login'],
            ['/logout', './routes/logout'],
            ['/sitemap', './routes/sitemap']
        ];
        routes.forEach(function(route){
            app.use(route[0], require(route[1]));
        });

        // Hibakezelők
        app.use(function(req, res){
            const err = new Error(`Not Found: ${req.originalUrl}`);
            log.error(err);
            err.status = 404;
            res.status = 404;
            res.render('layout', {
                page : 'error',
                pageType : 'error',
                message : err.message,
                error : err
            });
        });
        app.use(function(err, req, res){
            res.status(err.status || 500);
            log.error(err);
        });

        app.httpServer = server;
        return app;

    })
    .catch(function(error){
        log.error(error);
    });

module.exports = connectPromise;
