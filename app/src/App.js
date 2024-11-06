import { useState, useEffect, useMemo, useCallback } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createAlchemyWeb3 } from "@alch/alchemy-web3";
import Web3 from "web3";

import NotFound from './components/NotFound';
import Navbar from "./components/Navbar";
import Index from "./components/Index";
import Contracts from "./contracts/data";
import CreateCollection from "./components/CreateCollection";
import MintNFT from "./components/MintNFT";
import CollectionNfts from "./components/CollectionNfts";
import Faucet from "./components/Faucet";
import MySellOrders from "./components/MySellOrders";
import Bid from "./components/Bid";
import MyBids from "./components/MyBids";
import SellOrderDetails from "./components/SellOrderDetails";
import MyBougthNFTs from "./components/MyBougthNFTs";
import MyReceivedNFTs from "./components/MyReceivedNFTs";
import SearchSellOrder from "./components/SearchSellOrder";

import Context from "./context/Context";


const App = () => {
  const [ userAccount, setUserAccount ] = useState(null);
  const [ state, setState ] = useState(false);
  const [ connecting, setConnecting ] = useState(false);

  const web3 = useMemo(() => new Web3(window.ethereum), []);

  const web3Http = useMemo(() => createAlchemyWeb3(
    "<API_KEY>"
  ), []);
  
  const web3Ws = useMemo(() => createAlchemyWeb3(
    "<API_KEY>"
  ), []);

  const { ethereum } = window;

  const connect = useCallback(async () => {
    setConnecting(true);

    await toast.promise(
      ethereum.request({
        method: "eth_requestAccounts",
        params: []
      }).then(([ account ]) => {
        if (account) {
          setUserAccount(
            web3Http.utils.toChecksumAddress(account)
          );
        } else {
          toast.error("Failed to fetch your account", {
            toastId: "cannot fetch user account (1)"
          });
        }
      }).catch(() => {
        toast.error("Failed to fetch your account. Please try again", {
          toastId: "cannot fetch user account (2)"
        });
      }),
      {
        pending: "Connecting your wallet to the marketplace",
        success: "Wallet connected",
        error: "Failed to connected your wallet"
      }
    );

    setConnecting(false);
  }, [ ethereum, web3Http ]);

  // internal method
  const addPolygonChain = useCallback(() => {
    try {
      toast.promise(
        ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{
            chainId: `${web3.utils.toHex(80001)}`
          }]
        }),
        {
          pending: "Switching to Polygin-Mumbai chain",
          success: "You are connected to the chain",
          error: "Connection failed"
        }
      );

      return true;
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          const chainMetadata = {
            chainId: `0x${Number(80001).toString(16)}`,
            chainName: "Polygon Mumbia (Testnet)",
            nativeCurrency: {
              name: "MATIC",
              "symbol": "MATIC",
              decimals: 18
            },
            rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
            blockExplorerUrls: ["https://mumbai.polygonscan.com"]
          };
  
          toast.promise(
            ethereum.request({
              method: "wallet_addEthereumChain",
              params: [chainMetadata]
            }),
            {
              pending: "Adding and connecting to Polygin-Mumbai chain",
              success: "You are connected to the chain",
              error: "Connection failed"
            }
          );
          
          return true;
        } catch (error) {
          toast.warn("Error in adding polygon to your wallet", {
            toastId: "Error in adding polygon to your wallet"
          });
          console.warn("Error =>", error.message);
          return false;
        }
      } else {
        toast.warn("Unexpected error while switching chian occured", {
          toastId: "Unexpected error while switching chian occured"
        });
        return false;
      }
    };
  }, [ ethereum, web3 ]);

  // for methods that need to send tx
  const validator_tx = useCallback(async () => {
    if (userAccount != null) {
      if (await ethereum.isMetaMask) {
        if (await ethereum.isConnected()) {
          if (await ethereum.networkVersion === "80001") { // Polygon-Mumbai-Testnet
            if (await ethereum._state.isUnlocked) {
              return true;
            } else {
              toast.warn("Please unlock your wallet", {
                toastId: "Please unlock your wallet"
              });
              return false;
            }
          } else {
            toast.info("Please change your chain to Polygin-Mumbai OR click here to change it", {
              onClick: addPolygonChain,
              toastId: "Please change your chain to Polygin-Mumbai OR click here to change it"
            });
            return false;
          }
        } else {
          toast.error("Please check your network, you are not connected to the blockchain", {
            toastId: "Please check your network, you are not connected to the blockchain"
          });
          return false;
        }
      } else {
        toast.warn("Please install MetaMask. We only support MetaMask right now", {
          toastId: "Please install MetaMask. We only support MetaMask right now"
        });
        return false;
      }
    } else {
      toast.warn("Please connect your wallet", {
        toastId: "Please connect your wallet"
      });
      return false;
    }
  }, [ addPolygonChain, ethereum, userAccount ]);

  // for methods that only reads from blockchain
  const validator_call = useCallback(async (path = null) => {
    if (userAccount != null) {
      if (await ethereum.isMetaMask) {
        if (await ethereum.networkVersion === "80001") { // Polygon-Mumbai-Testnet
          return true
        } else {
          toast.info("Please change your chain to Polygin-Mumbai OR click here to change it", {
            onClick: addPolygonChain,
            toastId: "switch to correct chain (polygon-mumbai)"
          });
          return false;
        };
      } else {
        toast.warn("Please install MetaMask. We only support MetaMask right now", {
          toastId: "Please install MetaMask. We only support MetaMask right now"
        });
        return false;
      };
    } else {
      toast.warn("Please connect your wallet", {
        toastId: "Please connect your wallet"
      });
      return false;
    };
  }
  , [ addPolygonChain, ethereum, userAccount ]);

  const createCollection = useCallback(async (name, symbol, desc) => {
    if (await validator_tx()) {
      if (
        name != null &&
        symbol != null &&
        desc != null &&
        String(name).length > 0 &&
        String(symbol).length > 0 &&
        String(desc).length > 0
      ) {
        const to = Contracts.MarketplaceProxy.address;
        const from = userAccount;
        const chainId = web3.utils.numberToHex("80001");
        const value = "0x0";
        const data = web3.eth.abi.encodeFunctionCall({
          type: "function",
          name: "createERC721Contract",
          stateMutability: "nonpayable",
          inputs: [
            {
              type: "string",
              name: "_collectionName"
            },
            {
              type: "string",
              name: "_collectionSymbol"
            },
            {
              type: "string",
              name: "_collectionDescription"
            },
            {
              type: "address",
              name: "_factory"
            }
          ],
          outputs: []
        }, [name, symbol, desc, Contracts.ERC721Factory.address]);
    
        const Tx = {
          from,
          to,
          value,
          data,
          chainId
        }

        toast.promise(
          ethereum.request({
            method: "eth_sendTransaction",
            params: [Tx]
          }).then(async txHash => {
            let isValid = null;
            while (isValid == null) {
              let state = null;

              await ethereum.request({
                method: "eth_getTransactionReceipt",
                params: [txHash]
              }).then(res => {
                if (res != null) {
                  if (res.status === "0x1") {
                    state = true;
                  } else {
                    state = false;
                  };
                };
              });

              isValid = state;
            };

            if (isValid === true) {
              toast.success("Collection created", {
                toastId: "successful collection creation"
              });
            } else if (isValid === false) {
              toast.error("Collection creation failed", {
                toastId: "collection creating failed"
              });
            } else {
              toast.warn("Somthing went wrong", {
                toastId: "unkown error"
              });
            };
          }),
          {
            pending: "Sending transaction",
            success: "Transaciion sent. Please wait for the last confirmation",
            error: "Failed to send transaction"
          }
        );
      } else {
        toast.warn("Please enter valid inputs", {
          toastId: "invalid data for collection creation"
        });
        return false;
      }
    } else {
      return false;
    }
  }, [ validator_tx, ethereum, web3, userAccount ]);

  useMemo(() => {
    ethereum.on("chainChanged", () => {
      toast.warn("You have changed your chain. Click to switch it to the correct chain", {
        toastId: "Chain Changed",
        onClick: addPolygonChain
      });
    });
  }, [ addPolygonChain, ethereum ]);

  useEffect(() => {
    toast.info("We recommand you to use MetaMask as your web3 wallet. Please connect to Polygon Mumbai testnet", {
      toastId: "Recommand"
    });
  }, []);

  useEffect(() => {
    if (userAccount != null) {
      console.log(`Connected account => ${userAccount}.`);

      ethereum.on("accountsChanged", () => {
        if (ethereum.selectedAddress == null) {
          toast.warn("Your wallet has been locked. Click to unlock it", {
            onClick: connect,
            toastId: "AccountChanged"
          });
        } else {
          toast.warn("You have changed your account. Click to connect again", {
            onClick: connect,
            toastId: "AccountChanged"
          });
        };
      });

      const init = async () => {
        const imp = new web3.eth.Contract(
          Contracts.MarketplaceImpV1.abi,
          Contracts.MarketplaceImpV1.address
        );

        const to = Contracts.MarketplaceProxy.address;
        const from = userAccount;
        const chainId = web3.utils.numberToHex("80001");
        const data = imp.methods.getUserContract(userAccount).encodeABI();

        const Call = {
            from,
            to,
            data,
            chainId
        };

        try {
            const res = await ethereum.request({
                method: "eth_call",
                params: [Call]
            });

            const addressZero = "0x0000000000000000000000000000000000000000000000000000000000000000";
            
            setState(
              res === addressZero ? false : true
            );
        } catch (err) {
            console.warn("Error occured!");
        }
      };

      init();
    } else {
      console.warn("MetaMask wallet is not connected !");
    }
  }, [ userAccount, ethereum, web3, connect ]);

  return (
    <Context.Provider
      value={{
        ethereum,
        web3,
        web3Http,
        web3Ws,
        userAccount,
        txValidator: validator_tx,
        callValidator: validator_call
      }}
    >
      <>
        <Navbar connect={connect} state={state} connecting={connecting}/>
        <Routes>
          <Route path="/" element={<Navigate to="/marketplace"/>} />
          <Route path="/marketplace" element={<Index />} />
          <Route path="/createCollection"
          element=
          {<CreateCollection
            send={createCollection}
            state={state}/>
          }/>
          <Route path="/mintNft" element={<MintNFT state={state}/>}/>
          <Route path="/collectionsNFTs" element={<CollectionNfts state={state}/>}/>
          <Route path="/faucet" element={<Faucet />}/>
          <Route path="/mySellOrders" element={<MySellOrders />}/>
          <Route path="/bid/:sellOrderId" element={<Bid />}/>
          <Route path="/myBids" element={<MyBids />}/>
          <Route path="/mySellOrderDetails/:sellOrderId" element={<SellOrderDetails />}/>
          <Route path="/myBougthNfts" element={<MyBougthNFTs />}/>
          <Route path="/MyReceivedNfts" element={<MyReceivedNFTs />}/>
          <Route path="/SearchSellOrder" element={<SearchSellOrder />}/>

          <Route path='*' element={<NotFound />}/>
        </Routes>
      </>
    </Context.Provider>
  );
};

export default App;
