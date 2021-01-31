if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const Campground = require('./models/campground');
const Review=require('./models/review');
const catchAsync = require('./utils/catchAsync');
const passport = require('passport');
const localStrategy = require('passport-local');
const User = require('./models/user');
const { isLoggedIn} = require('./middleware')
const flash=require('flash-express');
const userRoutes = require('./routes/users');
const mongoSanitize = require('express-mongo-sanitize');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

//const dbUrl = process.env.DB_URL;
//'mongodb://localhost:27017/yelp-camp'
//flZaQ1S61tPkfJ2U

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp'
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(flash());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));

const store=new MongoStore({
    
    url:dbUrl,
    //secret: 'ss',
    touchAfter: 24 * 60 * 60
});


store.on("error",function(e){
    console.log(e);
})


/*const sessionConfig={
    store,
    name: 'session',
    secret: "aa",
    resave:false,
    saveUninitialized : true
}*/
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use('/',userRoutes);

app.get('/', (req, res) => {
    res.render('home')
});
app.get('/campgrounds', async (req, res) => {
    const campgrounds = await Campground.find({});

    res.render('campgrounds/index', { campgrounds })
});
app.get('/campgrounds/new', isLoggedIn,(req, res) => {
    res.render('/campgrounds/new');
})

app.post('/campgrounds', async (req, res) => {
    const campground = new Campground(req.body.campground);
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`)
})

app.get('/campgrounds/:id', async (req, res,) => {
    const campground = await Campground.findById(req.params.id).populate('reviews');
    res.render('campgrounds/show', { campground });
});

app.get('/campgrounds/:id/edit', async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    res.render('campgrounds/edit', { campground });
})

app.put('/campgrounds/:id', async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    res.redirect(`/campgrounds/${campground._id}`)
});

app.delete('/campgrounds/:id', async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
})

app.post('/campgrounds/:id/reviews', async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    console.log(req.body.review);
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
});

app.delete('/campgrounds/:id/reviews/:reviewId', catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/campgrounds/${id}`);
}))

const port =process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`)
})