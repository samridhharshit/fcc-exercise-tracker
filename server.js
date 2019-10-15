const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')
require('dotenv').config()

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true
 }).then(() => {
  console.log('MongoDB connected.')
}).catch(err => console.log(err))  

require('./Schemas')
const User = mongoose.model('User')
const Exercise = mongoose.model('Exercise')

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Task 1
app.post('/api/exercise/new-user', (req, res) => {
  const newUser = {
    username: req.body.username,
  }
  new User(newUser)
    .save()
    .then(user => {
      res.json({
        username: user.username,
        _id: user._id
      })
    })
})

// Task 2
app.get('/api/exercise/users', (req, res) => {
  User
    .find({})
    .select("username")
    .then(user => {
      res.json(user)
    })
});

// Task 3
app.post('/api/exercise/add', (req, res) => {
  const exercise = {
    user: req.body.userId,
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date ? new Date(req.body.date).toDateString() : new Date(Date.now()).toDateString()
  }
  new Exercise(exercise)
  .save()
  .then(e => {
    User
      .findOneAndUpdate(
        {_id: req.body.userId},
        {$push: {exercises: e}}
      )
      .exec()
      .then(u => {
        res.json({
          username: u.username,
          description: e.description,
          duration: e.duration,
          _id: e.user,
          date: e.date
        })
    })
  })
})

// Prethodni task (br. 3) je primer kako moze da se uradi query bez da se radi populate()

// Doda se novi Exercise, onda se na osnovu userId-a (koji je unesen u formi), pronadje medju Users taj koji nam treba, i uzmemo njegov username

// U ovom slucaju nije neophodno da se svaki novi Exercise push-uje kod User-a, ali je ok da bi baza bila konzistentna



// Tasks 4 and 5
app.get('/api/exercise/log', (req, res) => {
  const obj = {
    user: req.query.userId,
  }
  let date = {}
  if (req.query.from && req.query.to) {
    date["$gt"] = req.query.from
    date["$lt"] = req.query.to
    obj.date = date
  } 
  else if (req.query.from) {
    date["$gt"] = req.query.from
    obj.date = date
  }
  else if (req.query.to) {
    date["$lt"] = req.query.to
    obj.date = date
  }
  Exercise
    .find(obj)
    .limit(parseInt(req.query.limit))
    .populate({
      path: 'user',
      select: 'username'
    })
    .select("description duration date")
    .then(exercises => {
      const obj = {
        _id: req.query.userId,
        count: exercises.length,
        from: req.query.from,
        to: req.query.to,
        log: []
      }
      res.json(
        exercises.length != 0 
        ? {
          ...obj,
          username: exercises[0].user.username,
          log: exercises.map((e) => {
            return {
              description: e.description,
              duration: e.duration,
              date: e.date
            }
          })
        } 
        : obj
        )
    }).catch(err => console.error(err))
})

// Prethodni taskovi (br. 4 i 5) su primer kako moze da se uradi query pomocu populate()

// Trazimo Exercises koji zadovoljavaju zadate parametre, onda uradimo populate() i u atribut user unesemo ceo sadrzaj odredjenog User-a sa kojim su nase Exercises povezane (preko userId-a)

// Nama je bio potreban samo username, tako da nije bilo neophodno da se radi preko populate(), vec smo mogli kao i u tasku 3, da uradimo User.find() i tako nadjemo User-a koji ima zadati userId, uzmemo njegov _id, i stavimo ga u response zajedno sa nizom Exercises koje smo vec pre toga nasli

// Ceo zadatak je mogao da se uradi bez refs, pomocu dve nezavisne sheme User i Exercise, bilo bi dovoljno samo da se u ExerciseSchema nalazi atribut user koji bi sadrzao _id odredjenog User-a



// za glitch mora da bude process.env.PORT ili 3000
const listener = app.listen(3001, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
