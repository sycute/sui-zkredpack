import { getFullnodeUrl } from "@mysten/sui.js/client";
import {
  TESTNET_ZKREDPACK_PACKAGE_ID,
  TESTNET_REDPACKSTORE_OBJECT_ID,
} from "./constants.js";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    testnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        zkRedpackPackageId: TESTNET_ZKREDPACK_PACKAGE_ID,
        testnetRedpackStoreObjectId: TESTNET_REDPACKSTORE_OBJECT_ID,
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
