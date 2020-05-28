const express = require('express');
var path = require('path');

var io = require('socket.io')
({
    path: '/webrtc'
})

const app = express()
const port = 8080

// app.get('/', (req,res) => res.send('Hello World!!!!!'))
app.use(express.static(path.resolve(__dirname + '/../build')))
app.get('/', (req, res, next) => {
    res.sendFile(path.resolve(__dirname + '/../build/index.html'))
})

//https://expressjs.com/en/guide/writing-middleware.html
const server = app.listen(port, () => console.log('Example app listening on port 8080!'))

io.listen(server)

//https://www.tutorialspoint.com/socket.io/socket.io_namespaces.htm
const peers = io.of('webrtcPeer')

// keep a reference of all socket connection
let connectedPeers = new Map()

peers.on('connection', socket => {

    console.log(socket.id)
    socket.emit('connection-success', { success: socket.id })

    connectedPeers.set(socket.id, socket)

    socket.on('disconnect', () => {
        console.log('disconnected')
        connectedPeers.delete(socket.id)
    })

    socket.on('offerOrAnswer', (data) => {
        // send to the other peer(s) if any
        for (const [socketID, socket] of connectedPeers.entries()) {
            // don't send to self
            if (socketID !== data.socketID) {
              console.log(socketID, data.payload.type)
              socket.emit('offerOrAnswer', data.payload)
            }
          }
    })

    socket.on('candidata', (data) => {
        // send candidata to the other peer(s) if any
        for (const [socketID, socket] of connectedPeers.entries()) {
            //don't send to self
            if(socketID !== data.socketID) {
                console.log(socketID, data.payload.type)
                socket.emit('offerOrAnswer', data.payload)
            }
        }
    })

})