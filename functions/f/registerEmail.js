const functions = require('firebase-functions');
const fe = require("firebase-encode");
const nodemailer = require('nodemailer');
const gmailEmail = encodeURIComponent(functions.config().gmail.email);
const gmailPassword = encodeURIComponent(functions.config().gmail.password);
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/
const mailTransport = nodemailer.createTransport(
    `smtps://${gmailEmail}:${gmailPassword}@smtp.gmail.com`);

exports.handler = function(req, res, admin) {
  const user_email = req.query.user_email;
  const hostUrl = functions.config().num.host;

  // TODO:  Validate fields

  data = {
    user_email: user_email,
    user_name: req.query.user_name,
    user_rut: req.query.user_rut,
    bank_name: req.query.bank_name,
    account_type: req.query.account_type,
    account_number: req.query.account_number
  }
  if (req.query.short_url !== null) {
    data["username"] = req.query.short_url;
  }

  const sendValidationEmail = (snap) => {
    // https://github.com/firebase/functions-samples/tree/master/email-confirmation
    const mailOptions = {
      from: `"Num.cl" <${functions.config().gmail.email}>`,
      to: user_email,
      subject: '[Num.cl] Valida tu email :)'
    };
    mailOptions.text = 'Para validar tu mail visita este link: '
      + `${hostUrl}/function/validate_email?`
      + 'user_email=' + fe.encode(user_email)
      + '&'
      + 'token=' + snap.key;
    mailTransport.sendMail(mailOptions).then(() => {
      res.redirect(303, `${hostUrl}/validation-pending.html`);
      return;
    }).catch(error => {
      console.error('There was an error while sending the email:', error);
      res.status(500).send('Error :c');
    });
  }

  const registerUser = () => {
    var registration = admin.database().ref('/pending/' + fe.encode(user_email)).push(
      data
    ).then(snap => {
      sendValidationEmail(snap);
      return;
    });
  }

  admin.database().ref(`/user/by_username/${data.username}`)
    .once('value').then(snap => {
      if (snap.val() !== null) {
        res.status(409).send(`La url num.cl/${data.username} ya está tomada :( Por favor prueba con otra url`);
      } else {
        registerUser();
      }
      return;
    }
  ).catch(err => res.status(500).send(err));
};
