const express = require('express')
const http = require('http')
const { Server } = require('socket.io')


const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: 'https://62ea70a679d64b0a138cddd0--tourmaline-bunny-fbf761.netlify.app',
        credentials: true,
        methods: ['GET', 'POST']
    },
    transports: ['websocket']
})

const users = require('./users')()
app.get('/', function (req, res) {
    res.send('<h1> Hello </h1>')
})

const m = (name, text, id) => ({ name, text, id })
io.on('connection', (socket) => {

    socket.on('userJoined', (data, cb) => {
        if (!data.name) return cb('Данные не валидны!')
        users.remove(socket.id)
        users.add({
            id: socket.id,
            name: data.name
        })
        cb({ userId: socket.id })
        io.emit('updateUsers', users)

        socket.emit('newMessage', m('admin', `Добро пожаловать ${data.name}!`))
        socket.broadcast.emit('newMessage', m('admin', `Пользователь ${data.name} зашёл в чат!`))
    })

    socket.on('userLeft', (id, cb) => {
        const user = users.remove(id)
        if (user) {
            io.emit('newMessage', m('admin', `Пользователь ${user.name} покинул чат!`))
        }
        cb()
    })

    socket.on('disconnect', () => {
        const user = users.remove(socket.id)
        if (user) {
            io.emit('newMessage', m('admin', `Пользователь ${user.name} покинул чат!`))
        }
        io.emit('updateUsers', users)
    })

    socket.on('createMessage', (data, cb) => {
        if (!data.text) {
            return cb('Текст не может быть пустым')
        }
        const user = users.get(data.id)
        io.emit('newMessage', m(user.name, data.text, data.id))
        cb()
    })


})

const port =  process.env.PORT || 3000;

server.listen(port, () => {
    console.log('Chat server is rinning')
})