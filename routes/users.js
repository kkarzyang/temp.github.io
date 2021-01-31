const express=require('express');
const router = express.Router();
const User = require('../models/user');
const passport = require('passport');
const cookieSession = require('cookie-session');
const catchAsync=require('../models/user');

router.get('/register',(req ,res) => {
    res.render('users/register');
})

router.post('/register',async(req,res,next) => {
    const { email,username,password } = req.body;
    const user = new User({email,username});
    const registerUser=await User.register(user,password);
    req.login(registerUser ,err =>{
        if (err) return next(err);
        res.redirect('/campgrounds');
    });
    res.redirect('registe');
})


router.get('/login', (req, res) => {

    res.render('users/login');
})

router.post('/login', passport.authenticate('local', { failureRedirect: '/login' }),(req, res) => {
    res.redirect('campgrounds');


})


module.exports=router;