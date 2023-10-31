const { transporter } = require("../_helpers/email");
const { makeDb } = require("./db");
const { JWT_EMAIL_OTP_SECRET_KEY, STRIPE_SECRET } = require("../env");
const stripeCustomerUpdate = require("../_helpers/stripeFunctions");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const stripe = require("stripe")(STRIPE_SECRET);
var ejs = require("ejs");
const path = require("path");
module.exports.optsend = async (req, res) => {
  let { email } = req.body;
  if (email || email != null) {
    const templatePath = path.join(__dirname, "../views/email/otp.ejs");
   
   
    var sixDigitOtp = Math.floor(Math.random() * 900000) + 100000;
    let options = {
      otpcode: `${sixDigitOtp}`,
    };
    const templateData = await ejs.renderFile(templatePath, { options });
    const mailOptions = {
      from: "hello@dineouthalal.com",
      to: email,
      subject: `Dineout halal otp`,
      html: templateData,
    };
    (() => {
      const result = transporter
        .sendMail(mailOptions)
        .then(console.log)
        .catch(console.error);

      // do something with `result` if needed
    })();
    let jwtSecretKey = JWT_EMAIL_OTP_SECRET_KEY;
    let data = {
      email,
      sixDigitOtp,
    };

    const token = jwt.sign(data, jwtSecretKey,{ expiresIn: '1d'});
    res.status(200).json({
      statusCode: 200,
      message: "Otp send successfully !",
      token: token,
    });
  }
};
// const stripeUpdate = async () =>{
//   const customer =  await stripe.customers.update(
//     'cus_OgU0ZZNO3OJgXS',

//     {email:"anas@gmail.com"}
//   );
//    console.log(customer)
// }
module.exports.emailverification = async (req, res) => {
  const { id, email, code, token, role } = req.body;

  if (id && code && token && role) {
    jwt.verify(
      token,
      JWT_EMAIL_OTP_SECRET_KEY,
      (err, decode) => {
        if (err) {
          console.log(err);
          return res.json({
            statusCode: 400,
            message: "Invalid Token !",
          });
        } else {
          let jwtemail = decode.email;
          let jwtCode = decode.sixDigitOtp;
          if (jwtemail == email && jwtCode == code) {
            if (role == "restaurant") {
              const connection = makeDb();
              connection.query(
                `UPDATE restaurants_admin SET email = ? where id = ?`,
                [jwtemail, id]
              );
              stripeCustomerUpdate(id, email);
              connection.close();
              // axios.post('https://api.stripe.com/v1/cusomters/:cus_OgU0ZZNO3OJgXS',{
              // })
            } else if (role == "user") {
              const connection = makeDb();
              connection.query(`UPDATE customers SET email = ? where id = ?`, [
                jwtemail,
                id,
              ]);
              connection.close();
            }
            return res.status(200).json({
              statusCode: 200,
              message: "Verfication succeded",
            });
          } else {
            return res.status(200).json({
              statusCode: 200,
              message: "Invalid Code",
            });
          }
        }
      }
    );
  }
};
