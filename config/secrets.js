module.exports = {
  db: process.env.MONGOHQ_URL || 'localhost',

  sendgrid: {
    user: 'Your SendGrid Username',
    password: 'Your SendGrid Password'
  },

  facebook: {
    clientID: 'Your App ID',
    clientSecret: 'Your App Secret',
    callbackURL: '/auth/facebook/callback',
    passReqToCallback: true
  },

  github: {
    clientID: process.env.GITHUB_CLIENTID,
    clientSecret: process.env.GITHUB_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK ||  '/auth/github/callback',
    scope: ['public_repo'],
    passReqToCallback: true
  },

  heroku: {
    email: process.env.HEROKU_EMAIL || false,
    authToken: process.env.HEROKU_AUTH_TOKEN || false,
    app: process.env.HEROKU_APP || false
  },

  twitter: {
    consumerKey: 'Your Consumer Key',
    consumerSecret: 'Your Consumer Secret',
    callbackURL: '/auth/twitter/callback',
    passReqToCallback: true
  },

  google: {
    clientID: 'Your Client ID',
    clientSecret: 'Your Client Secret',
    callbackURL: '/auth/google/callback',
    passReqToCallback: true
  }
};
