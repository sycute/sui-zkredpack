import { TransactionBlock } from "@mysten/sui.js/transactions";
import { Section } from "@radix-ui/themes";
import {
  ConnectButton,
  ConnectModal,
  useSignAndExecuteTransactionBlock,
  useSuiClient,
} from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { decodeSuiPrivateKey } from "@mysten/sui.js/cryptography";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { toB64 } from "@mysten/sui.js/utils";

import { useState } from "react";
import { Tag, message, Flex, Spin, InputNumber, Form, Card } from "antd";
import { ExclamationOutlined } from "@ant-design/icons";
import { HTTP_PROVIDER_URL } from "../constants";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Button } from "flowbite-react";

function SendRedPack() {
  const [hash, setHash] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [coin, setCoin] = useState(1);
  const [quantity, setQuantity] = useState(2);

  const client = useSuiClient();
  const currentAccount = useCurrentAccount();

  const zkRedpackPackageId = useNetworkVariable("zkRedpackPackageId");
  const zkredpackStoreObjectId = useNetworkVariable(
    "testnetRedpackStoreObjectId"
  );
  const { mutate: signAndExecute } = useSignAndExecuteTransactionBlock();
  const showTag = hash ? (
    <Tag color="#2db7f5"> {HTTP_PROVIDER_URL + "claim#" + hash} </Tag>
  ) : (
    ""
  );
  const showTips = hash ? (
    <div>
      {" "}
      <ExclamationOutlined />
      {"Copy The Link & Share to Claimers!"}
    </div>
  ) : (
    ""
  );

  const handleButtonClicked = () => {
    setIsLoading(true);
    send();
  };

  const handleConnectModal = () => {
    setOpen(true);
  };

  const onCoinChange = (a) => {
    setCoin(a);
  };

  const onQuantityChange = (a) => {
    setQuantity(a);
  };
  return (
    <>
      <div>
        <div className="flex flex-col w-1/3 h-auto p-10 px-10 mx-auto space-y-12 rounded-sm three-d">
          <div>
            <Form
              layout="horizontal"
              labelCol={{ style: { width: "100px" } }}
              wrapperCol={{ span: 16 }}
            >
              <Form.Item label="Sui">
                <InputNumber
                  style={{ width: "100%" }}
                  defaultValue={1}
                  onChange={onCoinChange}
                />
              </Form.Item>
              <Form.Item label="Quantity">
                <InputNumber
                  style={{ width: "100%" }}
                  defaultValue={2}
                  onChange={onQuantityChange}
                />
              </Form.Item>
            </Form>
          </div>
          <Button
            isProcessing={isLoading}
            size={"md"}
            color={"gray"}
            onClick={() => {
              currentAccount && currentAccount.address
                ? handleButtonClicked()
                : handleConnectModal();
            }}
            className="hover:bg-red-500 hover:text-white "
          >
            {currentAccount && currentAccount.address
              ? "Generate a Redpack"
              : "Connect Wallet"}
          </Button>
          <ConnectModal
            open={open} 
            onOpenChange={(isOpen) => setOpen(isOpen)}
          />
        </div>
        <Section size="1">
          {showTag}
          {showTips}
        </Section>
        {isLoading ? (
          <Spin tip="Loading" size="large" style={{ marginTop: 20 }}>
            processing...
          </Spin>
        ) : (
          ""
        )}
      </div>
    </>
  );

  function send() {
    const keypair = new Ed25519Keypair();
    const url_hash = toB64(
      decodeSuiPrivateKey(keypair.getSecretKey()).secretKey
    );

    const txb = new TransactionBlock();
    const [given_coin] = txb.splitCoins(txb.gas, [coin * 1e9]);
    const given_balance = txb.moveCall({
      target: "0x2::coin::into_balance",
      arguments: [txb.object(given_coin)],
      typeArguments: ["0x2::sui::SUI"],
    });
    txb.moveCall({
      arguments: [
        txb.object(zkredpackStoreObjectId),
        txb.object(given_balance),
        txb.pure.u64(quantity),
        txb.pure.address(keypair.toSuiAddress()),
      ],
      target: `${zkRedpackPackageId}::zkredpack::new_redpack`,
      typeArguments: ["0x2::sui::SUI"],
    });
    signAndExecute(
      {
        transactionBlock: txb,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      },
      {
        onSuccess: (tx) => {
          client.waitForTransactionBlock({ digest: tx.digest }).then(() => {
            setHash(url_hash);
            setIsLoading(false);
            message.success("now copy the generated link.");
          });
        },
        onError: (error) => {
          setIsLoading(false);
          message.warning(error.message);
        },
      }
    );
  }
}

export default SendRedPack;
