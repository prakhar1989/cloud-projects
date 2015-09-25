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

(defn -main [& args]
  (if (zero? (count args))
    (println "Error: please provide a name for your instance.")
    (let [name (first args)
          file-path (setup-key name)
          group-id (setup-security-group name)
          instance (setup-instance name group-id)
          {id :instance-id private-ip :private-ip-address}
                (get-in instance [:reservation :instances 0])]
      (do 
        (println (str "Your keypair is located in:" file-path)) 
        (println "Your instance is now being built. You can ssh in after a while when a public ip is assigned.")
        (println (str "DETAILS - id:" id ", private ip:" private-ip))))))
