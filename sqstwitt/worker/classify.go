package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	const API_URL = "https://api.monkeylearn.com/v2/classifiers/cl_qkjxv9Ly/classify/?"
	const API_TOKEN = "Token 8c47cd62c949d26430c775850a6bfdfe798091ac"

	client := &http.Client{}

	req, err := http.NewRequest("POST", API_URL, nil)
	if err != nil {
		log.Fatal(err)
	}
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Authorization", API_TOKEN)
	req.BodyType = "hello"

	resp, err := client.Do(req)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(resp)

}
