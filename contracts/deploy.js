const fs = require('fs');
const solc = require('solc');
const { ethers } = require('ethers');
require('dotenv').config({ path: '../backend/.env' });

async function main() {
    const source = fs.readFileSync('AgentAuditLogger.sol', 'utf8');

    const input = {
        language: 'Solidity',
        sources: {
            'AgentAuditLogger.sol': {
                content: source,
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.bytecode.object']
                }
            }
        }
    };

    console.log("Compiling contract...");
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
        output.errors.forEach(err => console.log(err.formattedMessage));
    }

    const compiled = output.contracts['AgentAuditLogger.sol']['AgentAuditLogger'];
    const abi = compiled.abi;
    const bytecode = compiled.evm.bytecode.object;

    fs.writeFileSync('../backend/abi.json', JSON.stringify(abi, null, 2));
    console.log("Saved ABI to backend/abi.json");

    const provider = new ethers.JsonRpcProvider(process.env.HELA_RPC);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log("Deploying contract...");
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);

    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log("Contract deployed to:", address);

    const envPath = '../backend/.env';
    let envData = fs.readFileSync(envPath, 'utf8');
    envData = envData.replace(/CONTRACT_ADDRESS=.*/g, `CONTRACT_ADDRESS="${address}"`);
    fs.writeFileSync(envPath, envData);
    console.log("Updated CONTRACT_ADDRESS in ../backend/.env");
}

main().catch(console.error);
