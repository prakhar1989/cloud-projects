(defproject awsint "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.7.0"]
                 [amazonica "0.3.33"]]
  :main ^:skip-aot awsint.core
  :target-path "target/%s"
  :profiles {:uberjar {:aot :all}})
