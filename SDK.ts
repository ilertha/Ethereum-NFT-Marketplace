import Web3 from "web3";
import { BN } from "bn.js";

type bn = typeof BN;


// interface ISellOrder {
//     0: string,
//     1: string,
//     2: string,
//     3: number,
//     4: string,
//     5: number,
//     6: number,
//     7: number,
//     8: boolean,
//     9: boolean,
//     seller: string,
//     token: string,
//     contractAddr: string,
//     nftId: number,
//     buyer: string,
//     price: number,
//     startedAt: number,
//     endedAt: number,
//     isCanceled: boolean,
//     isEnded: boolean
// };

// interface IBid {
//     0: string,
//     1: string,
//     2: string,
//     3: number,
//     4: number,
//     5: number,
//     6: number,
//     7: boolean,
//     8: boolean,
//     bidder: string,
//     token: string,
//     nftOwner: string,
//     sellOrderId: number,
//     price: number,
//     biddedAt: number,
//     bidEndedAt: number,
//     isCanceled: boolean,
//     isEnded: boolean
// };

interface ISDK {
    // Marketplace methods
    createSellOrder: (
        _contractAddress: string,
        _nftId: string | bn,
        _token: string,
        _price: string | bn
    ) => Promise<any>;

    createBid: (
        _orderId: string | bn,
        _token: string,
        _price: string | bn
    ) => Promise<any>;

    acceptBid: (
        _bidId: string | bn,
        _orderId: string | bn
    ) => Promise<any>;

    cancelBid: (
        _bidId: string | bn
    ) => Promise<any>;

    cancelSellOrder: (
        _orderId: string | bn
    ) => Promise<any>;

    createERC721Contract: (
        _collectionName: string,
        _collectionSymbol: string,
        _collectionDescription: string,
        _factory: string
    ) => Promise<any>;

    getSellOrderDetails: (
        _sellOrderId: string | bn
    ) => Promise<any>; // SellOrder

    getBidDetails: (
        _bidId: string | bn
    ) => Promise<any>; // BidId

    getUserContract: (
        _user: string
    ) => Promise<any>;
};

class SDK implements ISDK {
    private readonly ABI: any[];
    private readonly Address: string;
    private readonly Marketplace: any;
    private readonly Web3Js: Web3;
    private readonly userAccount: string;

    constructor(
        _abi: any[],
        _address: string,
        _web3JsHttps: Web3, //! Extention Wallet Provider ---pass--> new Web3(window.ethereum)
        _userAccount: string
    ) {
	if (
		!_web3JsHttps.utils.isAddress(_userAccount) &&
		!_web3JsHttps.utils.isAddress(_address)
	) {
		throw new Error("Invalid address entered!");
	};
		
        this.ABI = _abi;
        this.Address = _address as string,
        this.Web3Js = _web3JsHttps;
        this.userAccount = _userAccount as string;
        
        this.Marketplace = new this.Web3Js.eth.Contract(
            this.ABI,
            this.Address,
            {
                from: this.userAccount
            }
        );
    };

    public static async waitTx(
        _txHash: string,
        _web3Provider: string //! Pass wallet provider like MetaMask
    ): Promise<void> {
        try {
            const web3 = new Web3(_web3Provider); //! Window.ethereum

            let info: any;

	    while(!info) {
		const res = await web3.eth.getTransactionReceipt(_txHash);

		info = res ?? undefined;
	    };

	    if (info) {
		if (info.status) {
		  console.log("Transaction Mined successfully .");

                  Promise.resolve(
                       {
                           mined: true,
                           status: true
                       }
                  );
		} else {
		   console.log("Transaction Mined BUT failed .");

                   Promise.resolve(
                      {
                          mined: true,
                          status: false
                      }
                   );
		};
	   } else {
		  console.warn("Error while wating for the transaction to be mined !");

                  Promise.reject(null);
	   };
        } catch {
            console.error("Error occured while wating for the transaction to be mine !");

            Promise.reject(false);
        };
    };

