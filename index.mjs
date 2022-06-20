import { clusterApiUrl, Connection } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenListProvider} from '@solana/spl-token-registry';
import { log } from 'console';
import { HttpsProxyAgent } from 'hpagent';
import fetch from 'node-fetch';
import { config } from 'dotenv';
config();

const proxy = process.env.HTTP_PROXY;
const proxyAgent = new HttpsProxyAgent ({ proxy });

const solanaConnection = new Connection(clusterApiUrl("mainnet-beta"), {
  commitment: 'confirmed',
  fetch: async (input, options) => {
    const processedInput =
    typeof input === 'string' && input.slice(0, 2) === '//'
      ? 'https:' + input
      : input;    

    const result = await fetch(processedInput, {
      ...options,
      agent: proxyAgent,
    });

    log('RESPONSE STATUS', result.status);
    return result;
  },
});

const walletToQuery = process?.argv[2];
if(!walletToQuery) {
  throw new Error('No wallet address given');
}

// An example taken from some article online
async function getTokenRegistry(){
    const tokenListProvider =  new TokenListProvider;
    const tokens = await tokenListProvider.resolve();
    const tokenList = tokens.filterByClusterSlug('mainnet-beta').getList();
    return(tokenList);
}

async function getTokenAccounts(wallet, solanaConnection) {
    const filters = [
        {
          dataSize: 165,    // size of account (bytes)
        },
        {
          memcmp: {
            offset: 32,     // location of our query in the account (bytes)
            bytes: wallet,  // our search criteria, a base58 encoded string
          },            
        }];
    const accounts = await solanaConnection.getParsedProgramAccounts(
        TOKEN_PROGRAM_ID, // new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
        {filters: filters}
    );
    console.log(`Found ${accounts.length} token account(s) for wallet ${wallet}.`);
    const tokenList = await getTokenRegistry();
    accounts.forEach((account, i) => {
        // Parse the account data
        const parsedAccountInfo = account.account.data;
        const mintAddress = parsedAccountInfo["parsed"]["info"]["mint"];
        const tokenBalance = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
        // Find this token in the Token Registry
        const tokenName = tokenList.find(token=>token.address === mintAddress);
        // Log results
        console.log(`Token Account No. ${i + 1}: ${account.pubkey.toString()}`);
        console.log(`--Token Mint: ${mintAddress}`);
        if(tokenName) {console.log(`--Name: ${tokenName.name}`)}
        console.log(`--Token Balance: ${tokenBalance}`);
    });
}
getTokenAccounts(walletToQuery, solanaConnection);