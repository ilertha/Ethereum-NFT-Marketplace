=================================
Ethereum NFT Marketplace Document
=================================

.. code-block:: solidity

  interface IMarketplace {
     struct SellOrder {
        address seller;
        address token;
        address contractAddr;
        uint256 nftId;
        address buyer;
        uint256 price;
        uint256 startedAt;
        uint256 endedAt;
        bool isCanceled;
        bool isEnded;
    }
    
    struct Bid {
        address bidder;
        address token;
        address nftOwner;
        uint256 sellOrderId;
        uint256 price;
        uint256 biddedAt;
        uint256 bidEndedAt;
        bool isCanceled;
        bool isEnded;
    }
    
    function createSellOrder(
      address _contractAddr,
      uint256 _nftId,
      address _token,
      uint256 _price
    ) external;
    
    function createBid(
      uint256 _orderId,
      address _token,
      uint256 _price
    ) external;
    
    function acceptBid(
      uin256 _bidId,
      uint256 _orderId
    ) external;
    
    function cancelBid(uint256 _bidId) external;
    
    function cancelSellOrder(uint256 _orderId) external;
    
    function createERC721Contract(
      string calldata _collectionName,
      string calldata _collectionSymbol,
      string calldata _collectionDescription,
      address _factory
    ) external;
    
    function sellOrder(uint256 _sellOrderId) external view returns(SellOrder memory);
    
    function bid(uint256 _bidId) external view returns(Bid memory);
    
    function getUserContract(address _user) external view returns(address);
  }

---------------------------------------------------------------------------------------------

create sell order
===================

.. code-block:: solidity

   function createSellOrder(
      address _contractAddr,
      uint256 _nftId,
      address _token,
      uint256 _price
    ) external;
    
Will create a sell order.

----------
Parameters
----------

1. ``_contractAddr`` - ``address``: The sell order creator nft's contract address.
2. ``_nftId`` - ``uint256``: The nft's id which user is going to sell it.
3. ``_token`` - ``address``: The address of token (currency like USDT, ...) that user wishes to make a price for his/her sell order
4. ``_price`` - ``uint256``: The price of the sell order in decimal format.

.. warning:: User must approve the marketplace to access the nft token to list it in the market.

---------------------------------------------------------------------------------------------

create bid
===================

.. code-block:: solidity

   function createBid(
      uint256 _orderId,
      address _token,
      uint256 _price
    ) external;
    
Will create a bid for listed nft.

.. warning:: User must approve marketplace to access the ``_price`` amount of the ``_token`` to create the bid.

----------
Parameters
----------

1. ``_orderId`` - ``uint256``: The id of the sell order that bidder wishes to make a bid for it.
2. ``_token`` - ``address``: The address of the token which bidder wishes to pay the nft in that.
3. ``_price`` - ``uint256``: The amount of token ``_token`` that bidder wishes to pay in decimal.

.. warning:: The ``_token`` must be one of the accepted tokens in the marketplace smart contract.

---------------------------------------------------------------------------------------------

accept bid
==================

.. code-block:: solidity

    function acceptBid(
      uin256 _bidId,
      uint256 _orderId
    ) external;
    
Sell order owner will accept a relevant bid by calling this function.

----------
Parameters
----------

1. ``_bidId`` - ``uint256``: The bid id which sell order owner wishes to accept it.
2. ``_orderId`` - ``uint256``: The order id of the sell order owner.

---------------------------------------------------------------------------------------------

cancel bid
===============

.. code-block:: solidity

  function cancelBid(uint256 _bidId) external;
  
Bid owner will be able to cancel his/her bid any time by calling this function.

----------
Parameters
----------

1. ``_bidId`` - ``uint256``: The bid id which bidder wishes to cancel.

---------------------------------------------------------------------------------------------

cancel sell order
=====================

.. code-block:: solidity

  function cancelSellOrder(uint256 _orderId) external;
  
Sell order owner will be able to cancel his/her sell order any time by calling this function.

----------
Parameters
----------

1. ``_orderId`` - ``uint256``: The order id which owner wishes to cancel.

---------------------------------------------------------------------------------------------

create ERC721 collection
============================

.. code-block:: solidity

    function createERC721Contract(
      string calldata _collectionName,
      string calldata _collectionSymbol,
      string calldata _collectionDescription,
      address _factory
    ) external;
    
Each user can create a NFT collection by calling this function.

----------
Parameters
----------

1. ``_collectionName`` - ``string``: The NFT collection main name.
2. ``_collectionSymbol`` - ``string``: The NFT collection symbol.
3. ``_collectionDescription`` - ``string``: The NFT collection main description.
4. ``_factory`` - ``address``: The address of the NFT collection factory which specifiedd in the source code of the project.

---------------------------------------------------------------------------------------------

get sell order info
=====================

.. code-block:: solidity

  function sellOrder(uint256 _sellOrderId) external view returns(SellOrder memory);
  
Will return the full info of the specific ``_sellOrderId``.

----------
Parameters
----------

1. ``_sellOrderId`` - ``uint256``: The order id.

-------
Returns
-------

1. ``SellOrder`` - ``SellOrder's struct``

---------------------------------------------------------------------------------------------

get bid info
=====================

.. code-block:: solidity

  function bid(uint256 _bidId) external view returns(Bid memory);
  
Will return the full info of the specific ``_bidId``.

----------
Parameters
----------

1. ``_bidId`` - ``uint256``: The bid id.

-------
Returns
-------

1. ``Bid`` - ``Bid's struct``

---------------------------------------------------------------------------------------------

get user's NFT collection address
==================================

.. code-block:: solidity

  function getUserContract(address _user) external view returns(address);
  
Will return the addre of the specific ``_user`` collection created via ``createERC721Contract`` function.

----------
Parameters
----------

1. ``_orderId`` - ``uint256``: The order id which owner wishes to cancel.

-------
Returns
-------

1. ``user's collection's account`` - ``address``

---------------------------------------------------------------------------------------------

Interaction With Marketplace - Frontend - Example
=====================================================

.. code-block:: javascript

  // create web3 instance
  const web3 = new Web3(window.ethereum); // wallet extension as provider
  
  // get user account
  const [ currentAccount ] = await web3.eth.requestAccounts();  
  
  // create marketplace instance
  const market = new web3.eth.Contract(
    marketplace.abi,
    marketplace.address,
    {
      from: currentAccount
    }
  );

  // create a sell order
  // before creating sell order user must approve the marketplace to access the nft
  // price must be in decimal format
  const txReceipt = await market.methods.createSellOrder(
    "<contract-address>",
    "<nft-id>",
    "<token>",
    "<price>"
  ).send();
  
  // create a bid
  // before creating bid user must approve the marketplace to access the specific amount of the token
  // price must be in decimal format
  const txReceipt_2 = await market.methods.createBid(
    "<order-id>",
    "<token>",
    "<price>"
  ).send();
  
  // accept the bid
  // only owner of the sell-order can accept a relevant bid
  // only can accpect the relevant bid
  const txReceipt_3 = await market.methods.acceptBid(
    "<bid-id>",
    "<order-id>"
  ).send();

.. warning:: Always pass numbers as Big-Number to the smart contracts, you can use web3.utils.toBN() for this purpose.
