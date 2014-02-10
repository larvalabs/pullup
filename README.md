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

# Register a new application on GitHub (https://github.com/settings/applications) 
# Now that you have your application setup you can set the following environment variables:

export GITHUB_CLIENTID='CLIENTID'
export GITHUB_SECRET='SECRET'
```

Once those are set you can run the local development version:

    node app.js


Lots more technical details [here](https://github.com/larvalabs/pullup/blob/master/hackathon-starter-readme.md).

Pullup Dev Community
--------------------

On Freenode IRC @ #pullup

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
