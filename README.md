# ClientLogger
Clientside JavaScript logger for tracking user behavior.
	* APIClient(JSonly) - Version with only JavaScript
	* APIClient(WebWorker) - Version with WebWorkers support
Both versions are intended for logging user behavior on the client side, recording it in the buffer and asynchronous data transfer to the server. All transmitted and received messages are encrypted by the AES algorithm on the unique key. Encryption key is updated after each reboot or a successful message transmission.