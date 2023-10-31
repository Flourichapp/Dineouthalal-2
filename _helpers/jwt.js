const expressJwt = require('express-jwt');
const {jwt_secret} = require('../env')

module.exports = jwt;

function jwt() {
    const { secret } = {secret: jwt_secret};
    return expressJwt({ secret, algorithms: ['HS256'] }).unless({
        path: [
            // public routes that don't require authentication
            '/v1/auth/login',
            '/v1/auth/register',
            '/v1/auth/forgotpassword',
            '/v2/auth/login',
            '/v2/auth/forgotpassword',
            '/v2/auth/register',
            '/admin/auth/login',
            '/v3/getsearchdata',
            '/v3/getrestdata',
            '/v3/savebooking',
            '/v3/getlangingpagedata',
            '/v3/registerSubscriber',
            '/v3/blogs',
            '/v3/blogs/featured',
            '/v3/restaurants',
            '/admin/v0/getcuisinecategory',
            '/admin/v0/getsettingdata/',
            '/v3/getblogs',
            '/v3/booking',
            '/v3/contact',
            '/v3/getsinglemetadata',
            '/v1/payment/stripe/webhook',
            '/v1/gettransactions/:id',
           '/v2/ambassador',
           '/v1/subscriptionPackage',
           '/admin/auth/logout'
           
        ]
    });
}
