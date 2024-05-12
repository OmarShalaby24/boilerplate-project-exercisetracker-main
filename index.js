const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const bodyParser = require('body-parser');


mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true, useUnifiedTopology: true });
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String
});

const User = mongoose.model('User', userSchema);

const exerciseSchema = new Schema({
  user_id: {type: String, required: true},
  description: String,
  duration: Number,
  date: Date,
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.json());
app.use(express.urlencoded({extended: true}));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  const {username} = req.body;
  var userObj = new User({username: username});
  try{
    const user = await userObj.save();
    res.json(user);
  }catch(err){
    console.log(err);
  }
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const {_id} = req.params;
  const {description, duration, date} = req.body;
  var d = new Date(date);
  if(d.toDateString() === "Invalid Date") d = new Date();
  try{
    const exerciseObj = new Exercise({user_id: _id, description, duration, date: d});
    exerciseObj.save();
    const user = await User.findById({_id});
    res.json({
      _id,
      username: user.username,
      date: d.toDateString(),
      duration: parseInt(duration),
      description
    });
  }catch(err){
    console.log(err);
  }
});

app.get('/api/users', async (req, res) => {
  const users = await User.find({});
  res.json(users);
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const {from, to, limit} = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if(!user){
    return res.send("Couldn't find the user");
  }
  let dateObj = {};
  if(from){
    dateObj["$gte"] = new Date(from);
  }
  if(to){
    dateObj["$lte"] = new Date(to);
  }
  let filter = {
    user_id: id
  }
  if(from || to){
    filter.date = dateObj;
  }

  const exercises = await Exercise.find(filter).limit(+limit ?? 500)

  const log = exercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }));
  const result = {
    _id: id,
    username: user.username,
    count: exercises.length,
    log: log
  }
  return res.send(result);
  

});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
