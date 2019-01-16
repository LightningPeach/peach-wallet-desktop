# Installation guide

## General description

There are some components that you need to use the wallet:

1. [Wallet source](https://github.com/LightningPeach/lightning-peach-wallet.git)
2. [Lnd](https://github.com/lightningnetwork/lnd) 
(**we use fork of lnd until [pull request](https://github.com/lightningnetwork/lnd/pull/1501)
will not be accepted to improve UX of the wallet. You can also use [lnd](https://github.com/lightningnetwork/lnd.git)**)
3. [Btcd](https://github.com/btcsuite/btcd) or [Bitcoind](https://github.com/bitcoin/bitcoin) (for personal usage for lnd and test on simnet)

Components 1 and 2 are required (they have to be installed
on customer's PC) and bitcoin node is optional (only if user would like to connect lnd directly to own node)


## Wallet installation

To install the wallet you need [nodejs v8.9.4+](https://nodejs.org/en/) and npm v5.6.0
(will be installed with nodejs).

## Linux, MacOS

```bash
git clone https://github.com/LightningPeach/lightning-peach-wallet.git
cd lightning-peach-wallet/
npm install
mkdir node_modules/executable/
```

**Note: if you have an openssl error during installation install openssl. Then uninstall the node_modules 
directory and true to install modules one more time.**

**OpenSSL installation on MacOS:**
```
brew install openssl
brew link --force openssl
```

**OpenSSL installation on Linux:**
```
sudo apt-get install libssl-dev
```

## Lnd

### Preliminaries
  In order to work with [`lnd`](https://github.com/lightningnetwork/lnd), the
  following build dependencies are required:
  
  * **Go:** `lnd` is written in Go. To install, run one of the following commands:
    
    **Note**: The minimum version of Go supported is Go 1.11. We recommend that
      users use the latest version of Go, which at the time of writing is
      [`1.11`](https://blog.golang.org/go1.11).
      
    On Linux:
    ```
    cd /tmp
    wget https://dl.google.com/go/go1.11.linux-amd64.tar.gz
    sudo tar -xvf go1.11.linux-amd64.tar.gz
    sudo mv go /usr/local
    ```
    
    On Mac OS X:
    ```
    brew install go
    ```
  
    On FreeBSD:
    ```
    pkg install go
    ```
  
    Alternatively, one can download the pre-compiled binaries hosted on the
    [golang download page](https://golang.org/dl/). If one seeks to install
    from source, then more detailed installation instructions can be found
    [here](http://golang.org/doc/install).
  
    At this point, you should set your `$GOPATH` environment variable, which
    represents the path to your workspace. By default, `$GOPATH` is set to
    `~/go`. You will also need to add `$GOPATH/bin` to your `PATH`. This ensures
    that your shell will be able to detect the binaries you install.
  
    ```bash
    export GOROOT=/usr/local/go
    export GOPATH=~/gocode
    export PATH=$GOPATH/bin:$GOROOT/bin:$PATH
    ```
  
    We recommend placing the above in your .bashrc or in a setup script so that
    you can avoid typing this every time you open a new terminal window.
  
  * **go modules:** This project uses [go modules](https://github.com/golang/go/wiki/Modules) 
    to manage dependencies as well as to provide *reproducible builds*.
  
      Usage of go modules (with go 1.11) means that you no longer need to clone
      `lnd` into your `$GOPATH` for development purposes. Instead, your `lnd`
      repo can now live anywhere!

### Installing lnd

With the preliminary steps completed, install `lnd`, `lncli`, and all
related dependencies, run the following commands:

**Note: we use fork of [lnd](https://github.com/lightningnetwork/lnd.git)**

```
git clone https://github.com/LightningPeach/lnd.git $GOPATH/src/github.com/lightningnetwork/lnd
cd $GOPATH/src/github.com/lightningnetwork/lnd
git checkout wallet-mainnet
make && make install
```

After lnd is insalled **from wallet directory** run:
```bash
cp $GOPATH/bin/lnd node_modules/executable/
```

## Running the wallet

Before you can run wallet you need to install lnd.

To run wallet you need to run **from wallet directory**:
```bash
npm run start
```

To create binary files run **from wallet directory**:
```bash
npm run build
```

## Windows

**Note: during installation and when using the wallet, your antivirus 
application on Windows may show a warning message requesting additional 
permissions for the Wallet application. This can happen during execution 
of different commands, for example, `dep ensure -v`. In such a case you 
should grant access to the Peach Wallet. This is required for 
correct work of the wallet.**

```bash
git clone https://github.com/LightningPeach/lightning-peach-wallet.git
cd lightning-peach-wallet\
npm install
mkdir node_modules\executable\
```

**Note: if you have sqlitecipher installation problem run**
```bash
npm install --global --production windows-build-tools --vs2015
```

**Note: if you have an openssl error during installation install openssl. You can download 
pack with opessl [here](https://git-scm.com/download/win). Then uninstall the node_modules 
directory and true to install modules one more time.**

## Lnd

### Preliminaries
  In order to work with [`lnd`](https://github.com/lightningnetwork/lnd), the
  following build dependencies are required:

  * **Go:** `lnd` is written in Go. You can download the latest version [here](https://golang.org/dl/).

    **Note**: The minimum version of Go supported is Go 1.11. We recommend that
    users use the latest version of Go, which at the time of writing is
    [`1.11`](https://blog.golang.org/go1.11).

  * **dep:** This project uses `dep` to manage dependencies as well
    as to provide *reproducible builds*. To install `dep`, execute the
    following command (assumes you already have Go properly installed):
    ```
    go get -u github.com/golang/dep/cmd/dep
    ```

### Installing lnd

With the preliminary steps completed, install `lnd`, `lncli`, and all
related dependencies, run the following commands:

**Note: we use fork of [lnd](https://github.com/lightningnetwork/lnd.git)**

```
git clone https://github.com/LightningPeach/lnd.git %GOPATH%src\github.com\lightningnetwork\lnd
cd %GOPATH%\src\github.com\lightningnetwork\lnd
git checkout wallet-mainnet
dep ensure -v
go install . .\cmd\...
```

After lnd is insalled **from wallet directory** run:
```bash
copy %GOPATH%\bin\lnd.exe node_modules\executable\
```

## Running the wallet

Before you can run wallet you need to install other components.

To run wallet you need to run **from wallet directory**:
```bash 
npm run start
```

To create binary files run **from wallet directory**:
```bash
npm run build
```
