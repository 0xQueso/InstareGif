import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import {useEffect, useState} from "react";
import idl from './utils/idl.json';
import {clusterApiUrl, Connection, PublicKey} from "@solana/web3.js";
import {Program, Provider, web3} from "@project-serum/anchor";
import kp from './utils/keypair.json';

const TWITTER_HANDLE = '0xqueso';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const {SystemProgram} = web3;

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

const programID = new PublicKey(idl.metadata.address);

const network = (clusterApiUrl('devnet'));

const opts = {
  preflightCommitment: "processed"
}

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  const isWalletConnected = async () => {
    try {
      const { solana } = window;
      if (solana) {
        if (solana.isPhantom) {
          console.log("wallet here");
          const response = await solana.connect({onlyIfTrusted: true});
          console.log('connected with public key: ', response.publicKey.toString());
          console.log('ping: ',baseAccount.publicKey.toString());
          setWalletAddress(response.publicKey.toString());
        } else {
          alert("need to be on solana wallet");
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  const connectWallet = async () => {
    const {solana} = window;
    if (solana) {
      const response = await solana.connect();
      console.log('connected here:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);

    const provider = new Provider(
        connection, window.solana, opts.preflightCommitment,
    )
    return provider;
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log('ping');
      console.log('provider wallet ', provider.wallet.publicKey);
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });

      console.log("Created a new BaseAccount with address:", baseAccount.publicKey.toString());
      await getGifList();
    } catch (e) {

    }
  }

  const getGifList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      const {gifList} = account;
      console.log('lst here', gifList);

      console.log('got the account: ', account);
      setGifList(account.gifList);
    } catch (e) {
      console.log('error: ', e);
      setGifList(null);
    }
  }

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("no input")
      return;
    }
      console.log('Gif link:', inputValue);
    try {
     const provider = getProvider();
     const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      })
      console.log("successfully sent to program ", inputValue);
      await getGifList();
       } catch (e) {
      console.log('error: ', e);
    }
  };

  const renderNotConnectedContainer = () => (
      <button
          className="cta-button connect-wallet-button"
          onClick={connectWallet}
      >
        Connect to Wallet
      </button>
  );

  const renderConnectedContainer = () => {
    if (gifList === null) {
      return(
          <div className="connected-container">
            <button className="cta-button submit-gif-button" onClick={createGifAccount}>
              Do One-Time Initialization For GIF Program Account
            </button>
          </div>
      )
    } else {
        return (
        <div className="connected-container">
          <input type="text" placeholder="Enter gif link!" value={inputValue} onChange={onInputChange}/>
          <button className="cta-button submit-gif-button" onClick={sendGif}>Submit</button>
          <div className="gif-grid">
            {gifList.map((item, index) => (
                <div className="gif-item" key={index}>
                  <img src={item.gifLink} />
                </div>
            ))}
          </div>
        </div>)
      }
  };

  useEffect(() => {
    window.addEventListener('load', async (event) => {
      await isWalletConnected();
    })
  }, [])

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');

      getGifList();
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🖼 InstareGif</p>
          <p className="sub-text">
            Connect to view Gifs ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
