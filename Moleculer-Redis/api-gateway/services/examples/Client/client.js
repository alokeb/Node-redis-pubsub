const io = require('socket.io-client')
const socket = io('http://localhost:3001')
socket.emit('call', 'math.add', { a: 123, b: 456},
function(err, res) {
  if (err) {
    console.error(err)
  } else {
    console.log('call success:', res)
  }
})