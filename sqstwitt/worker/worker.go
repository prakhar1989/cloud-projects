package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sns"
	"github.com/aws/aws-sdk-go/service/sqs"
	"github.com/bitly/go-simplejson"
	r "github.com/dancannon/gorethink"
)

var dbSession *r.Session
var snsSvc *sns.SNS
var sqsSvc *sqs.SQS

// called before the main function. Sets the DB session
// pointer correctly
func init() {
	var err error

	// DB configuration
	dbSession, err = r.Connect(r.ConnectOpts{
		Address:  "localhost:28015",
		Database: "twitter_streaming",
	})
	if err != nil {
		log.Fatal(err)
	}
	dbSession.SetMaxOpenConns(10)

	// initialize the SQS Service
	sqsSvc = sqs.New(session.New(), &aws.Config{Region: aws.String("us-east-1")})

	// initialize the SNS Service
	snsSvc = sns.New(session.New(), &aws.Config{Region: aws.String("us-east-1")})
	fmt.Printf("%T", snsSvc)
}

// processing a single msg from the queue and then
// subsequently deletes it
func processMsg(msg *sqs.Message, queueUrl string) {
	// process
	tweetBody := []byte(*msg.Body)
	tweetJson, err := simplejson.NewJson(tweetBody)
	if err != nil {
		log.Println("unable to parse tweet")
		return
	}
	text := tweetJson.Get("text").MustString()
	resp, err := classifyText(text)
	if err != nil {
		log.Println("failed to classify tweet")
	}
	sentiment, err := simplejson.NewJson(resp)
	if err != nil {
		log.Fatal(err)
	}
	// save this to the db
	tweetJson.Set("sentiment", sentiment)

	// insert tweet into DB
	id := insertTweetInDb(tweetJson)
	log.Println("Saving tweet with id", id)

	// delete the message
	//deleteTweet(msg, queueUrl)
}

// deletes a message from the queue
func deleteMsg(msg *sqs.Message, queueUrl string) {
	_, err := sqsSvc.DeleteMessage(
		&sqs.DeleteMessageInput{
			QueueUrl:      aws.String(queueUrl),
			ReceiptHandle: aws.String(*msg.ReceiptHandle),
		},
	)
	if err != nil {
		log.Println("Unable to delete", err)
	}
}

// classifies a string using the monkeylearn api
func classifyText(text string) ([]byte, error) {
	const API_URL = "https://api.monkeylearn.com/v2/classifiers/cl_qkjxv9Ly/classify/?"
	const API_TOKEN = "Token 8c47cd62c949d26430c775850a6bfdfe798091ac"

	client := &http.Client{}

	// the request body data
	m := map[string]interface{}{
		"text_list": [1]string{text},
	}

	// preparing the request
	mJson, _ := json.Marshal(m)
	contentReader := bytes.NewReader(mJson)
	req, err := http.NewRequest("POST", API_URL, contentReader)
	if err != nil {
		log.Print(err)
	}
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Authorization", API_TOKEN)

	// make the request
	resp, err := client.Do(req)
	if err != nil {
		log.Print(err)
	}
	return ioutil.ReadAll(resp.Body)
}

// inserts the tweet in the db
func insertTweetInDb(tweetJson *simplejson.Json) string {
	// delete this pesky key - creates issues with rethinkdb
	tweetJson.Del("id")
	m, err := tweetJson.Map()
	if err != nil {
		fmt.Println(err)
		return ""
	}
	result, err := r.Table("jstwitter").Insert(m).RunWrite(dbSession)
	if err != nil {
		fmt.Println(err)
		return ""
	}
	return result.GeneratedKeys[0]
}

func main() {
	const QUEUE_NAME = "tweetsQueue"
	const WAIT_TIME = 10

	params := &sqs.CreateQueueInput{
		QueueName: aws.String(QUEUE_NAME),
	}

	// get the queue url
	var queueUrl string
	resp, err := sqsSvc.CreateQueue(params)
	if err != nil {
		panic(err)
	}
	queueUrl = *resp.QueueUrl

	for {
		// get the messages
		msgs, e := sqsSvc.ReceiveMessage(
			&sqs.ReceiveMessageInput{
				QueueUrl:            aws.String(queueUrl),
				MaxNumberOfMessages: aws.Int64(10),
			},
		)
		log.Println("Got", len(msgs.Messages), "messages")
		if e != nil {
			panic(e)
		}

		for _, msg := range msgs.Messages {
			go processMsg(msg, queueUrl)
		}
		// wait for a second for hitting again
		time.Sleep(WAIT_TIME * time.Second)
	}

}
