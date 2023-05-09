import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@hashgraph/hardhat-hethers";

const config: HardhatUserConfig = {
  defaultNetwork: 'localHederaNetwork',
  hedera: {
    networks: {
      localHederaNetwork: {
        consensusNodes: [
          {
            url: '',
            nodeId: '0.0.3'
          }
        ],
        mirrorNodeUrl: '',
        chainId: 0,
        accounts: [
          {
            account: '0.0.1002',
            privateKey: '0x7f109a9e3b0d8ecfba9cc23a3614433ce0fa7ddcc80f2a8f10b222179a5a80d6'
          },
          {
            account: '0.0.1003',
            privateKey: "0x6ec1f2e7d126a74a1d2ff9e1c5d90b92378c725e506651ff8bb8616a5c724628"
          },
        ]
      }
    },
    gasLimit: 8000000
  },
  solidity: {
    compilers: [
      {
        version: "0.8.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.5.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.4.19",
        settings: {
          optimizer: {
            enabled: false,
            runs: 200,
          },
        },
      },
    ],
  },
  typechain: {
    outDir: "types",
  },
  mocha: {
    timeout: 1200000,
    //bail: true,
  },
};

export default config;
