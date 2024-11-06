import { toast } from "react-toastify";
import { useContext, useState, useCallback } from "react";
import PropTypes from "prop-types";
import 'react-tooltip/dist/react-tooltip.css';
import { Tooltip } from 'react-tooltip';

import Contracts from "../../contracts/data";
import Context from "../../context/Context";

const MyReceivedNFTsChild = ({ nftName, nftDesc, nftImg, nftId, nftMintedTime, nftAddress }) => {
    const { ethereum, web3, userAccount, txValidator } = useContext(Context);

    const [ burnLoading, setBurnLoading ] = useState(false);
    const [ transferLoading, setTransferLoading ] = useState(false);
    const [ sellOrderLoading, setSellOrderLoading ] = useState(false);

    const [ recepient, setRecepient ] = useState(null);
    const [ price, setPrice ] = useState(null);
    const [ token, setToken ] = useState(null);

    const getCopyData = useCallback(() => {
        const Data = { nftName, nftDesc, nftImg, nftId, nftMintedTime: (new Date(nftMintedTime)).toLocaleString(), nftAddress };

        window.navigator.clipboard.writeText(JSON.stringify(Data)).then(() => {
            toast.info("NFT's full info copied !");
        }).catch(() => {
            toast.error("Failed to copy !", {
                toastId: "Failed to copy !"
            });
        });
    }, [ nftName, nftDesc, nftImg, nftId, nftMintedTime, nftAddress ]);

    const transfer = async () => {
        if (await txValidator()) {
            try {
                setTransferLoading(true);
                if (web3.utils.isAddress(recepient)) {
                    let to, from, Tx, chainId, value, data;

                    const nft = new web3.eth.Contract(
                        Contracts.ERC721.abi,
                        nftAddress
                    );
    
                    from = userAccount;
                    to = nftAddress;
                    data = nft.methods.transferFrom(userAccount, recepient, nftId).encodeABI({ from });
                    chainId = web3.utils.numberToHex(80001);
                    value = "0x0";
                    Tx = {
                        to,
                        from,
                        data,
                        chainId,
                        value
                    };

                    await toast.promise(
                        ethereum.request({
                            method: "eth_sendTransaction",
                            params: [Tx]
                        }).then(async txHash => {
                            let isValid = null;
                            while (isValid == null) {
                              let state = null;
                              
                              let receipt = await ethereum.request({
                                method: "eth_getTransactionReceipt",
                                params: [txHash]
                              });
        
                              if (receipt != null) {
                                if (receipt.status === "0x1") {
                                  state = true;
                                } else {
                                  state = false;
                                };
                              };
        
                              isValid = state;
                            };
        
                            if (isValid === true) {
                              toast.success("NFT transfered", {
                                toastId: "tx confirmed"
                              });
                            } else if (isValid === false) {
                              toast.error("Failed to transfer the nft", {
                                toastId: "tx failed"
                              });  
                            } else {
                              toast.error("Somthing went wrong", {
                                toastId: "some error"
                              });
                            };
                        }),
                        {
                            pending: "Sending the transaction",
                            success: "Transaction sent. Please wait for the latest confirmation",
                            error: "Failed to send the transaction"
                        }
                    );
                } else {
                    toast.warn("Please enter valid account address", {
                        toastId: "enter valid address"
                    });
                };
                setTransferLoading(false);
            } catch {
                setTransferLoading(false);
            };
        } else {
            return false;
        };
    };

    const burn = async () => {
        if (await txValidator()) {
            try {
                setBurnLoading(true);
    
                let to, from, data, chainId, value, Tx;
    
                const nft = new web3.eth.Contract(
                    Contracts.ERC721.abi,
                    nftAddress
                );
    
                from = userAccount;
                to = nftAddress;
                value = "0x0";
                chainId = web3.utils.numberToHex(80001);
                data = nft.methods.burn(web3.utils.toBN(nftId)).encodeABI({ from });
                Tx = {
                    from,
                    to,
                    value,
                    chainId,
                    data
                };
    
                await toast.promise(
                    ethereum.request({
                        method: "eth_sendTransaction",
                        params: [Tx]
                    }).then(async txHash => {
                        let isValid = null;
                        while (isValid == null) {
                          let state = null;
                          
                          let receipt = await ethereum.request({
                            method: "eth_getTransactionReceipt",
                            params: [txHash]
                          });
    
                          if (receipt != null) {
                            if (receipt.status === "0x1") {
                              state = true;
                            } else {
                              state = false;
                            };
                          };
    
                          isValid = state;
                        };
    
                        if (isValid === true) {
                          toast.success("NFT burnt", {
                            toastId: "tx confirmed"
                          });
                        } else if (isValid === false) {
                          toast.error("Failed to burn the nft", {
                            toastId: "tx failed"
                          });  
                        } else {
                          toast.error("Somthing went wrong", {
                            toastId: "some error"
                          });
                        };
                    }),
                    {
                        pending: "Sending the transaction",
                        success: "Transaction sent. Please wait for the latest confirmation",
                        error: "Failed to send the transaction"
                    }
                );
    
                setBurnLoading(false);
            } catch {
                setBurnLoading(false);
            };
        } else {
            return false;
        };
    };

    const sellOrder = async () => {
        if (await txValidator()) {
            try {
                setSellOrderLoading(true);
    
                let to, from, data, chainId, value, Tx;
    
                const nft = new web3.eth.Contract(
                    Contracts.ERC721.abi,
                    nftAddress
                );
    
                from = userAccount;
                to = nftAddress;
                value = "0x0";
                chainId = web3.utils.numberToHex(80001);
                data = nft.methods.approve(Contracts.MarketplaceProxy.address, nftId).encodeABI({ from });
                Tx = {
                    from,
                    to,
                    value,
                    chainId,
                    data
                };

                await toast.promise(
                    ethereum.request({
                        method: "eth_sendTransaction",
                        params: [Tx]
                    }).then(async txHash => {
                        let isValid = null;
                        while (isValid == null) {
                          let state = null;
                          
                          let receipt = await ethereum.request({
                            method: "eth_getTransactionReceipt",
                            params: [txHash]
                          });
    
                          if (receipt != null) {
                            if (receipt.status === "0x1") {
                              state = true;
                            } else {
                              state = false;
                            };
                          };
    
                          isValid = state;
                        };
    
                        if (isValid === true) {
                            toast.success("Marketplace approved", {
                                toastId: "tx confirmed"
                            });
                            
                            const Data = web3.eth.abi.encodeFunctionCall({
                                type: "function",
                                name: "decimals",
                                stateMutability: "view",
                                inputs: [],
                                outputs: [
                                    {
                                        type: "uint8",
                                        name: ""
                                    }
                                ]
                            }, []);

                            if (token == null) {
                                throw new Error("Please choose a token !");
                            };

                            const Decimals = await ethereum.request({
                                method: "eth_call",
                                params: [{
                                    to: token,
                                    data: Data,
                                    from
                                }]
                            });
                            const decimals = parseInt(Decimals, 16);

                            const marketplace = new web3.eth.Contract(
                                Contracts.MarketplaceImpV1.abi,
                                Contracts.MarketplaceProxy.address
                            );

                            let bnValue;
                            if (token === Contracts.WETHToken.address) {
                                bnValue = web3.utils.toBN(web3.utils.toWei(price, "ether"));
                            } else {
                                bnValue = web3.utils.toBN(Number(price).toFixed(0)).mul(web3.utils.toBN(Math.pow(10, decimals)));
                            };

                            to = Contracts.MarketplaceProxy.address;
                            data = marketplace.methods.createSellOrder(
                                nftAddress,
                                nftId,
                                token,
                                bnValue
                            ).encodeABI({ from });
        
                            Tx = {
                                from,
                                to,
                                value,
                                chainId,
                                data
                            };

                            toast.promise(
                                ethereum.request({
                                    method: "eth_sendTransaction",
                                    params: [Tx]
                                }).then(async txHash => {
                                    let isValid = null;
                                    while (isValid == null) {
                                      let state = null;
                                      
                                      let receipt = await ethereum.request({
                                        method: "eth_getTransactionReceipt",
                                        params: [txHash]
                                      });
                
                                      if (receipt != null) {
                                        if (receipt.status === "0x1") {
                                          state = true;
                                        } else {
                                          state = false;
                                        };
                                      };
                
                                      isValid = state;
                                    };
                
                                    if (isValid === true) {
                                      toast.success("Sell order created", {
                                        toastId: "tx confirmed"
                                      });
                                    } else if (isValid === false) {
                                      toast.error("Failed to create the sell order", {
                                        toastId: "tx failed"
                                      });  
                                    } else {
                                      toast.error("Somthing went wrong", {
                                        toastId: "some error"
                                      });
                                    };
                                }),
                                {
                                    pending: "Sending the transaction",
                                    success: "Transaction sent. Please wait for the latest confirmation",
                                    error: "Failed to send the transaction"
                                }
                            );
                        } else if (isValid === false) {
                            toast.error("Failed to approve the mrketplace", {
                                toastId: "tx failed"
                            });  
                        } else {
                            toast.error("Somthing went wrong", {
                                toastId: "some error"
                            });
                        };
                    }),
                    {
                        pending: "Sending the transaction",
                        success: "Transaction sent. Please wait for the latest confirmation",
                        error: "Failed to send the transaction"
                    }
                );
    
                setSellOrderLoading(false);
            } catch {
                setSellOrderLoading(false);
            };
        } else {
            return false;
        };
    };

    return (
        <>
            <div className="col-xl-3 col-md-6 col-sm-12 mt-5 ml-5 mb-3">
                <div className="card text-center shadow">
                    <div className="card-header">
                        <p className="card-title">NFT ID "{nftId}"</p>
                    </div>

                    <div className="card-body">
                        <img
                            className="rounded"
                            src={nftImg} 
                            width="100%"
                            alt="nft"
                            style={{ cursor: "pointer" }}
                            onClick={getCopyData}
                            id={`nftImg${nftId}`}
                        />
                        
                        <Tooltip
                            anchorId={`nftImg${nftId}`}
                            content={`Click to copy the nft data`}
                            place="top"
                            style={{
                                paddingTop: "2px",
                                paddingBottom: "2px",
                                paddingLeft: "7px",
                                paddingRight: "7px",
                                backgroundColor: "black"
                            }}
                        />
                        
                        <div className="accordion accordion-flush my-3" id={`accordion${nftMintedTime}`}>
                            <div className="accordion-item">
                                <h2 className="accordion-header" id="headingOne">
                                <button style={{ color: "black", backgroundColor: "transparent" }} className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target={`#collapseOne${nftMintedTime}`} aria-expanded="false" aria-controls="collapseOne">
                                    NFT information
                                </button>
                                </h2>
                                <div id={`collapseOne${nftMintedTime}`} className="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent={`#accordion${nftMintedTime}`}>
                                    <div className="accordion-body">
                                        <strong>Contract address</strong><p>{nftAddress}</p><hr />
                                        <strong>Name</strong><p>{nftName}</p><hr />
                                        <strong>Description</strong><p>{nftDesc}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="accordion-item">
                                <h2 className="accordion-header" id="headingOne">
                                <button style={{ color: "black", backgroundColor: "transparent" }} className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target={`#collapseOne${nftMintedTime}${nftMintedTime}`} aria-expanded="false" aria-controls="collapseOne">
                                    Transfer NFT
                                </button>
                                </h2>
                                <div id={`collapseOne${nftMintedTime}${nftMintedTime}`} className="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent={`#accordion${nftMintedTime}${nftMintedTime}`}>
                                    <div className="accordion-body">
                                        <div className="container-fluid">
                                            <div className="row">
                                                <input type="text" onChange={e => {
                                                    setRecepient(e.target.value);
                                                }} className="form-control mb-2" placeholder="Enter recepient address"/>

                                                {
                                                    !transferLoading ? (
                                                        <button className="btn btn-primary" onClick={transfer}>Transfer</button>
                                                    ) : (
                                                        <button className="btn btn-secondary" style={{ cursor: "progress" }}>Transfering.....</button>
                                                    )
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="accordion-item">
                                <h2 className="accordion-header" id="headingOne">
                                <button style={{ color: "black", backgroundColor: "transparent" }} className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target={`#collapseOne${nftMintedTime}${nftMintedTime}${nftMintedTime}`} aria-expanded="false" aria-controls="collapseOne">
                                    Burn NFT
                                </button>
                                </h2>
                                <div id={`collapseOne${nftMintedTime}${nftMintedTime}${nftMintedTime}`} className="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent={`#accordion${nftMintedTime}${nftMintedTime}${nftMintedTime}`}>
                                    <div className="accordion-body">
                                        <div className="container-fluid">
                                            <div className="row">
                                                {
                                                    !burnLoading ? (
                                                        <button className="btn btn-danger" onClick={burn}>🔥Burn</button>
                                                    ) : (
                                                        <button className="btn btn-secondary" style={{ cursor: "progress" }}>🔥Burning.....</button>
                                                    )
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="accordion-item">
                                <h2 className="accordion-header" id="headingOne">
                                <button style={{ color: "black", backgroundColor: "transparent" }} className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target={`#collapseOne${nftMintedTime}${nftMintedTime}${nftMintedTime}${nftMintedTime}`} aria-expanded="false" aria-controls="collapseOne">
                                    Create Sell-Order
                                </button>
                                </h2>
                                <div id={`collapseOne${nftMintedTime}${nftMintedTime}${nftMintedTime}${nftMintedTime}`} className="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent={`#accordion${nftMintedTime}${nftMintedTime}${nftMintedTime}${nftMintedTime}`}>
                                    <div className="accordion-body">
                                        <div className="container-fluid">
                                            <div className="row">
                                                <input type="number" min={0} className="form-control mb-2" placeholder="Enter order price" onChange={e => {
                                                    setPrice(e.target.value);
                                                }}/>

                                                <select className="form-control my-2" onChange={e => {
                                                    setToken(e.target.value);
                                                }}>
                                                    <option value={null}>
                                                        Choose a token
                                                    </option>
                                                    
                                                    {
                                                        (Contracts.Tokens).map((token, index) => (
                                                            <option key={index} value={token.address}>
                                                                {token.name}
                                                            </option>
                                                        ))
                                                    }
                                                </select>

                                                {
                                                    !sellOrderLoading ?  (
                                                        <button className="btn btn-dark btn-block" onClick={sellOrder}>Create</button>
                                                    ) : (
                                                        <button className="btn btn-secondary btn-block" style={{ cursor: "progress" }}>Creating.....</button>
                                                    )
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-footer">
                        Mint time - {(new Date(nftMintedTime)).toLocaleString()}
                    </div>
                </div>
            </div>
        </>
    );
};

MyReceivedNFTsChild.propTypes = {
    nftName: PropTypes.string,
    nftDesc: PropTypes.string,
    nftImg: PropTypes.string,
    nftId: PropTypes.number,
    nftMintedTime: PropTypes.number,
    nftAddress: PropTypes.string
};

export default MyReceivedNFTsChild;