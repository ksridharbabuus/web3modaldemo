import { useEffect, useState } from "react";

// Web3Modal
import Web3Modal from "web3modal";
import { providerOptions } from "./providerOptions";

// EthersJS
import { ethers } from "ethers";

// Material UI
import Button from "@mui/material/Button";
import { Grid, TextField } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

// App Imports
import logo from './logo.svg';
import './App.css';


// Import contract artifacts
import tokenABI from "./ContractArtifacts/IERC20.json";
import { CollectionsOutlined } from "@mui/icons-material";

import IPFSComponent from "./IPFS";


const web3Modal = new Web3Modal({
  network: "ropsten",
  cacheProvider: false, // optional
  providerOptions // required
});

const ERC20_CONTRACT_ADDRESS = process.env.REACT_APP_ERC20_CONTRACT_ADDRESS;
const RECEIVER_WALLET = process.env.REACT_APP_RECEIVER_WALLET;

function App() {

  // Local State Variables - Use Redux for managing the state across the components
  // to know the state of the Web3 Provider
  const [provider, setProvider] = useState();
  const [library, setLibrary] = useState();
  const [account, setAccount] = useState();
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [chainId, setChainId] = useState();
  const [network, setNetwork] = useState();
  const [message, setMessage] = useState("");
  const [signedMessage, setSignedMessage] = useState("");
  const [verified, setVerified] = useState();
  const [balanceEth, setBalanceEth] = useState(0);
  const [balanceERC20, setBalanceERC20] = useState(0);


  const connectWallet = async () => {
    try {
      const provider = await web3Modal.connect();

      // provider.on("connect", (info) => {
      //   console.log("info - ", info);
      //   });

      const library = new ethers.providers.Web3Provider(provider);

      const accounts = await library.listAccounts();
      const network = await library.getNetwork();
      setProvider(provider);
      setLibrary(library);
      if (accounts) setAccount(accounts[0]);
      setChainId(network.chainId);

      // Get the Eth balance and the state variable
      if(accounts) {
        let bal = await library.getBalance(accounts[0]);
        setBalanceEth(bal.toString());

        // get ERC20 Balance
        bal = await getERC20Balance(accounts[0], library);
        setBalanceERC20(bal);

      } 

    } catch (error) {
      setError(error);
      console.log("base error ", error);
    }
  };



  const showWeb3Modal = () => {
    // if (web3Modal.cachedProvider) {
    //   connectWallet();
    // }
    connectWallet();

  }

  const refreshState = () => {
    setAccount();
    setChainId();
    setNetwork("");
    setMessage("");
    setSignature("");
    setVerified(undefined);
  };

  const disconnectWeb3Modal = async () => {

    await web3Modal.clearCachedProvider();
    refreshState();

  }

  const signMessage = async () => {
    if (!library) return;
    try {
      const signature = await library.provider.request({
        method: "personal_sign",
        params: [message, account]
      });
      setSignedMessage(message);
      setSignature(signature);
      console.log("Message - ", message);
      console.log("Signature - ", signature);
    } catch (error) {
      setError(error);
    }
  };

  const verifyMessage = async () => {
    if (!library) return;
    try {
      const verify = await library.provider.request({
        method: "personal_ecRecover",
        params: [signedMessage, signature]
      });
      setVerified(verify === account.toLowerCase());
      console.log("Message verification - ", verify, " == ", account.toLowerCase());
    } catch (error) {
      setError(error);
    }
  };

  const getERC20Balance = async (_walletAddress, _provider) => {

    //if (!library) return;
    let bal = 0;
    try {
    
      const erc20 = new ethers.Contract(ERC20_CONTRACT_ADDRESS, tokenABI, _provider);
      bal = (await erc20.balanceOf(_walletAddress)).toString();

    } catch (error) {
      setError(error);
    }
    return bal;

  }

  const transferERC20Token = async (_toAddress, _amount) => {

    try {
    
      const erc20 = new ethers.Contract(ERC20_CONTRACT_ADDRESS, tokenABI, library);

      const erc20_rw = new ethers.Contract(ERC20_CONTRACT_ADDRESS, tokenABI, library.getSigner());

      const txnHash = await erc20_rw.transfer(_toAddress, _amount);

      console.log("txnHash - ", txnHash);

      // Set the loading screen until the transaction is mined
      // await txnHash.wait();

    } catch (error) {
      setError(error);
    }


  }


  // This code is to enable the wallet connection while loading the page without any explicit connect operation from user
  // useEffect(() => {
  //   if (web3Modal.cachedProvider) {
  //     connectWallet();
  //   }
  // }, []);


  return (

    <div>
      <p>Click Connect button to connect to web3 wallet providers.</p>
      {
        !account ? (<Button onClick={showWeb3Modal}>Connect</Button>) : (<Button onClick={disconnectWeb3Modal}>Disconnect</Button>)
      }

      <Grid container spacing={16} justify="flex-start">

        <Grid item xs={12} sm={6} md={4} lg={4}>
          Connection Status: { !account ? (<CloseIcon />) : (<CheckCircleOutlineIcon />)}
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={4}>
          <p> Account Details :  </p>
          <p> {`Account: ${account}`} - {`Network ID: ${chainId ? chainId : "No Network"}`} </p>
          <p> {`Eth Balance (in Wei): ${balanceEth}`}</p>
          <p> {`ERC20 Balance (in Wei): ${balanceERC20}`}</p>

        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={4}>
          <p> Some user actions :  </p>
          <TextField id="message" value={message} onChange={(e) => setMessage(e.target.value)} />
          <Button onClick={signMessage}>Sign Message</Button>
          <Button onClick={verifyMessage}>Verify Message</Button>
          <Button onClick={() => transferERC20Token(RECEIVER_WALLET, "10000")}>ERC20 transfer</Button>

        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={4}>

          <p> IPFS Upload Demo :  </p>
          <IPFSComponent></IPFSComponent>

        </Grid>

      </Grid>

    </div>




  );
}

export default App;
