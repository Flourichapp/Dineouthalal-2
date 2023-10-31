module.exports = {

    jwt_secret:'my-flourich-app-Yj7PAqRxEyIydLb',
    db_host: 'localhost',
    port: 4000,
    // db_user: 'root',
    // db_pwd:'',
    // db_name:'halalfoods',
    site_url:'https://www.dineouthalal.com',


    db_user: 'liveUser',
    db_pwd:'DineoutHalal@2023**&',
    db_name:'halalfoods',

    
    facebook : {
        clientID: 'INSERT-CLIENT-ID-HERE',
        clientSecret: 'INSERT-CLIENT-SECRET-HERE',
        callbackURL: 'http://localhost:3000/auth/facebook/callback',
        profileFields: ['id', 'name', 'displayName', 'picture', 'email'],
    },
    google : {
        clientID: '480486651054-nl4a9102sg8o379st8nts3qmr5kv2c30.apps.googleusercontent.com',
        clientSecret: 'zajv66K53Yj7PAqRxEyIydLb',
        callbackURL: 'http://localhost:4000/api/auth/google/callback',
    },
    environment: "", // for the local 
    // environment: "dist", //for the server
    // gmail: {
    //     SERVICE_NAME: "gmail",
    //     SERVICE_HOST: "smtp.google.com",
    //     SERVICE_SECURE: true,
    //     SERVICE_PORT: 587,
    //     USER_NAME: "test_emails@digitli.com",
    //     USER_PASSWORD: "test@1234**&",
    // },
    smtp: {
        SERVICE_HOST: "smtp.office365.com",
        SERVICE_SECURE: false,
        SERVICE_PORT: 587,
        tls: {
            ciphers: "SSLv3",
            rejectUnauthorized: false,
            },
        USER_NAME: "hello@dineouthalal.com",
        USER_PASSWORD: "Whitegables2021*",
    },
    // STRIPE_KEY:'pk_test_oMg5DiV3yBBC1eB1bnmUVV2G003oMxvArL',
    // STRIPE_SECRET:'sk_test_b2wZzWjywE2nfKqNAPQBd11S00iBKRMQ2r'
    STRIPE_KEY:
    "pk_live_51NJEYvGKeEpgwLHPc16nUiFj7Dr99MfyZHh9fDOccTezrNpctCMlwLnR8JJeFuOcUX0QTg0sUhdZCuz2xyqzPZMA00oQ2HZT0l",
  STRIPE_SECRET:
    "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",
  TRIALDAYS: 180,
  JWT_EMAIL_OTP_SECRET_KEY:"Hellodineouthalalotpjwtcodex3f4"

};
