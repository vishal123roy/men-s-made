const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const user_Route = require('./routes/userRoute'); 
const admin_Route = require('./routes/adminRoute');
const nocache = require('nocache');

const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = 4200;
require('dotenv').config()
app.use(nocache());

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((err) => {
    console.error('Failed to connect to MongoDB', err);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/admin',express.static(path.join(__dirname, 'public')))
app.use('/', express.static(path.join(__dirname, 'public')));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/', user_Route);
app.use('/admin', admin_Route);
app.use('*',(req,res)=>{
    res.render('user/404');
})
app.all('*',(req,res,next)=>{
    res.redirect('/error500')
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
