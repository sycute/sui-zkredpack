import {
  useCurrentAccount,
  useSignTransactionBlock,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { fromB64 } from "@mysten/sui.js/utils";
import { useLocation } from "react-router-dom";
import { useNetworkVariable } from "../networkConfig";
import { message } from "antd";
import { Button } from "flowbite-react";
import { useState, useEffect } from "react";
import "./ClaimRedPack.css";
import { coinMap, coinDecimal, coinTypeMap } from "../data";

function Claim() {
  const [redPackInfo, setRedPackInfo] = useState({});
  const zkRedpackPackageId = useNetworkVariable("zkRedpackPackageId");
  const zkredpackStoreObjectId = useNetworkVariable(
    "testnetRedpackStoreObjectId"
  );
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signTransactionBlock } = useSignTransactionBlock();
  const location = useLocation();

  const [keypair, setKeypair] = useState(null);
  const [hash, setHash] = useState("");
  const [coinType, setCoinType] = useState("");
  const [coinDecimals, setCoinDecimals] = useState(9);

  const getSimpleId = (id) => {
    if (!id) {
      return "";
    }
    if (id.length <= 10) {
      return id;
    }
    return id.slice(0, 6) + "..." + id.slice(-4);
  };

  useEffect(() => {
    if (keypair) {
      queryRedpack(keypair.toSuiAddress());
    }
  }, []);

  useEffect(() => {
    let url = location.hash.slice(1).split("&&");
    setHash(url[0]);
    setCoinType(url[1]);
    setCoinDecimals(coinDecimal[url[1]]);
  }, [location, hash, coinType]);

  useEffect(() => {
    if (hash) {
      let newKeypair = Ed25519Keypair.fromSecretKey(fromB64(hash));
      setKeypair(newKeypair);
    }
  }, [hash]);

  return (
    <>
      <div className="packContainer">
        <Button
          type="primary"
          onClick={async () => {
            claim();
          }}
        >
          Claim The Redpack
        </Button>
        <div className="nes-container is-rounded">
          <div className="packSender">
            sender: {getSimpleId(redPackInfo?.sender)}
          </div>
          <div className="packSender">
            {/* todo: not only Sui, use data.js */}
            balance: {redPackInfo?.balance / 10 ** coinDecimals}{" "}
            {coinTypeMap[coinType]}
          </div>
          <div className="packRemain">
            quantity:{" "}
            {redPackInfo?.quantity -
              redPackInfo?.claimers?.fields.contents?.length}{" "}
            / {redPackInfo?.quantity}
          </div>
        </div>
      </div>
    </>
  );

  async function claim() {
    if (!currentAccount?.address) {
      message.error("Please connect wallet");
      return;
    }

    if (
      redPackInfo?.claimers.fields.contents.includes(currentAccount?.address)
    ) {
      message.warning("You Already claimed");
      return;
    }

    setIsLoading(true);
    let txb = new TransactionBlock();
    txb.moveCall({
      target: `${zkRedpackPackageId}::zkredpack::claim`,
      arguments: [
        txb.object(zkredpackStoreObjectId),
        txb.object("0x8"),
        txb.pure.address(currentAccount.address),
      ],
      typeArguments: ["0x2::sui::SUI"],
    });

    try {
      const kindTx = await txb.build({
        client: client,
        onlyTransactionKind: true,
      });

      const sponsorT = await sponsorTransaction(
        keypair.toSuiAddress(),
        currentAccount.address,
        kindTx,
        client
      );

      const sponsorTxb = TransactionBlock.from(sponsorT);

      const sponsoredBytes = await signTransactionBlock({
        transactionBlock: sponsorTxb,
      });

      // sign by keypair
      const signedTx = await keypair.signTransactionBlock(
        fromB64(sponsoredBytes.transactionBlockBytes)
      );

      const { digest } = await client.executeTransactionBlock({
        transactionBlock: sponsoredBytes.transactionBlockBytes,
        signature: [sponsoredBytes.signature, signedTx.signature],
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      await client.waitForTransactionBlock({ digest }).then((resply) => {
        if (resply.errors) {
          message.warning(resply.errors);
          console.log(resply.errors);
        } else {
          message.success("Claimed! Digest: " + resply.digest);
        }
      });
    } catch (e) {
      setIsLoading(false);
      message.error(e.message);
    }

    setIsLoading(false);
  }

  async function sponsorTransaction(
    sender,
    sponsor,
    transactionKindBytes,
    client
  ) {
    let payment = [];
    let retires = 50;
    while (retires !== 0) {
      const coins = await client.getCoins({ owner: sponsor, limit: 1 });

      if (coins.data.length > 0) {
        payment = coins.data.map((coin) => ({
          objectId: coin.coinObjectId,
          version: coin.version,
          digest: coin.digest,
        }));
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 200)); // Sleep for 200ms
      retires -= 1;
    }

    const tx = TransactionBlock.fromKind(transactionKindBytes);
    tx.setSender(sender);
    tx.setGasOwner(sponsor);
    tx.setGasPayment(payment);

    return await tx.build({ client: client });
  }

  async function queryRedpack(key) {
    client
      .getDynamicFields({
        parentId: zkredpackStoreObjectId,
      })
      .then((page) => {
        const d = page.data.find((v) => v.name.value === key);
        if (d) {
          client
            .getObject({ id: d?.objectId, options: { showContent: true } })
            .then((res) => {
              if (res.data?.content?.dataType == "moveObject") {
                // res.data.content.fields as unknown as Redpack;
                console.log(res.data.content.fields);
                setRedPackInfo(res.data.content.fields);
              }
            });
        }
      });
  }
}

export default Claim;
