# Introduction
'FabChat' is an anonymous chat application based on Hyperledger Fabric.

### Key Logic
A message remains anonymous unless **at least 50%** of the users flag it.

### Network Configuration
Uses sample network 'basic-network' which bootstraps the following instances:

- 1 orderer
- 1 CA
- 1 org (org1) maintaining 1 peer (peer0)
- 1 CouchDB 
- 1 CLI

### The Asset
An asset (key, value) is a **(msgID, msg)** pair.\
For eg. the msg object with msgID **2** after getting flagged by **user1** looks like this:

| Property        | Value                         | Comment                       |
|-----------------|-------------------------------|-------------------------------|
| msgTex          | `covid19`                     | text of the msg               |
| userID          | `user3*`                      | userID of the poster          |
| flag            | `1`                           | no. of flags msg has received |
| flaggers        | `[ user1* ]`                  | users who’ve flagged the msg  |
| emailID         | `u3@ashoka.edu.in`            | email ID of the poster        |

> * Shortened for clarity. For eg. actual userID for **user3** looks like:
x509::/OU=client+OU=org1+OU=department1/CN=**user3**::/C=US/ST=California/L=San Francisco/O=org1.example.com/CN=ca.org1.example.com

## Instructions

### Prerequisites
- Install Hyperledger Fabric 
- Merge this repo's contents in fabric-samples dir

### Setting up the network
~~~~
$ cd fabric-samples/fabchat
$ ./teardownBasic.sh
$ ./startBasic.sh
~~~~

### Running Client Application 
1. Change dir \
`$ cd fabric-samples/fabchat/javascript`

2. Enroll admin (stores CA admin credentials in wallet dir) \
`$ node enrollAdmin.js`

3. Register and enroll 3 users user1, user2, user3 with CA (stores <userID> credentials in wallet dir) \
	 General usage :
  `$ node registerUser.js <userID>`
	
  ~~~~
  $ node registerUser.js user1
  $ node registerUser.js user2
  $ node registerUser.js user3
  ~~~~

4. Post 3 `$HELLO$` registration messages using user1, user2 and user3 wallets respectively

~~~~
$ node invoke.js createMsg '$HELLO$' user1 u1@ashoka.edu.in
$ node invoke.js createMsg '$HELLO$' user2 u2@ashoka.edu.in
$ node invoke.js createMsg '$HELLO$' user3 u3@ashoka.edu.in
~~~~

5. Post 3 messages using user1, user2 and user3 wallets respectively

	General usage:   `$ node invoke.js createMsg <msgText> <userID> <emailID>`
~~~~
    $ node invoke.js createMsg hello user1 u1@ashoka.edu.in
    $ node invoke.js createMsg welcome user2 u2@ashoka.edu.in
    $ node invoke.js createMsg covid19 user3 u3@ashoka.edu.in
~~~~

6. Query all messages using user1 wallet

General usage:  `$ node query.js -1 <userID>`
~~~~
$ node query.js -1 user1
~~~~

7. Query message by msgID using user1 wallet

	General usage:  `$ node query.js <msgID> <userID>`
~~~~
$ node query.js 2 user1
~~~~

9. Flag “covid19” message with msgID “2” using user1 and user2 wallet

	General usage:  `$ node invoke.js flagMsg <msgID> <userID>`
  ~~~~
  $ node invoke.js flagMsg 2 user1
  $ node invoke.js flagMsg 2 user2
  ~~~~
  
10. Perform a query. The email ID of the msg poster will be revealed.
~~~~
$ node query.js 2 user1
~~~~

11. Try to flag “covid19” message with msgID “2” again using user2 wallet. It will fail. 
Thus, a user cannot flag the same msg twice. 
~~~~
$ node invoke.js flagMsg 2 user2
~~~~

12. Try to flag user2’s “welcome” msg with msgID “1” using user2 wallet. It will fail. 
Thus, a user cannot flag its own msg. 
~~~~
$ node invoke.js flagMsg 1 user2
~~~~
