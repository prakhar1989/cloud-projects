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

// globals
var dbSession *r.Session
var snsSvc *sns.SNS
var sqsSvc *sqs.SQS
var queueUrl string
var topicArn string

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
}

// processing a single msg from the queue and then
// subsequently deletes it
func processMsg(msg *sqs.Message) {
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
	deleteMsg(msg)

	// send notification
	notify(tweetJson)
}

// notify publishes a SNS notification to the
// topic with topicArn as its topic arn
func notify(tweetJson *simplejson.Json) {
	b, err := tweetJson.MarshalJSON()
	if err != nil {
		log.Println("Unable to convert to string")
		return
	}
	msg := string(b)
	params := &sns.PublishInput{
		Message:  aws.String(msg),
		Subject:  aws.String("New Tweet"),
		TopicArn: aws.String(topicArn),
	}
	_, err = snsSvc.Publish(params)
	if err != nil {
		log.Println("Unable to send notification")
	}
}

// deletes a message from the queue
func deleteMsg(msg *sqs.Message) {
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

	// get the queue url
	resp, err := sqsSvc.CreateQueue(
		&sqs.CreateQueueInput{
			QueueName: aws.String(QUEUE_NAME),
		},
	)
	if err != nil {
		panic(err)
	}
	queueUrl = *resp.QueueUrl

	// get the topic arn
	snsresp, snserr := snsSvc.CreateTopic(
		&sns.CreateTopicInput{
			Name: aws.String("tweet-topic"),
		},
	)
	if snserr != nil {
		panic(err)
	}
	topicArn = *snsresp.TopicArn

	// begin the polling on queue
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
			go processMsg(msg)
		}
		// wait for a second for hitting again
		time.Sleep(WAIT_TIME * time.Second)
	}

}
