const { smtp } = require('../env');
// var hbs = require('nodemailer-express-handlebars');
// const path = require('path');
const nodemailer = require('nodemailer');
// var smtpTransport = require('nodemailer-smtp-transport');
// var transport = nodemailer.createTransport(smtpTransport({
//   service: 'smtp.ethereal.email',
//   auth: {
//     user: gmail.USER_NAME,
//     pass: gmail.USER_PASSWORD
//   }
// }));


//  GmailTransport = nodemailer.createTransport({
//   service: gmail.SERVICE_NAME,
//   host: gmail.SERVICE_HOST,
//   secure: gmail.SERVICE_SECURE,
//   port: gmail.SERVICE_PORT,
//   auth: {
//     user: gmail.USER_NAME,
//     pass: gmail.USER_PASSWORD
//   }
// });

let transporter = nodemailer.createTransport({
  host: smtp.SERVICE_HOST,
  port: smtp.SERVICE_PORT,
  secure: smtp.SERVICE_SECURE, // upgrade later with STARTTLS
  // debug: true,
  auth: {
    user: smtp.USER_NAME,
    pass: smtp.USER_PASSWORD
  }
});

ViewOption = (transport, hbs) => {
  transport.use('compile', hbs({
    viewPath: __dirname+'/views/email',
    extName: '.hbs'
  }));
}

// module.exports.sendApproveCode = (from, to, code, name, email, address) => {
//   (GmailTransport);

//   let HelperOptions = {
//     from: from,
//     to: to,
//     subject: 'Hellow world!',
//     template: 'approvecode',
//     context: {
//       name: "tariqul_islam",
//       email: "test_emails@digitli.com",
//       address: "52, Kadamtola Shubag dhaka",
//     }
//   };
//   console.log(from,to)
//   GmailTransport.sendMail(HelperOptions, (error, info) => {
//     if (error) {
//       console.log(error);
//       // res.json(error);
//     }
//     console.log("email is send");
//     console.log(info);
//     //   res.json(info)
//   });
// }
  // send mail with defined transport object
  // let info = await transporter.sendMail({
  //   from: '"Fred Foo 👻" <foo@example.com>', // sender address
  //   to: "anasafzal", // list of receivers
  //   subject: "Hello ✔", // Subject line
  //   text: "Hello world?", // plain text body
  //   html: "<b>Hello world?</b>", // html body
  // });
//   transporter.verify((error, success) => {
//     if (error) {
//       console.log(error);
    
//       //   res.json({output: 'error', message: error})
//       //   res.end();
//     } else {
//       transporter.sendMail((error, info) => {
//         console.log("Email has been sent")
//     //     if(error) {
//     //       res.json({output: 'error', message: error})
//     //     }
//     //     res.json({output: 'success', message: info});
//     //     res.end();
//     //   });
//     // }
//   })}
  
// })
// module.exports.sendApproveCodeSMTP = (from, to, code, name, email, address) => {
 
//   // from: '"Tariqul islam" <tariqul@falconfitbd.com>',
//   // to: 'tariqul.islam.rony@gmail.com',

//   let HelperOptions = {
//     from: from,
//     to: to,
//     subject: 'Hellow world!',
//     template: 'test',
//     context: {
//       name: "Digitli",
//       email: "test_emails@digitli.com",
//       address: "52, Kadamtola Shubag dhaka"
//     }
//   };
//   SMTPTransport.verify((error, success) => {
//     if (error) {
//       console.log(error);
    
//       //   res.json({output: 'error', message: error})
//       //   res.end();
//     } else {
//       SMTPTransport.sendMail(HelperOptions, (error, info) => {
//         console.log(HelperOptions)
//     //     if(error) {
//     //       res.json({output: 'error', message: error})
//     //     }
//     //     res.json({output: 'success', message: info});
//     //     res.end();
//     //   });
//     // }
//   })}
//   })


// // module.exports.main = (async () => {
// //   // Generate test SMTP service account from ethereal.email
// //   // Only needed if you don't have a real mail account for testing
// //   let testAccount = await nodemailer.createTestAccount();

// //   // create reusable transporter object using the default SMTP transport
// //   let transporter = nodemailer.createTransport({
// //     host: "smtp.ethereal.email",
// //     port: 587,
// //     secure: false, // true for 465, false for other ports
// //     auth: {
// //       user: testAccount.user, // generated ethereal user
// //       pass: testAccount.pass, // generated ethereal password
// //     },
// //   });

// //   // send mail with defined transport object
// //   let info = await transporter.sendMail({
// //     from: '"Fred Foo 👻" <foo@example.com>', // sender address
// //     to: "bar@example.com, baz@example.com", // list of receivers
// //     subject: "Hello ✔", // Subject line
// //     text: "Hello world?", // plain text body
// //     html: "<b>Hello world?</b>", // html body
// //   });

// //   console.log("Message sent: %s", info.messageId);
// //   // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

// //   // Preview only available when sending through an Ethereal account
// //   console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
// //   // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
// // })

// }
async function sendForgotPwdEmail (email, pwd) {
  // let testAccount = await nodemailer.createTestAccount();
  // let transport = nodemailer.createTransport({
  //   host: 'mail.digitli.com',
  //   port: 465,
  //   // secure: true, // true for 465, false for other ports
  //   auth: {
  //     user: 'test_emails@digitli.com',
  //     pass: 'test@1234**&'
  //   },
  // });
 

  // console.log("This is my email function working")
    let info =  transporter.sendMail({
      from: 'hello@dineouthalal.com',
      to: email,
      subject: 'Reset Password',
      html: '<p>Your new password:</p> ' + pwd
    });
  //  console.log(info.to)
    // console.log("Message sent: %s", info);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
  
    // Preview only available when sending through an Ethereal account
  //   console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info)
  //   // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  
  // )
}
module.exports = {transporter,sendForgotPwdEmail}