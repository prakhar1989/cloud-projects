(ns awsint.core
  (:gen-class)
  (:require [amazonica.aws.ec2 :as ec2]
            [me.raynes.fs :as fs]))

(defn setup-instance [key-name group-id]
  "creates an instance with associated keyname and group-id"
  (ec2/run-instances :image-id "ami-d05e75b8" :min-count 1 :max-count 1
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

(defn get-public-ip
  "gets the public ip of an EC2 instance."
  ([instance-id]
    (get-public-ip instance-id 15))                       ; 15 sec backoff initially
  ([instance-id backoff]
   (let [meta-data (ec2/describe-instances :instance-ids [instance-id])
         instance (get-in meta-data [:reservations 0 :instances 0])
         {:keys [state public-dns-name]} instance]
     (if (or (= "stopped" (:name state)) (= "terminated" :name state))
       "Error: Instance is stopped or termnimated."
       (if (not (empty? public-dns-name)) public-dns-name
          (do
            (println (str "IP for instance is not yet ready... trying again in " backoff "secs"))
            (Thread/sleep (* 1000 backoff))
            (get-public-ip instance-id (* 2 backoff)))))))) ; exponential backoff for subsequent tries

(defn build-instance [name]
  "creates the instance and returns details (including public-ip)"
  (let [file-path (setup-key name)
        group-id (setup-security-group name)
        instance (setup-instance name group-id)
        {:keys [instance-id private-ip-address]} (get-in instance [:reservation :instances 0])
        public-dns-name (get-public-ip instance-id)]
    (do 
      (fs/chmod "-rxw" file-path)
      (fs/chmod "u+r" file-path))
    {:file-path file-path
     :instance-id instance-id
     :public-dns-name public-dns-name
     :private-ip-address private-ip-address}))

(defn index-of-any
  "Java indexOfAny to Clojure"
  [s coll]
  (let [indexed (fn [coll] (map-indexed vector coll))
        index-filter (fn [pred coll]
                       (when pred
                         (for [[idx elt] (indexed coll) :when (pred elt)] idx)))]
    (first (index-filter s coll))))


(defn -main [& args]
  (if (zero? (count args))
    (println "Error: please provide a name for your instance.")
    (do
      (println (str "Your instance is being built with keypair: " (first args)
                    ".pem and security group - " (first args) ".")
               "\nPlease wait before all network interfaces are attached...")
      (let [{:keys [file-path instance-id public-dns-name
                    private-ip-address]} (build-instance (first args))]
        (do
          (println (clojure.string/join (take 40 (repeat "-"))))
          (println (str "Your instance is now ready with ID: " instance-id
                        " & private IP Address: " private-ip-address))
          (println (str "To login: ssh -i " file-path " ec2-user@" public-dns-name)))))))
