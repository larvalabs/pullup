PullUp [![Build Status](https://travis-ci.org/larvalabs/pullup.svg?branch=master)](https://travis-ci.org/larvalabs/pullup) [![Code Climate](https://codeclimate.com/repos/52fba7f66956805f68002062/badges/b1a62e6c14008de1ff3c/gpa.svg)](https://codeclimate.com/repos/52fba7f66956805f68002062/feed) [![Gitter chat](https://badges.gitter.im/larvalabs/pullup.png)](https://gitter.im/larvalabs/pullup)
======

A website you join via pull request.

What would it be like if every user of a site had contributed some code? Let's find out! Right now the site is little more
than a terrible Hacker News type thing, but let's see if it can grow into something more.

How to join
-----------

Summary:
- Fork and set up project for development (see below)
- Add your GitHub username to the [authorized users list](https://github.com/larvalabs/pullup/blob/master/config/userlist.js).
- Add a feature, fix a bug, improve the design, etc.
- Submit a pull request! When we merge, you'll be allowed to log in.

Development Setup
---------------

Prerequisites: [Node.js](http://nodejs.org/) and [MongoDB](http://mongodb.org/).

First, [register a new developer application on GitHub](https://github.com/settings/applications/new). Set the **Homepage URL** to your development server (example: `http://localhost:3000`) and set your **Authorization callback URL** to `http://localhost:3000/auth/github/callback`. Take note of the **Client ID** and **Client Secret**, as you will need them in the next steps.

```bash
# Fetch only the latest commits.
git clone git@github.com:larvalabs/pullup.git

cd pullup

# Install NPM dependencies
npm install
npm install -g gulp

# Set the following environment variables:

export GITHUB_CLIENTID=CLIENTID
export GITHUB_SECRET=SECRET

# Or, on Windows...

SET GITHUB_CLIENTID=CLIENTID
SET GITHUB_SECRET=SECRET
```

Once those are set you can run the local development version:

    node app.js

Or start the app with [foreman](https://github.com/ddollar/foreman):

    foreman start -f Procfile.local

And perform build tasks and linting with:

    gulp


You can find out more technical details in the [Readme for Hackathon Starter](https://github.com/larvalabs/pullup/blob/master/hackathon-starter-readme.md).

Seeding The Database
--------------------

Firstly make sure you have installed ```grunt-cli``` globally.

```bash
npm install -g grunt-cli
```

Once this has installed you can seed the database by running the following grunt task.

```bash
grunt db-seed
```

You may also wish to completely clear down the database, you can do so by running the ```db-clear``` task.

```bash
grunt db-clear
```

Pullup Dev Community
--------------------

We hang out on [Gitter](https://gitter.im/larvalabs/pullup)

Using the Vagrant-based Development Environment
-----------------------

You'll need [VirtualBox](https://www.virtualbox.org/wiki/Downloads), [Vagrant](http://www.vagrantup.com/downloads.html), and [Ansible](https://devopsu.com/guides/ansible-mac-osx.html) installed to use this environment.

**Note**: Windows users do not need Ansible installed. (A script will run and install Ansible on the guest machine for you)

Update the GitHub environment variables in `vagrant/tasks/setup_app.yml`

Fire up the Vagrant VM:

	vagrant up

Ensure Ansible has run successfully and provisioned the boxes.  If not, try again using `vagrant provision`

Then, ssh in and follow the installation steps:

	vagrant ssh
	cd /vagrant/
	npm install
	node app.js

#### Vagrant Development on a Windows Host
Windows lacks support for symlinks in synced folders. Use `npm install --no-bin-links` instead of `npm install` when installing.

Credits
-------

This project is based on the awesome [Hackathon Starter project](https://github.com/sahat/hackathon-starter). Thanks @sahat!
