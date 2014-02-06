PullUp
======
A website you join via pull request. See it live at http://pullup.herokuapp.com

What would it be like if every user of a site had contributed some code? Let's find out! Right now the site is little more
than a terrible Hacker News type thing, but let's see if it can grow into something more.

How to join
-----------

Summary:
- Fork and set up project for development (see below)
- Add a feature, fix a bug, improve the design, etc.
- Add your GitHub username to the [authorized users list](https://github.com/larvalabs/pullup/blob/master/config/userlist.js).
- Submit a pull request! When we merge, you'll be allowed to log in.

Development Setup
---------------

Prerequisites: node and mongo.

```bash
# Fetch only the latest commits.
git clone git@github.com:larvalabs/pullup.git

cd pullup

# Install NPM dependencies
npm install

node app.js
```

To log in to your development instance you'll need to create a GitHub application and set the following environment variables:

```bash
export GITHUB_CLIENTID='CLIENTID'
export GITHUB_SECRET='SECRET'
```

Lots more technical details [here](https://github.com/larvalabs/pullup/blob/master/hackathon-starter-readme.md).

Credits
-------

This project is based on the awesome [Hackathon Starter project](https://github.com/sahat/hackathon-starter). Thanks @sahat!