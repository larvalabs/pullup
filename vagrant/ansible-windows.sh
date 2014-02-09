echo "Installing/Updating Ansible..."
apt-get update -qq && apt-get install ansible -y -qq
COUNT_HOSTS=`grep \\\[precise64\\\] /etc/ansible/hosts -c`
if [ $COUNT_HOSTS -lt 1 ]; then
	printf "\n[precise64] \n127.0.0.1 ansible_connection=local\n" >> /etc/ansible/hosts
fi
echo "Running Ansible playbook..."
ansible-playbook /vagrant/vagrant/playbook.yml