    public async createSellOrder(
        _contractAddress: string,
        _nftId: string | bn,
        _token: string,
        _price: string | bn
    ): Promise<any> {
        try {
	    if (
		!this.Web3Js.utils.isAddress(_contractAddress) &&
		!this.Web3Js.utils.isAddress(_token)
	    ) {
		throw new Error("Invalid address entered!");
	    };
		
            const receipt = await this.Marketplace.methods.createSellOrder(
                _contractAddress,
                _nftId,
                _token,
                _price
            ).send();

            Promise.resolve(
                {
                    mined: true,
                    txReceipt: receipt
                }
            );
        } catch {
            console.error("Error occured while trying to create the sell-order !");

            Promise.reject(false);
        };
    };

    public async createBid(
        _orderId: string | bn,
        _token: string,
        _price: string | bn
    ): Promise<any> {
        try {
	    if (
		!this.Web3Js.utils.isAddress(_token)
	    ) {
		throw new Error("Invalid address entered!");
	    };
		
            const receipt = await this.Marketplace.methods.createBid(
                _orderId,
                _token,
                _price
            ).send();

            Promise.resolve(
                {
                    mined: true,
                    txReceipt: receipt
                }
            );
        } catch {
            console.error("Error occured while tying to create the bid !");

            Promise.reject(false);
        };
    };

    public async acceptBid(
        _bidId: string | bn,
        _orderId: string | bn
    ): Promise<any> {
        try {
            const receipt = await this.Marketplace.methods.acceptBid(
                _bidId,
                _orderId
            ).send();

            Promise.resolve(
                {
                    mined: true,
                    txReceipt: receipt
                }
            );
        } catch {
            console.error("Error occured while accepting the bid !");

            Promise.reject(false);
        };
    };

    public async cancelBid(
        _bidId: string | bn
    ): Promise<any> {
        try {
            const receipt = await this.Marketplace.methods.cancelBid(_bidId).send();

            Promise.resolve(
                {
                    mined: true,
                    txReceipt: receipt
                }
            );
        } catch {
            console.error("Error occured while trying to cancel the bid !");

            Promise.reject(false);
        };
    };

    public async cancelSellOrder(
        _orderId: string | bn
    ): Promise<any> {
        try {
            const receipt = await this.Marketplace.methods.cancelSellOrder(_orderId).send();

            Promise.resolve(
                {
                    mined: true,
                    txReceipt: receipt
                }
            );
        } catch {
            console.error("Error occured while trying to cancel the sell-order !");

            Promise.reject(false);
        };
    };

    public async createERC721Contract(
        _collectionName: string,
        _collectionSymbol: string,
        _collectionDescription: string,
        _factory: string
    ): Promise<any> {
        try {
            const receipt = await this.Marketplace.methods.createERC721Contract(
                _collectionName,
                _collectionSymbol,
                _collectionDescription,
                _factory
            ).send();

            Promise.resolve(
                {
                    mined: true,
                    txReceipt: receipt
                }
            );
        } catch {
            console.error("Error occured while trying to create ERC721-Contract !");

            Promise.reject(false);
        };
    };

    public async getSellOrderDetails(_sellOrderId: string | bn): Promise<any> {
        try {
            const data = this.Marketplace.methods.sellOrder(_sellOrderId).call();

            Promise.resolve(
                {
                    data
                }
            );
        } catch {
            console.error("Error occured while trying to fetch sell-order info !");

            Promise.reject(false);
        };
    };

    public async getBidDetails(_bidId: string | bn): Promise<any> {
        try {
            const data = this.Marketplace.methods.bid(_bidId).call();

            Promise.resolve({ data });
        } catch {
            console.error("Error occured while trying to fetch bid info !");

            Promise.reject(false);
        };
    };

    public async getUserContract(_user: string): Promise<any> {
        try {
	    if (
		!this.Web3Js.utils.isAddress(_user)
	    ) {
		throw new Error("Invalid address entered!");
	    };
		
            const data = this.Marketplace.methods.getUserContract(_user).call();

            Promise.resolve({ data });
        } catch {
            console.error("Error occured while trying to fetch user-contract address !");

            Promise.reject(false);
        };
    };
};

export default SDK;
