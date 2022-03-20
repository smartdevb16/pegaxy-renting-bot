const ethers = require('ethers');

var wssUrl = "wss://divine-delicate-snowflake.matic.quiknode.pro/8fb0f9ae7ddd7b5fba5e88f6895bf5ea8454a355/";
var httpUrl = "https://divine-delicate-snowflake.matic.quiknode.pro/8fb0f9ae7ddd7b5fba5e88f6895bf5ea8454a355/";

var customWsProvider = new ethers.providers.WebSocketProvider(wssUrl);
const provider = new ethers.providers.JsonRpcProvider(httpUrl); 

const ShareCode = '0x80dadbb2';
const RentCode = '0xaa34ab5e';
const privateKey = "0xcaf9ee74b3d7a043aa8ccfa04563f2de9c6d62172342c878f72fbba5c28d4a6e"
const publicKey = "0x063C8512E1f351d49b5535b2a4B0BC77Da98153A";

const lowProfit = 1;

var contractAbi = require("./pegaxyabi.json");
var contractAddr = ("0xfB7316Fb56FD2a8fDb925321b8f616eEF106Db33").toLocaleLowerCase();

var renters = [];
var profits = [];
var contract = new ethers.Contract(contractAddr, contractAbi, provider);
let wallet = new ethers.Wallet(privateKey);
const signer = wallet.connect(provider);


contract.on('Listed', function(listingId, pegaID) {
  renters[Number(listingId)] = Number(pegaID);
})

var target = 2;

var init = async function () {
  var nonce = await signer.getTransactionCount();
  console.log(nonce);
  customWsProvider.on("pending", (tx) => {
    if(tx == null || tx === undefined) {
      console.log("NULL");
    }

    customWsProvider.getTransaction(tx).then(async function  (transaction) {

      if(transaction == null || transaction.to && transaction.to.toLowerCase() != contractAddr) return;
      const { data } = transaction;
      if(data.startsWith(ShareCode)) {
        transaction.wait().then(async(res) => {
          if(res.status === 1) {
             let len = 64;
            let pegaID = parseInt(data.substring(10, 74), 16);
            let profit = parseInt(data.substring(74, 138), 16) / 10000;
            let hash =  data.substring(138, 212);
            console.log('\x1b[36m%s\x1b[0m', '<<<<< Pega[' + pegaID + '] is shared with ' + profit + '% rental profit.');
            profits[pegaID] = profit;
          }
        })
        .catch((error) => {

        });
      } else if(data.startsWith(RentCode)) {
        
        const listID = parseInt(data.substring(10, 74), 16);
        const pegaID = renters[listID];
        if(pegaID === undefined) return;

        const profit = profits[pegaID];
        if(profit === undefined || profit < lowProfit)  return;
        console.log('\x1b[33m%s\x1b[0m', '>>>>> Pega[' + pegaID + '][' + profit+ '] is renting by ' + transaction.from);

         if(target > 0) {
          target = -1;
          const tx = {
            to: contractAddr,
            data: transaction.data,
            maxFeePerGas: 1035000000000,
            maxPriorityFeePerGas :1035000000000, 
            value: 0,         
            nonce: nonce,
            chainId: 137,
            gasLimit: 500000,
            type: 2,
          }
          console.log("BUY", target);
          wallet.signTransaction(tx).then(async (signedTx) => {
            try {
              provider.sendTransaction(signedTx).then(async (ss) => {
                // await ss.wait();
              });
            }catch(err){
              console.log(err);
            }
          })
          
         }
      }
    });
  });

  customWsProvider._websocket.on("error", async (ep) => {
    console.log(`Unable to connect to ${ep.subdomain} retrying in 3s...`);
    setTimeout(init, 3000);
  });
  customWsProvider._websocket.on("close", async (code) => {
    console.log(
      `Connection lost with code ${code}! Attempting reconnect in 3s...`
    );
    customWsProvider._websocket.terminate();
    setTimeout(init, 3000);
  });
};
init();
