var ethJsUtil = require('ethereumjs-util');
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'));
const yourAddress = '0x063C8512E1f351d49b5535b2a4B0BC77Da98153A';
(async() => {
var nonce = await web3.eth.getTransactionCount(yourAddress);
console.log(nonce);


var futureAddress = ethJsUtil.bufferToHex(ethJsUtil.generateAddress(
  Buffer.from(yourAddress),
  nonce));

  console.log(futureAddress);
})()