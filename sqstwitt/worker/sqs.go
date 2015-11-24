package main

import (
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sqs"
)

// processing a single msg
func processMsg(msg *sqs.Message) {
	fmt.Println("Processing: ", *msg.MessageId)
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
	fmt.Println("URL: ", queueUrl)

	for {
		// get the messages
		msgs, e := svc.ReceiveMessage(
			&sqs.ReceiveMessageInput{
				QueueUrl:            aws.String(queueUrl),
				MaxNumberOfMessages: aws.Int64(10),
			},
		)
		fmt.Println("Got", len(msgs.Messages), " messages")
		if e != nil {
			panic(e)
		}

		for _, msg := range msgs.Messages {
			processMsg(msg)
		}
		// wait for a second for hitting again
		time.Sleep(10 * time.Second)
	}

}
