const repl = require('repl')
const { Client } = require('ssh2')
const dotenv = require('dotenv')
dotenv.config()

const {
  SSH_HOST,
  SSH_PORT,
  SSH_USER,
  SSH_KEY
} = process.env

const status = {
  onReady: false,
  reconnectTimer: null
}


const connect = () => {
  if (status.onReady) {
    clearInterval(status.reconnectTimer)
    return false
  }
  conn.connect({
    host: SSH_HOST,
    port: SSH_PORT,
    username: SSH_USER, 
    privateKey: require('fs').readFileSync(SSH_KEY) 
  })
}

const conn = new Client()
conn.on('ready', function() {
  console.log('Connected')
  status.onReady = true
})
conn.on('close', function() {
  console.log('Disconnect')
  status.onReady = false
  status.reconnectTimer = setInterval(() => {
    connect()
  }, 3000)
})

conn.on('error', function() {
  console.log('Connection Error')
  status.onReady = false
  status.reconnectTimer = setInterval(() => {
    connect()
  }, 3000)
})

connect()

repl.start({
  prompt: '> ',
  eval: (cmd, context, filename, callback) => {
    
    conn.exec(cmd, function(err, stream) {
      if (err) throw err;
      stream.on('close', function(code, signal) {
        console.log('Stream :: close :: code: ' + code + ', signal: ' + signal)
        // conn.end();
        callback(null, 'end')
      }).on('data', function(data) {
        console.log('STDOUT: ' + data)
      }).stderr.on('data', function(data) {
        console.log('STDERR: ' + data)
      })
    })
  }
})