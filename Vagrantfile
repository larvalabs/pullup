# -*- mode: ruby -*-
# vi: set ft=ruby :

CUSTOM_CONFIG = {
                  "BOX_NAME"  =>  "precise64", 
                  "BOX_URL"   =>  "http://files.vagrantup.com/precise64.box", 
                  "HEADLESS"  =>  false
                }

Vagrant.configure("2") do |config|
  # Change this to the name of your Vagrant base box.
  config.vm.box = CUSTOM_CONFIG['BOX_NAME']

  # Change this to a URL from which the base box can be downloaded, if you like.
  config.vm.box_url = CUSTOM_CONFIG['BOX_URL']

  # we will run node.js on port 3000
  config.vm.network :forwarded_port, guest: 3000, host: 3000

  # headless?  uncomment this to have the VM's window available
  config.vm.provider :virtualbox do |vb|
    vb.gui = CUSTOM_CONFIG['HEADLESS']
  end

  # forward SSH keys
  config.ssh.forward_agent = true

  if (/cygwin|mswin|mingw|bccwin|wince|emx/ =~ RUBY_PLATFORM)
    # provisioning with ansible on windows
    config.vm.provision "shell", path: "./vagrant/ansible-windows.sh"
  else
    # provisioning with ansible
    config.vm.provision :ansible do |ansible|
      ansible.playbook = "./vagrant/playbook.yml"
    end
  end 
end
