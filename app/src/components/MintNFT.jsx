import { useState, useRef, useContext } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { NFTStorage, File } from "nft.storage";

import Context from "../context/Context";
import Contracts from "../contracts/data";

const MintNFT = ({ state }) => {
    const { userAccount, txValidator, ethereum, web3 } = useContext(Context);

    const navigate = useNavigate();

    const uploadedImg = useRef(); //? We can access to all attributes of the current element
    //? Like => element.current.focus(), element.current (value), element.current.src, ...

    const [ name, setName ] = useState(null);
    const [ desc, setDesc ] = useState(null);
    const [ img, setImg ] = useState(null); //? Only valid formats => png, jpeg, jpg, gif

    const [ loading, setLoading ] = useState(false);
      
    const mint = async (name, desc, img) => {
        try {
            setLoading(true);

            if (await txValidator()) {
                if (name != null && desc != null && img != null) {
                  if (String(name).length > 0 && String(desc).length > 0) {
                    if (
                      img.type === "image/png" ||
                      img.type === "image/jpeg" ||
                      img.type === "image/jpg" ||
                      img.type === "image/gif"
                    ) {
                        let to, from, data;
      
                        const imp = new web3.eth.Contract(
                          Contracts.MarketplaceImpV1.abi,
                          Contracts.MarketplaceImpV1.address,
                        );
          
                        //? get user nft collection address
                        to = Contracts.MarketplaceProxy.address;
                        from = userAccount;
                        data = imp.methods.getUserContract(userAccount).encodeABI();
                        const Call = {
                          from,
                          to,
                          data
                        };
          
                        const res = await ethereum.request({
                          method: "eth_call",
                          params: [Call]
                        });
                        const userNFTAddr = `0x${String(res).slice(26, 66)}`;
          
                        //? upload nft data to IPFS
                        const client = new NFTStorage({
                          token: "<API_KEY>"
                        });
                        const file = new File([ img ], img.name, { type: img.type });
          
                        await toast.promise(
                          client.store({
                            name,
                            description: desc,
                            image: file,
                            minter: userAccount,
                            time: (new Date()).getTime()
                          }).then(metadata => {
                            const url = `https://nftstorage.link/ipfs/${String(metadata.url).slice(7, 80)}`;
          
                            //? send tx to mint a new nft behold the user
                            const nft = new web3.eth.Contract(
                              Contracts.ERC721.abi,
                              userNFTAddr
                            );
          
                            let value, chainId;
          
                            to = userNFTAddr;
                            from = userAccount;
                            value = "0x0";
                            chainId = web3.utils.numberToHex("80001");
                            data = nft.methods.mint(url).encodeABI({ from });
                            const Tx = {
                              to,
                              from,
                              data,
                              value,
                              chainId
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

                                    setLoading(false);
            
                                    if (isValid === true) {
                                      toast.success("NFT minted", {
                                          toastId: "tx confirmed"
                                      });
                                      navigate("/collectionsNFTs");
                                    } else if (isValid === false) {
                                      toast.error("Failed to mint the nft", {
                                          toastId: "tx failed"
                                      });  
                                    } else {
                                      toast.error("Somthing went wrong", {
                                          toastId: "some error"
                                      });
                                    };
                                }).catch(() => {
                                    setLoading(false);
                                }),
                                {
                                    pending: "Sending the transaction",
                                    success: "Transaction sent. Please wait for the last confirmation",
                                    error: "Failed to send the transaction"
                                }
                            );
                          }),
                          {
                            pending: "Uploading nft data to IPFS",
                            success: "Data uploaded. Please wait for nft minting",
                            error: "Failed to upload data"
                          }
                        );
                    } else {
                      toast.warn("Please enter valid files. You can only upload image type files", {
                        toastId: "only image"
                      });
                      setLoading(false);
                      return false;
                    }
                  } else {
                    toast.warn("Please enter valid name and description", {
                      toastId: "valid name and desc"
                    });
                    setLoading(false);
                    return false;
                  }
                } else {
                  toast.warn("Please fill all inputs", {
                    toastId: "fill all inputs"
                  });
                  setLoading(false);
                  return false;
                }
              } else {
                setLoading(false);
                return false;
              };
        } catch {
            setLoading(false);
        };
    };

    return (
        <>
            {
                (state && userAccount != null) ? (
                    <section>
                        <div className="container-fluid">
                            <div className="row">
                                <div className="col-6 mx-auto mt-5">
                                    <div className="card">
                                        <div className="card-header text-center">
                                            Mint NFT
                                        </div>
                
                                        <div className="card-body">
                                            <form>
                                                <input type="text" className="form-control mb-3" placeholder="Enter nft's name" onChange={e => {
                                                    setName(e.target.value);
                                                }}/>
        
                                                <textarea className="form-control mb-3" style={{ height: "120px" }} placeholder="Enter nft's description" onChange={e => {
                                                    setDesc(e.target.value);
                                                }}></textarea>
        
                                                <input type="file" className="form-control mb-4" onChange={e => {
                                                    const imageFile = e.target.files[0];
                                                    setImg(imageFile);
        
                                                    const file = new FileReader();
                                                    file.readAsDataURL(imageFile);
        
                                                    file.onload = () => {
                                                        uploadedImg.current.src = file.result;
                                                        uploadedImg.current.title = imageFile.name;
                                                    };
                                                }}/>
        
                                                {
                                                    img != null ? (
                                                        <img className="rounded shadow" alt="uploadedImage" style={{
                                                            marginLeft: "25%",
                                                            marginBottom: "20px"
                                                        }} ref={uploadedImg} width="50%"/>
                                                    ) : (null)
                                                }
                                                
                                                {
                                                    !loading ? (
                                                        <p className="form-control btn btn-primary btn-block" onClick={async () => {
                                                            await mint(
                                                                name,
                                                                desc,
                                                                img
                                                            );
                                                        }}>Mint</p>
                                                    ) : (
                                                        <p className="form-control btn btn-secondary btn-block">Minting.....</p>
                                                    )
                                                }

                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                ) : (
                    <Navigate to="marketplace"/>
                )        
            }
        </>
    );
};

MintNFT.propTypes = {
    state: PropTypes.bool
};

export default MintNFT;
