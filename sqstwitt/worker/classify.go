package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/bitly/go-simplejson"
)

func main() {
	const API_URL = "https://api.monkeylearn.com/v2/classifiers/cl_qkjxv9Ly/classify/?"
	const API_TOKEN = "Token 8c47cd62c949d26430c775850a6bfdfe798091ac"

	client := &http.Client{}

	// the request body data
	m := map[string]interface{}{
		"text_list": []string{
			"some text to test",
			"some more text",
		},
	}

	// preparing the request
	mJson, _ := json.Marshal(m)
	contentReader := bytes.NewReader(mJson)
	req, err := http.NewRequest("POST", API_URL, contentReader)
	if err != nil {
		log.Fatal(err)
	}
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Authorization", API_TOKEN)

	// make the request
	resp, err := client.Do(req)
	if err != nil {
		log.Fatal(err)
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatal(err)
	}

	js, err := simplejson.NewJson(body)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(js)

}
