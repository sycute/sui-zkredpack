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
import { message, Button } from "antd";
import { useState, useEffect } from "react";
import "./ClaimRedPack.css";

function Claim() {
  const [isLoading, setIsLoading] = useState(false);
  const [redPackInfo, setRedPackInfo] = useState({});
  const zkRedpackPackageId = useNetworkVariable("zkRedpackPackageId");
  const zkredpackStoreObjectId = useNetworkVariable(
    "testnetRedpackStoreObjectId"
  );
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signTransactionBlock } = useSignTransactionBlock();
  const location = useLocation();
  let keypair;
  try {
    keypair = Ed25519Keypair.fromSecretKey(fromB64(location.hash.slice(1)));
  } catch (e) {
    message.warning("The link is invalid");
    console.log(e);
    return;
  }

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
    queryRedpack(keypair.toSuiAddress());
  }, []);

  return (
    <>
      <div className="packContainer">
        <Button
          loading={isLoading}
          type="primary"
          onClick={async () => {
            claim();
          }}
        >
          Claim The Redpack
        </Button>
        <div className="packInfo">
          <div className="packSender">
            sender: {getSimpleId(redPackInfo?.sender)}
          </div>
          <div className="packSender">
            balance: {redPackInfo?.balance / 1000000000}
            {" Sui"}
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
