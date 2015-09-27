(ns awsint.core
  (:gen-class)
  (:require [amazonica.aws.ec2 :as ec2]))

(defn setup-instance [key-name group-id]
  "creates an instance with associated keyname and group-id"
  (ec2/run-instances :image-id "ami-e3106686" :min-count 1 :max-count 1
                     :instance-type "t2.micro" :key-name key-name
                     :security-group-ids [group-id]))

(defn setup-key [name]
  "create a key-pair with the given name"
  (let [key-pair (ec2/create-key-pair :key-name name)
        key-hash (get-in key-pair [:key-pair :key-material])
        key-path (str "/tmp/" name ".pem")]
    (spit key-path key-hash)
    key-path))

(defn setup-security-group [name]
  "creates a new security group and adds inbound rules for 80, 443, 22 ports"
  (let [{id :group-id} (ec2/create-security-group :group-name name :description name)
        get-perms  (fn [x] {:ip-ranges ["0.0.0.0/0"] 
                            :ip-protocol "tcp" :from-port x :to-port x})
        result (ec2/authorize-security-group-ingress 
                 :group-name name :ip-permissions (map get-perms '(80 443 22)))] 
    id))

(defn get-public-ip [instance-id]
  "gets the public ip of instance. Retries every 30 secs if not available"
  (let [meta-data (ec2/describe-instances :instance-id instance-id)
        instance (get-in meta-data [:reservations 0 :instances 0])
        {:keys [state public-dns-name]} instance]
    (if (= "stopped" (:name state)) "Error: Instance is stopped"
      (if (not (empty? public-dns-name)) public-dns-name
        (do
          (println "IP for instance is not yet ready.. trying again in 30secs")
          (Thread/sleep 30000)
          (get-public-ip instance-id))))))

(defn build-instance [name]
  "creates the instance and returns details (including public-ip)"
  (let [file-path (setup-key name)
        group-id (setup-security-group name)
        instance (setup-instance name group-id)
        {:keys [instance-id private-ip-address]} (get-in instance [:reservation :instances 0])
        public-dns-name (get-public-ip instance-id)]
    {:file-path file-path
     :public-dns-name public-dns-name
     :private-ip private-ip-address}))

(defn -main [& args]
  (if (zero? (count args))
    (println "Error: please provide a name for your instance.")
    ))
