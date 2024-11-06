import { Navigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import ScaleLoader from "react-spinners/ScaleLoader";
import BounceLoader from "react-spinners/BounceLoader"; 
import PacmanLoader from "react-spinners/PacmanLoader";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

import Contracts from "../contracts/data";
import CollectionNftsChild from "./child components/CollectionNftsChild";
import Context from "../context/Context";

const CollectionNfts = ({ state }) => {
    const { userAccount, web3, ethereum, callValidator } = useContext(Context);

    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(false);
    const [ nothingFound, setNothingFound ] = useState(false);
    const [ nfts, setNfts ] = useState([]);
    const [ userNftContract, setUserNftContract ] = useState(null);

    useEffect(() => {
        if (userAccount == null) {
            toast.warn("Please connect your wallet to continue", {
                toastId: "Please connect your wallet to continue"
            });
        } else {
            if (!state) {
                toast.warn("Please create your collection first", {
                    toastId: "Please create your collection first"
                });
            } else {
                const init = async () => {
                    try {
                        let from, to, data, chainId, Call, res;
                
                        const imp = new web3.eth.Contract(
                            Contracts.MarketplaceImpV1.abi,
                            Contracts.MarketplaceImpV1.address
                        );
                    
                        from = userAccount;
                        to = Contracts.MarketplaceProxy.address;
                        chainId = web3.utils.numberToHex("80001");
                        data = imp.methods.getUserContract(userAccount).encodeABI();
                        Call = {
                            from,
                            to,
                            data,
                            chainId
                        };
                    
                        res = await ethereum.request({
                            method: "eth_call",
                            params: [Call]
                        });
                        const userNFTAddr = `0x${String(res).slice(26, 66)}`;
                
                        setUserNftContract(userNFTAddr);
                    
                        const nft = new web3.eth.Contract(
                            Contracts.ERC721.abi,
                            userNFTAddr
                        );
                    
                        to = userNFTAddr;
                        data = nft.methods.getTokenCount().encodeABI();
                        Call = {
                            from,
                            to,
                            data,
                            chainId
                        };
                        res = await ethereum.request({
                            method: "eth_call",
                            params: [Call]
                        });
                        const totalNfts = parseInt(res, 16);
                    
                        const validNfts = [];
                        for (let count = 1; count < totalNfts; count++) {
                            data = nft.methods.ownerOf(web3.utils.toBN(count)).encodeABI();
                            Call = {
                                from,
                                to,
                                data,
                                chainId
                            };
                    
                            let owner = await ethereum.request({
                                method: "eth_call",
                                params: [Call]
                            });
                            let ownerAddr = `0x${String(owner).slice(26, 66)}`;
                    
                            if (web3.utils.toChecksumAddress(ownerAddr) === userAccount) {
                                validNfts.push(count);
                            };
                        };
                
                        if (validNfts.length > 0) {
                            const info = validNfts.map(async tokenId => {
                                let response = await nft.methods.tokenURI(web3.utils.toBN(tokenId)).call({});
                        
                                return response;
                            });
                            const info2 = await Promise.all(info);
                                    
                            const info3 = info2.map(url => {
                                let response;
                                        
                                response = fetch(url).then(res => res.text());
                    
                                return response;
                            });
                            const info4 = await Promise.all(info3);
                                    
                            const info5 = info4.map(val => JSON.parse(val));
                            const info6 = await Promise.all(info5);
                                    
                            const info7 = info6.map((val, index) => {
                                val.image = `https://nftstorage.link/ipfs/${String(val.image).slice(7, (val.image).length)}`;
                                val.tokenId = validNfts[index];
                                return val;
                            });
                            
                            setNfts(await Promise.all(info7));
                        } else {
                            toast.warn("You have nothing to show", {
                                toastId: "nothing to show"
                            });
                            setLoading(false);
                            setNothingFound(true);
                        };
                
                        setLoading(false);
                    } catch {
                        toast.error("Failed to load your NFTs", {
                            toastId: "filed to load nfts"
                        });
                        setLoading(false);
                        setError(true);
                    };
                };
            
                init();
            };
        };
    }, [ ethereum, userAccount, web3, callValidator, state ]);

    return (
        <>
            {
                nothingFound ? (
                    <div className="col-1 mx-auto" style={{ marginTop: "12%" }}>
                        <PacmanLoader
                            color="black"
                            size={30}
                        />
                    </div>
                ) : (null)
            }

            {
                error ? (
                    <div className="col-1 mx-auto" style={{ marginTop: "12%" }}>
                        <BounceLoader
                            color="red"
                            size={70}
                        />
                    </div>
                ) : (null)
            }

            {
                (state && userAccount != null) ? (
                    <section>
                        {
                            loading ? (
                                <div className="col-1 mx-auto" style={{ marginTop: "12%" }}>
                                    <ScaleLoader
                                        color="black"
                                        height={65}
                                        width={7}
                                    />
                                </div>
                            ) : (
                                <div className="container-fluid">
                                    <div className="row">
                                        {
                                            nfts.map((nft, index) => (
                                                <CollectionNftsChild
                                                    nftAddress={userNftContract}
                                                    nftName={nft.name}
                                                    nftDesc={nft.description}
                                                    nftImg={nft.image}
                                                    nftId={nft.tokenId}
                                                    nftMintedTime={nft.time}
                                                    key={index}
                                                />
                                            ))
                                        }
                                    </div>
                                </div>
                            )
                        }
                    </section>
                ) : (
                    <Navigate to="/marketplace"/>
                )
            }
        </>
    );
};

CollectionNfts.propTypes = {
    state: PropTypes.bool
};

export default CollectionNfts;