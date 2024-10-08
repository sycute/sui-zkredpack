import {
  useCurrentAccount,
  useSignTransactionBlock,
  useSuiClient,
  ConnectModal,
} from "@mysten/dapp-kit";
import { Section } from "@radix-ui/themes";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { fromB64 } from "@mysten/sui.js/utils";
import { useLocation } from "react-router-dom";
import { useNetworkVariable } from "../networkConfig";
import { message } from "antd";
import { Button } from "flowbite-react";
import { useState, useEffect } from "react";
import "./ClaimRedPack.css";

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
  const [isLoading, setIsLoading] = useState("false");
  const [open, setOpen] = useState(false);
  const [keypair, setKeypair] = useState(null);
  const [coinType, setCoinType] = useState("");
  const [coinDecimals, setCoinDecimals] = useState(1);
  const [txdigest, setTxdigest] = useState("");

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
    let url = location.hash.slice(1).split("&&");
    client.getCoinMetadata(url[1]).then((res) => {
      setCoinDecimals(res.decimals)
    });
    let newKeypair = Ed25519Keypair.fromSecretKey(fromB64(url[0]));
    setKeypair(newKeypair);
    queryRedpack(newKeypair.toSuiAddress());

    setCoinType(url[1]);

    
    
  }, [location, coinType]);

  const handleButtonClicked = async () => {
    setIsLoading("true");
    await claim();
  };

  const handleCoinnectModal = () => {
    setOpen(true);
  };

  const showTips = txdigest ? (
    <div>
      <a href={`https://suiscan.xyz/mainnet/tx/${txdigest}`}>Claimed! See at explorer</a>
    </div>
  ) : (
    ""
  );

  return (
    <>
      <div className="packContainer">
        <div className="nes-container is-rounded">
          <div className="packSender">
            sender: {getSimpleId(redPackInfo?.sender)}
          </div>
          <div className="packSender">
            balance: {redPackInfo?.balance / 10 ** coinDecimals}{" "}
          </div>
          <div className="packRemain">
            quantity:{" "}
            {redPackInfo?.quantity -
              redPackInfo?.claimers?.fields.contents?.length}{" "}
            / {redPackInfo?.quantity}
          </div>
          <div className="conType">
            coinType: {coinType}
          </div>
        </div>

        <Button
          className="mt-4 mb-4"
          loading={isLoading}
          type="primary"
          size={"lg"}
          color={"teal"}
          onClick={async () => {
            currentAccount && currentAccount.address
              ? await handleButtonClicked()
              : handleCoinnectModal();
          }}
        >
          {currentAccount && currentAccount.address
            ? "Claim The Redpack"
            : "Connect Wallet"}
        </Button>
        <ConnectModal open={open} onOpenChange={(isOpen) => setOpen(isOpen)} />
        <Section size="1">
          {showTips}
        </Section>
      </div>
    </>
  );

  async function claim() {
    if (!currentAccount?.address) {
      message.error("Connect wallet first");
      return;
    }

    if (
      redPackInfo?.claimers.fields?.contents.includes(currentAccount.address)
    ) {
      message.warning("You Already claimed");
      return;
    }

    setIsLoading("true");

    try {
      console.log("待领取的币种：" + coinType);
    
      let txb = new TransactionBlock();
      txb.setSender(keypair.toSuiAddress());
      txb.moveCall({
        target: `${zkRedpackPackageId}::zkredpack::claim`,
        arguments: [
          txb.object(zkredpackStoreObjectId),
          txb.object("0x8"),
          txb.pure.address(currentAccount.address),
        ],
        typeArguments: [coinType],
      });

      const kindTx = await txb.build({
        client: client,
        onlyTransactionKind: true,
      });

      // sponsor TX
      const sponsorT = await sponsorTransaction(
        keypair.toSuiAddress(),
        currentAccount.address,
        kindTx,
        client
      );
      const sponsorTxb = TransactionBlock.from(sponsorT);
      // sign by sponsor
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
        },
      });

      client.waitForTransactionBlock({ digest }).then((resply) => {
        if (resply.errors) {
          message.warning(resply.errors);
          console.log(resply.errors);
        } else {
          console.log("Claimed! Digest: " + resply.digest);
          // message.success("Claimed! Digest: " + resply.digest);
          setTxdigest(resply.digest);
        }
      });
    } catch (e) {
      setIsLoading("false");
      message.error(e.message);
    }

    setIsLoading("false");
  }

  async function sponsorTransaction(
    sender,
    sponsor,
    transactionKindBytes,
    cli
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
                console.log(res.data.content.fields);
                setRedPackInfo(res.data.content.fields);
              }
            });
        }
      });
  }
}

export default Claim;
