package main

import (
	"net"
	"fmt"
)

var (
	big_ear chan []byte
)

type Client struct {
 conn net.Conn
 pub chan []byte
}

type Register struct {
    clients []*Client
}

func launchServer(port string) {
	ln, err := net.Listen("tcp", port)
	if err != nil {
		fmt.Println("conn error", err)
	}
	big_ear = make(chan []byte)

	state := &Register{
        clients: make([]*Client, 0),
    }

	go state.run()
	
	for {
		conn, err := ln.Accept()
		if err != nil {
			fmt.Println("socket error", err)
		}
		fmt.Println("Server ready to handle connection")
		pub := make(chan []byte)
		client := &Client{
			conn: conn,
			pub: pub,
		}
		state.clients = append(state.clients, client)
		go handleConnection(client)
	}
}

func (state *Register) run() {
	for {
		incoming := <- big_ear
		ack := []byte{97}
		msg := append(ack, incoming...)
		fmt.Println("Received:", msg)
		for _, client := range state.clients {
            select {
            case client.pub <- msg:
                fmt.Println("Message broadcasted to client")
            default:
                // Skip if the client's pub channel is blocked (e.g., client not reading)
                fmt.Println("Skipped sending to a client: channel blocked")
            }
        }
	}
}

func handleConnection(client *Client) {
	defer client.conn.Close()
	exit := make(chan string)

	go readSocket(client.conn, exit)
	go writeSocket(client)

	<- exit
	fmt.Println("exiting connection")
}

func readSocket(conn net.Conn, exit chan string) {
	for {
		read_buffer := make([]byte, 20)
		_, err := conn.Read(read_buffer)
		if err != nil {
			fmt.Println("read error", err)
			exit <- "exit"
			return
		}
		big_ear <- read_buffer
	}
}

func writeSocket(client *Client) {
	for msg := range client.pub {
		client.conn.Write(msg)
	}
}