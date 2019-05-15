
const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const path = require('path')
const db = require('./db')

const app = express()
app.set("view engine", "ejs");

// midleware settings
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 't}5v7]5136%=}{hf'
}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false })); 

// HOME
app.use('/', express.static(path.join(__dirname, 'home')))

// AUTH
app.use('/auth', function(req, res, next) {
    if(req.session.user) {
        res.redirect('/')
        next()
    } else {
        express.static(path.join(__dirname, 'auth'))(req, res, next)
    }
})
app.post('/auth', function(req, res) {
    if(req.session.user) {
        res.redirect('/')
        return
    }

    if(req.body.create) {
        db.user.get({
            params: {login: req.body.login},
            callback: data => {
                if(data) {
                    res.end('0')
                } else {
                    db.user.add({
                        params: {login: req.body.login, password: req.body.password},
                        callback: data => {
                            req.session.user = data[0]._id
                            res.end('1')
                        }
                    })
                }
            }
        })
    } else {
        db.user.get({
            params: {login: req.body.login, password: req.body.password},
            callback: data => {
                if(data) {
                    req.session.user = data._id
                    res.end('1')
                } else {
                    res.end('0')
                }
            }
        })
    }
})

// CANVAS
app.use('/canvas', function(req, res, next) {
    if(req.session.user) {
        if(req.session.room_id !== undefined) {
            express.static(path.join(__dirname, 'canvas/api'))(req, res, next)
        } else {
            express.static(path.join(__dirname, 'canvas/mode'))(req, res, next)
        }
    } else {
        res.redirect('/auth')
        next()
    }
})
app.get('/canvas', function(req, res) {
    if(req.session.user && req.session.room_id !== undefined) {
        res.render(path.join(__dirname, 'canvas/api'), {
            room: db.user.toString(req.session.room_id)
        })
    }
})
app.post('/canvas', function(req, res) {
    if(req.body.exit) {
        delete req.session.room_id
        res.send('1')
    } else
    if(req.body.create) {
        db.room.add({
            callback: data => {
                if(data) {
                    req.session.room_id = data.key
                    res.send('1')
                } else {
                    res.send('0')
                }
            }
        })
    } else {
        db.room.get({
            params: {key: +req.body.id},
            callback: data => {
                if(data) {
                    req.session.room_id = data.key
                    res.send('1')
                } else {
                    res.send('0')
                }
            }
        })
    }
})

// RUN
app.listen('8080', function() {
    console.log('server run on localhost:8080')
})



// const { createCanvas } = require('canvas')
// app.post('/canvas', function(req, res) {
//   var canvas = createCanvas(200, 200)
//   var ctx = canvas.getContext('2d')
//
//   ctx.fillStyle = 'lightgreen'
//   ctx.fillRect(0, 0, canvas.width, canvas.height)
//
//   ctx.beginPath()
//   ctx.moveTo(10, 10)
//   ctx.lineTo(190, 10)
//   ctx.lineTo(190, 190)
//   ctx.lineTo(10, 190)
//   ctx.closePath()
//   ctx.stroke()
//
//   res.send(canvas.toDataURL())
// })

