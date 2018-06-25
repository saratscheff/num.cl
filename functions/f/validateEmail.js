const functions = require('firebase-functions');
const encoder = require('./helper/encoder');

exports.handler = function(req, res, admin) {
  // link de validacion tipo: /validateEmail?user_email=mi@mail.cl&token=-Kasdafeigysdbg(token de firebase)
  const user_email = req.query.user_email;
  const token = req.query.token;
  const hostUrl = functions.config().num.host;

  var tokenRef = admin.database().ref(`/pending/${encoder.encode(user_email)}`).child(token);
  tokenRef.once('value').then(snapshot => {
    if (snapshot.val() !== null) {
      admin.database().ref(`/user/by_email/${encoder.encode(user_email)}`).set(snapshot.val());
      if (snapshot.val().username !== null) {
        admin.database().ref(`/user/by_username/${encoder.encode(snapshot.val().username)}`).set(snapshot.val().user_email);
      }
      tokenRef.remove();
      res.redirect(303, `${hostUrl}/${user_email}`);
    } else {
      res.status(500).send('Error :c');
    }
    return;
  }).catch(err => res.status(500).send(err));
};
