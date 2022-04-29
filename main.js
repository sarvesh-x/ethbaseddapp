const serverUrl = "https://c17jrlfhg0f6.usemoralis.com:2053/server";
const appId = "p1vyLfGxCHgg22qHI19cuDhpJ65t3FHk2AoXX8xY";
Moralis.start({ serverUrl, appId });

let homepage = "http://127.0.0.1:5500/index.html";
if(Moralis.User.current() == null && window.location.href != homepage) {
    document.querySelector('body').style.display = 'none';
    window.location.href = "index.html";
}

login = async() => {
    await Moralis.authenticate().then(async function (user) {
        console.log('logged in')
        user.set("name",document.getElementById('user-username').value);
        user.set("email",document.getElementById('user-email').value);
        //console.log(Moralis.User.current())
        await user.save();

        window.location.href = "dashboard.html";
    })
}

logout = async () => {
    await Moralis.User.logOut();
    window.location.href = "index.html";
}

getTransactions = async() => {
    const options = {
        chain: "ropsten",
        address: "0xc8b715186757aa7FB3069455B9647c8Ef4A7e187",
      };
      const transactions = await Moralis.Web3API.account.getTransactions(options);
      console.log(transactions);

      if(transactions.total > 0){
          let table = `
          <table class="table">
          <thead>
            <tr>
                <th scope="col">Transaction</th>
                <th scope="col">Block Number</th>
                <th scope="col">Age</th>
                <th scope="col">Type</th>
                <th scope="col">Fee</th>
                <th scope="col">Value</th>
            </tr>
            </thead>
            <tbody id="theTransactions">
            </tbody>
            </table>
          `
        document.querySelector('#tableoftransactions').innerHTML = table;
        transactions.result.forEach(t => {
            let content = `
            <tr>
                <td><a href='https://ropsten.etherscan.io/tx/${t.hash}'>${t.hash}</a></td>
                <td><a href='https://ropsten.etherscan.io/block/${t.block_number}'>${t.block_number}</a></td>
                <td>${millisecondsToTime(Date.parse(new Date()) - Date.parse(t.block_timestamp))}</td>
                <td>${t.from_address == Moralis.User.current().get('ethAddress') ? 'Sent' : 'Recieved'}</td>
                <td>${((t.gas * t.gas_price) / 1e18).toFixed(5)}</td>
                <td>${(t.value / 1e18).toFixed(5)}</td>
            </tr>
            `
            theTransactions.innerHTML += content;
        });

      }
}

millisecondsToTime = (ms) => {
    let minutes = Math.floor(ms / (1000 * 60));
    let hours = Math.floor(ms / (1000 * 60 * 60));
    let days = Math.floor(ms / (1000 * 60 * 60 * 24));
    if(days < 1){
        if(hours < 1){
            if(minutes <1){
                return `less than a minute ago`
            }else return `${minutes} minute(s) ago`
        }else return `${hours} hour(s) ago`
    }else return `${days} day(s) ago`
}

getBalance = async() => {
    console.log('balance connected');
    const ethbalance = await Moralis.Web3API.account.getNativeBalance();
    const ropstenbalance = await Moralis.Web3API.account.getNativeBalance({ chain: "ropsten"});
    const rinkebybalance = await Moralis.Web3API.account.getNativeBalance({ chain: "rinkeby"});
    //console.log( (ethbalance.balance / 1e18).toFixed(5) + " ETH" );
    //console.log( (ropstenbalance.balance / 1e18).toFixed(5) + " ETH" );
    //console.log( (rinkebybalance.balance / 1e18).toFixed(5) + " ETH" );

    let content = document.querySelector('#userbBalance').innerHTML = `
    <table class="table">
          <thead>
            <tr>
                <th scope="col">Chain</th>
                <th scope="col">Balance</th>
            </tr>
            </thead>
            <tbody>
                <tr>
                    <th>Ether</th>
                    <td>${(ethbalance.balance / 1e18).toFixed(5)} ETH</td>
                </tr>
                <tr>
                    <th>Ropsten</th>
                    <td>${(ropstenbalance.balance / 1e18).toFixed(5)} ETH</td>
                </tr>
                <tr>
                    <th>Rinkeby</th>
                    <td>${(rinkebybalance.balance / 1e18).toFixed(5)} ETH</td>
                </tr>
            </tbody>
            </table>
    `
}

getNFTs = async() => {
    console.log('get nfts');
    
    let nfts = await Moralis.Web3API.account.getNFTs({ chain: 'rinkeby', address: '0xc8b715186757aa7FB3069455B9647c8Ef4A7e187'});

    console.log(nfts);

    let tableOfNFTs = document.querySelector('#tableofNFTs');
    if(nfts.result.length > 0){
        nfts.result.forEach(n => {
            let metadata = JSON.parse(n.metadata);
            console.log(metadata);
            let content = `
            <div class="card col-md-3">
                <img src="${fixURL(metadata.image)}" class="card-img-top" height=300>
                <div class="card-body">
                    <h5 class="card-title">${metadata.name}</h5>
                    <p class="card-text">${metadata.description}</p>
                    <a href="#" class="btn btn-primary">Go somewhere</a>
                </div>
            </div>
            `
            tableOfNFTs.innerHTML += content;
        });
    }
    
}

fixURL = (url) => {
    if(url.startsWith("ipfs")){
        return "https://ipfs.moralis.io:2053/ipfs/" + url.split("ipfs://").slice(-1)
    }
    else{
        return url + "?format=json"
    }
}

ethTransfer = async() =>{
    console.log("transferETH");
    const web3 = await Moralis.enableWeb3();
    //wallet2 add : 0xc876e4fbe9EfcC87D1221c8a95914c008e8948ce

        let ethTransfer = document.querySelector('#ethTransfer');
        let content = `
        <br><br>
        <label for="Address of Reciepent">Address:</label>
        <input type="text" id="address" name="address" size="60"><br><br>
        <label for="amount">Amount:</label>
        <input type="number" id="amount" name="amount"><br><br>
        <input type="button" value="Transfer" id="transfer"><br><br>
        <label id="flag"></label>
        <br><br>
        `
        ethTransfer.innerHTML += content;

        document.getElementById('transfer').onclick = transfer;
        async function transfer(){
        let address = document.getElementById('address').value;
        let amount = document.getElementById('amount').value;
        console.log(address,amount);
        //let amt = parseFloat(amount);
        const options = {
            type: "native",
            amount: Moralis.Units.ETH(amount),
            receiver: address,
          };
          let result = await Moralis.transfer(options);
          console.log('success');
          document.getElementById('flag').innerHTML = "Sent "+amount+" to "+address;
        }
}


if(document.querySelector('#btn-login') != null){
    document.querySelector('#btn-login').onclick = login;
}
if(document.querySelector('#btn-logout') != null){
    document.querySelector('#btn-logout').onclick = logout;
}
if(document.querySelector('#get-transactions-link') != null){
    document.querySelector('#get-transactions-link').onclick = getTransactions;
}
if(document.querySelector('#get-balance-link') != null){
    document.querySelector('#get-balance-link').onclick = getBalance;
}
if(document.querySelector('#get-nfts-link') != null){
    document.querySelector('#get-nfts-link').onclick = getNFTs;
}
if(document.querySelector('#transfer-eth') != null){
    document.querySelector('#transfer-eth').onclick = ethTransfer;
}