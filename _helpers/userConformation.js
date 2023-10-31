var ejs = require("ejs");
const path = require("path");
const { transporter } = require("../_helpers/email");
// const bodyParser = require("body-parser");
// const nodemailer = require("nodemailer");
// var smtpTransport = require("nodemailer-smtp-transport");
// const { error } = require("console");
const {site_url} = require(".././env")
module.exports.userConformationEmail = async (
  userinfo,
  message,
  BookTimedetails,
  newEndTime,
  booking_id
) => {
  let templatePath;
  if (message == "confirmed") {
    templatePath = path.join(__dirname, "../views/email/conformation.ejs");
  } else {
    if (message == "rejected") {
      templatePath = path.join(__dirname, "../views/email/rejected.ejs");
    }
  }
  // console.log(userinfo)
  //   console.log(x)
  let replaceTimeDots = BookTimedetails[3].replace(":", "");
  BookTimedetails[3] = replaceTimeDots;
  let options = {
    bookingUrl:`${site_url}/profile/booking/?id=${booking_id}`,
    mapsurl:`https://www.google.com/maps/search/?api=1&query=${userinfo[0].lat}%2C${userinfo[0].lng}`,
    userinfo: userinfo[0],
    message: message,
    Bookday: BookTimedetails[0],
    Bookmonth: BookTimedetails[1],
    bookdate: BookTimedetails[2],
    bookingTime: BookTimedetails[3],
    bookingTimeto: newEndTime,
    booking_id:booking_id
  };
  const data = await ejs.renderFile(templatePath, { options });

  const mailOptions = {
    from: "hello@dineouthalal.com",
    to: userinfo[0].email,
    subject: `booking ${message}`,
    html: data,
  };
  (() => {
    const result = transporter
      .sendMail(mailOptions)
      .then(console.log)
      .catch(console.error);

    // do something with `result` if needed
  })();
};
// const mailOptions = {
//     from: 'test_emails@digitli.com',
//      to: email,
//      subject:"booking confirmation",
//      html: data,
// };
