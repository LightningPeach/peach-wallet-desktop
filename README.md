<img src="https://circleci.com/gh/LightningPeach/peach-wallet-desktop/tree/master.svg?style=svg">

<h1 align="center">
  <img src="docs/peach_logo.png" alt="peach logo" />
</h1>

Peach Wallet is a free cross-platform desktop Lightning Network wallet. It simplifies the process of making micro payments, which are processed seamlessly thanks to user-friendly application and own payment server solution.

### Technical details
The Peach Wallet is the Lightning Network wallet that uses **lnd** (Lightning Network Daemon). 

GUI is implemented with [Electron](https://electronjs.org) + [React](https://reactjs.org) + [Redux](https://github.com/reactjs/redux).

### Before using the wallet

:construction: Development of the Peach Wallet is still in progress. It means that different issues can occur during wallet usage. Using real coins may be risky.

### Common features
The Peach Wallet supports the following features, which have already become common for existing Lightning Network wallets:

- Sending & receiving payments within the Lightning Network using payment request.
- Sending & receiving payments on-chain. Regular transactions within Bitcoin blockchain.
- Transaction history. Details on payments that are sent and received with your wallet account are kept in history section, so you can always have access to them when it is needed. 
- Payment request. You can generate kind of invoice and send it to another person to pay you according to provided payment request.
- Custom channel opening. You can create custom channel by specifying Lightning ID and host IP of a peer.

### Unique features
- Sending & receiving payments within the Lightning Network using Lightning ID. Works only between Peach Wallet users.
- Recurring payments between Peach Wallet users. Recurring payments can be useful in cases when periodic charges are more appropriate than regular payments (for example, online streaming services, voice and video calls with per second charge).
- Address book. With the help of address book you can specify clear and convenient contact names, which is very useful as later you can select them on the Lightning Payment page, thus no need to copy & paste, remember or keep Lightning ID somewhere on paper or PC.
- QR codes for connecting from the Peach mobile wallet. If you have public IP address, then you can keep your desktop node active and connect to it from your Peach mobile wallet with the help of generated QR code.

### Installation
You can [install the wallet from source](docs/installation.md).

### Contribute

If you would like to help contribute to the project please contact us.

You can read the Contributing guide [here](CONTRIBUTING.md). 

### Contacts

Should you have any questions or suggestions, please do not hesitate to contact us:

Email: hello@lightningpeach.com

[Slack](https://join.slack.com/t/lightningpeach/shared_invite/enQtMzk2MTA1NjYyODQ4LTU2ZDYwMjZkYWNiMDhlOWIzN2RmNGE1MGE4Nzk2Yzk4YzU5MWJmMWJmMmYxZjA5N2MzNDI0YzgyZDYwMDc0YTg)
