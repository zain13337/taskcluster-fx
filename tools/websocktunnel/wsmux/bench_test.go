package wsmux

import (
	"bytes"
	"crypto/sha256"
	"io"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	"github.com/gorilla/websocket"
	"github.com/taskcluster/taskcluster/v72/tools/websocktunnel/util"
)

// utils
var upgrader = websocket.Upgrader{
	ReadBufferSize:  64 * 1024,
	WriteBufferSize: 64 * 1024,
}

func echoFunc(b *testing.B, server *Session, wg *sync.WaitGroup) {
	b.Helper()
	if wg != nil {
		defer wg.Done()
	}
	hash := sha256.New()
	str, err := server.Accept()
	if err != nil {
		panic(err)
	}
	// copy does not report EOF as error
	_, err = io.Copy(hash, str)
	if err != nil {
		panic(err)
	}
	_, err = str.Write(hash.Sum(nil))
	if err != nil {
		panic(err)
	}
	err = str.Close()
	if err != nil {
		panic(err)
	}
}

func echoClientFunc(b *testing.B, client *Session, wg *sync.WaitGroup) {
	b.Helper()
	if wg != nil {
		defer wg.Done()
	}
	hash := sha256.New()
	str, err := client.Open()
	if err != nil {
		panic(err)
	}

	// write 4MB of data
	size := 4 * 1024 * 1024
	buf := make([]byte, size)
	for i := range size {
		buf[i] = byte(i % 127)
	}

	_, _ = hash.Write(buf)
	b.ResetTimer()
	_, err = str.Write(buf)
	if err != nil {
		panic(err)
	}
	err = str.Close()
	if err != nil {
		panic(err)
	}

	// read hash generated by remote and compare
	buf, err = io.ReadAll(str)
	if err != nil {
		panic(err)
	}

	if !bytes.Equal(hash.Sum(nil), buf) {
		panic("bad message")
	}
}

func genTransferHandler(b *testing.B) http.Handler {
	b.Helper()
	tr := func(w http.ResponseWriter, r *http.Request) {
		if !websocket.IsWebSocketUpgrade(r) {
			http.NotFound(w, r)
			return
		}
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			b.Fatal(err)
		}

		server := Server(conn, Config{StreamBufferSize: 4 * 1024})
		echoFunc(b, server, nil)

	}
	return http.HandlerFunc(tr)
}

const maxTransferStreams = 100

func genMultiTransferHandler(b *testing.B) http.Handler {
	b.Helper()
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !websocket.IsWebSocketUpgrade(r) {
			http.NotFound(w, r)
			return
		}
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			b.Fatal(err)
		}

		server := Server(conn, Config{StreamBufferSize: 4 * 1024})

		wg := new(sync.WaitGroup)
		for range maxTransferStreams {
			wg.Add(1)
			go echoFunc(b, server, wg)
		}
		wg.Wait()
	})
}

// test large transfer
func BenchmarkTransfer(b *testing.B) {
	server := httptest.NewServer(genTransferHandler(b))
	url := server.URL
	defer server.Close()
	conn, _, err := websocket.DefaultDialer.Dial(util.MakeWsURL(url), nil)
	if err != nil {
		b.Fatal(err)
	}
	client := Client(conn, Config{StreamBufferSize: 4 * 1024})
	echoClientFunc(b, client, nil)
}

// test transfer over multiple streams
func BenchmarkMultiTransfer(b *testing.B) {
	server := httptest.NewServer(genMultiTransferHandler(b))
	url := server.URL
	defer server.Close()
	conn, _, err := websocket.DefaultDialer.Dial(util.MakeWsURL(url), nil)
	if err != nil {
		b.Fatal(err)
	}
	client := Client(conn, Config{StreamBufferSize: 4 * 1024})
	wg := new(sync.WaitGroup)
	for range maxTransferStreams {
		wg.Add(1)
		go echoClientFunc(b, client, wg)
	}
	wg.Wait()
}
