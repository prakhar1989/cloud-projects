package main

import (
	"fmt"
	"log"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sqs"
)

// processing a single msg
func processMsg(msg *sqs.Message, svc *sqs.SQS, queueUrl string) {
	// process
	fmt.Println("Processing: ", *msg.MessageId)

	// delete the message
	deleteTweet(msg, svc, queueUrl)
}

func deleteTweet(msg *sqs.Message, svc *sqs.SQS, queueUrl string) {
	_, err := svc.DeleteMessage(
		&sqs.DeleteMessageInput{
			QueueUrl:      aws.String(queueUrl),
			ReceiptHandle: aws.String(*msg.ReceiptHandle),
		},
	)
	if err != nil {
		fmt.Println("Unable to delete", err)
	}
}

func main() {
	// init
	const queueName = "tweetsQueue"
	svc := sqs.New(session.New(), &aws.Config{Region: aws.String("us-east-1")})

	params := &sqs.CreateQueueInput{
		QueueName: aws.String(queueName),
	}

	// get the queue url
	var queueUrl string
	resp, err := svc.CreateQueue(params)
	if err != nil {
		panic(err)
	}
	queueUrl = *resp.QueueUrl

	for {
		// get the messages
		msgs, e := svc.ReceiveMessage(
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
			go processMsg(msg, svc, queueUrl)
		}
		// wait for a second for hitting again
		time.Sleep(10 * time.Second)
	}

}
