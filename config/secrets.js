module.exports = {
  db: process.env.MONGOHQ_URL || 'localhost',

  sendgrid: {
    user: 'Your SendGrid Username',
    password: 'Your SendGrid Password'
  },

  nyt: {
    key: 'Your New York Times API Key'
  },

  lastfm: {
    api_key: 'Your API Key',
    secret: 'Your API Secret'
  },

  facebook: {
    clientID: 'Your App ID',
    clientSecret: 'Your App Secret',
    callbackURL: '/auth/facebook/callback',
    passReqToCallback: true
  },

  github: {
    clientID: process.env.GITHUB_CLIENTID || 'none',
    clientSecret: process.env.GITHUB_SECRET || 'none',
    callbackURL: process.env.GITHUB_CALLBACK ||  '/auth/github/callback',
    passReqToCallback: true
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
  },

  tumblr: {
    consumerKey: 'Your Consumer Key',
    consumerSecret: 'Your Consumer Secret',
    callbackURL: '/auth/tumblr/callback'
  },

  foursquare: {
    clientId: 'Your Client ID',
    clientSecret: 'Your Client Secret',
    redirectUrl: 'http://localhost:3000/auth/foursquare/callback'
  },

  paypal: {
    host: 'api.sandbox.paypal.com', // or api.paypal.com
    client_id: 'Your Client ID',
    client_secret: 'Your Client Secret',
    returnUrl: 'http://localhost:3000/api/paypal/success',
    cancelUrl: 'http://localhost:3000/api/paypal/cancel'
  },
  
  reddit: {
    clientID: process.env.REDDIT_CLIENTID || 'none',
    clientSecret: process.env.REDDIT_CLIENTSECRET || 'none',
    callbackURL: process.env.REDDIT_CALLBACKURL || 'http://localhost:3000/auth/reddit/callback',
    passReqToCallback: true
  }
};
