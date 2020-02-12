var foods = [];
var blobs = [];

function Blob(id, x, y, r) {
  this.id = id;
  this.x = x;
  this.y = y;
  this.r = r;
}

function Food(x, y, r) {
  this.x = x;
  this.y = y;
  this.r = r;
}

// const express = require('express');
// const app = express();
// const server = app.listen(3000);

// app.use(express.static('public'));

// console.log('my socket server is running');

// const socket = require('socket.io');
// const abcd = socket(server);

const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const server = require('http').createServer(app);
const io = require('socket.io')(server);
const config = require('./config/key');

setInterval(heartbeat, 33);
function heartbeat() {
  io.sockets.emit('heartbeat', blobs, foods);
}

// const mongoose = require("mongoose");
// mongoose
//   .connect(config.mongoURI, { useNewUrlParser: true })
//   .then(() => console.log("DB connected"))
//   .catch(err => console.error(err));

const { Chat } = require('./models/Chat');

const mongoose = require('mongoose');
const connect = mongoose
  .connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use('/api/users', require('./routes/users'));
app.use('/api/chat', require('./routes/chat'));

io.on('connection', socket => {
  socket.on('Input Chat Message', msg => {
    connect.then(db => {
      try {
        let chat = new Chat({
          message: msg.chatMessage,
          sender: msg.userId,
          type: msg.type
        });

        chat.save((err, doc) => {
          if (err) return res.json({ success: false, err });

          Chat.find({ _id: doc._id })
            .populate('sender')
            .exec((err, doc) => {
              return io.emit('Output Chat Message', doc);
            });
        });
      } catch (error) {
        console.error(error);
      }
    });
  });

  socket.on('start', function(data) {
    var blob = new Blob(socket.id, data.x, data.y, data.r);
    blobs.push(blob);
  });

  socket.on('initFood', function(dataF) {
    var food = new Food(dataF.x, dataF.y, dataF.r);
    foods.push(food);
  });

  socket.on('update', function(data, data2) {
    var blob;
    for (var i = 0; i < blobs.length; i++) {
      if (socket.id == blobs[i].id) {
        blob = blobs[i];
      }
    }

    blob.x = data.x;
    blob.y = data.y;
    blob.r = data.r;

    if (data2 != null) {
      foods.splice(data2, 1);
      data2 = null;
    }
  });

  socket.on('disconnect', function() {
    var elementPos = blobs
      .map(function(x) {
        return x.id;
      })
      .indexOf(socket.id);
    console.log('Client has disconnected' + socket.id);
    if (elementPos > -1) {
      blobs.splice(elementPos, 1);
      console.log(blobs);
    }
  });
});

//use this to show the image you have in node js server to client (react js)
//https://stackoverflow.com/questions/48914987/send-image-path-from-node-js-express-server-to-react-client
app.use('/uploads', express.static('uploads'));

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  // index.html for all page routes
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
}

const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log(`Server Running at ${port}`);
});
