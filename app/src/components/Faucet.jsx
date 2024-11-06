import { useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Navigate } from "react-router-dom";
import Loader from "react-spinners/BarLoader";

import Contracts from "../contracts/data";
import Context from "../context/Context";
import { usdc, matic, metamask } from "../assets/icons/icons";

const Faucet = () => {
    const { userAccount, ethereum, web3, txValidator } = useContext(Context);

    const [ loading, setLoading ] = useState(false);

    const addUsdc = () => {
        toast.promise(
            ethereum.request({
                method: "wallet_watchAsset",
                params: {
                    type: "ERC20",
                    options: {
                        address: Contracts.USDCToken.address,
                        symbol: "USDC",
                        decimals: 6,
                        image: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=024"
                    }
                }
            }),
            {
                pending: "Adding USDC to the MetaMask",
                success: "USDC added to the MetaMask",
                error: "Failed to add"
            }
        );
    };

    const addWMatic = () => {
        toast.promise(
            ethereum.request({
                method: "wallet_watchAsset",
                params: {
                    type: "ERC20",
                    options: {
                        address: Contracts.WETHToken.address,
                        symbol: "WMatic",
                        decimals: 18,
                        image: "https://cryptologos.cc/logos/polygon-matic-logo.png?v=024"
                    }
                }
            }),
            {
                pending: "Adding WMatic to the MetaMask",
                success: "WMatic added to the MetaMask",
                error: "Failed to add"
            }
        );
    };

    const withdraw = async () => {
        if (await txValidator()) {
            try {
                setLoading(true);
    
                let to, from, value, chainId, Tx, data;
        
                const faucet = new web3.eth.Contract(
                    Contracts.USDCFaucet.abi,
                    Contracts.USDCFaucet.address
                );
        
                to = Contracts.USDCFaucet.address;
                from = userAccount;
                chainId = web3.utils.numberToHex(80001);
                value = "0x0";
                data = faucet.methods.withdraw(userAccount).encodeABI({});
        
                Tx = {
                    to,
                    from,
                    value,
                    data,
                    chainId
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
                          toast.success("Withdrawed", {
                            toastId: "tx confirmed"
                          });
                        } else if (isValid === false) {
                          toast.error("Failed to withdraw", {
                            toastId: "tx failed"
                          });  
                        } else {
                          toast.error("Somthing went wrong", {
                            toastId: "some error"
                          });
                        };
                    }),
                    {
                        pending: "Sending transaction",
                        success: "Transaction sent. Please wait for the lastest confirmation",
                        error: "Failed to send the transaction"
                    }
                );
                setLoading(false);
            } catch {
                setLoading(false);
            };
        } else {
            return false;
        };
    };

    useEffect(() => {
        toast.info("You can withdraw 10,000 USDCs per day", {
            toastId: "faucet warning"
        });
    }, []);

    return (
        <>
            {
                (userAccount != null) ? (
                    <section>
                        <div className="container-fluid">
                            <div className="row">
                                <div className="col-6 mx-auto mt-5 ml-5 mb-3">
                                    <div className="card text-center">
                                        <div className="card-header">
                                            <strong>USDC Faucet</strong>
                                        </div>
        
                                        <div className="card-body">
                                            <form>
                                                {
                                                    !loading ? (
                                                        <button onClick={withdraw} className="btn btn-outline-secondary btn-block form-control my-2">Withdraw 10,000 USDCs <img alt="usdc" width="20px" src={usdc}/></button>
                                                    ) : (
                                                        <div style={{ marginLeft: "43%", padding: "5px" }}>
                                                            <Loader />
                                                        </div>
                                                    )
                                                }
                                            </form>
                                        </div>
        
                                        <div className="card-footer">
                                            <span><img alt="usdc" width="20px" src={usdc}/> USDC token - <span onClick={e => {
                                                window.navigator.clipboard.writeText(e.target.innerText).then(() => {
                                                    toast.info("Copied", {
                                                        toastId: "USDC token's address"
                                                    });
                                                });
                                            }} style={{cursor: "pointer" }} >0x412D8C048af5Dd61CcF0F0E30A9Be529a25D1C88</span> - Add to <img width="20px" style={{cursor: "pointer" }} alt="metamask" src={metamask} onClick={e => {
                                                addUsdc();
                                            }}/></span> <br /><hr width="25%" style={{ marginLeft: "37%" }}/>

                                            <span><img alt="wmatic" width="20px" src={matic}/> Wrapped-Matic token - <span onClick={e => {
                                                window.navigator.clipboard.writeText(e.target.innerText).then(() => {
                                                    toast.info("Copied", {
                                                        toastId: "Wrapped-Matic token's address"
                                                    });
                                                });
                                            }} style={{cursor: "pointer" }} >0xb34c1A2d94D170B5559d0B9c34f5157752b3Dd56</span> - Add to <img width="20px" style={{cursor: "pointer" }} alt="metamask" src={metamask} onClick={e => {
                                                addWMatic();
                                            }}/></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                ) : (
                    <Navigate to="/marketplace"/>
                )
            }
        </>
    );
};

export default Faucet;