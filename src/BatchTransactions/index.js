import { Principal } from '@dfinity/principal';
import React from 'react';
import RandomBigInt from 'random-bigint';
import { getAccountId, getTokenIdentifier } from '../utils';
import CoinflipIDL from '../idls/coinflip.did';
import XtcIDL from '../idls/xtc.did';
import ExtIDL from '../idls/ext.did';
import nns_ledgerDid from '../idls/nns_ledger.did';

export const XTC_CANISTER_ID = 'aanaa-xaaaa-aaaah-aaeiq-cai';
export const STARVERSE_CID = 'nbg4r-saaaa-aaaah-qap7a-cai';
export const NNS_MINTING_CID = 'rkp4c-7iaaa-aaaaa-aaaca-cai';
export const NNS_LEDGER_CID = 'ryjl3-tyaaa-aaaaa-aaaba-cai';

const COINFLIP_CANISTER_ID = '24pmb-qiaaa-aaaah-aannq-cai';

const TRANSFER_XTC_TX = {
  idl: XtcIDL,
  canisterId: XTC_CANISTER_ID,
  methodName: 'transfer',
  args: [Principal.fromText('xksyk-jrty5-s6ei6-k3cak-wb2mv-5rtv5-atxvn-gnqsm-i6kuh-irkqa-4ae'), BigInt(1400000)],
  onSuccess: async (res) => {
    console.log('transferred xtc successfully');
  },
  onFail: (res) => {
    console.log('transfer xtc error', res);
  },
};


const TRANSFER_XTC_TX_TO_FAIL = {
  idl: XtcIDL,
  canisterId: XTC_CANISTER_ID,
  methodName: 'transfer',
  args: [Principal.fromText('xksyk-jrty5-s6ei6-k3cak-wb2mv-5rtv5-atxvn-gnqsm-i6kuh-irkqa-4ae'), BigInt(1400000000000000000000)],
  onSuccess: async (res) => {
    console.log('transferred xtc successfully');
  },
  onFail: (res) => {
    console.log('transfer xtc error', res);
  },
};

const TRANSFER_STARVERSE_TX = {
  idl: ExtIDL,
  canisterId: STARVERSE_CID,
  methodName: 'transfer',
  args: [{
    to: { principal: Principal.from('6cm3n-tcbbt-oywdv-hpf2y-7ltfa-gvf7z-cfgaj-4j33n-lqutr-yzwuz-hqe') },
    from: { principal: Principal.from('xksyk-jrty5-s6ei6-k3cak-wb2mv-5rtv5-atxvn-gnqsm-i6kuh-irkqa-4ae') },
    token: getTokenIdentifier(STARVERSE_CID, 420),
    amount: BigInt(1),
    memo: new Array(32).fill(0),
    notify: false,
    subaccount: [],
  }],
  onSuccess: async (res) => {
    console.log('transferred starverse successfully');
  },
  onFail: (res) => {
    console.log('transfer starverse error', res);
  },
};

const TRANSFER_ICP_TX = {
  idl: nns_ledgerDid,
  canisterId: NNS_LEDGER_CID,
  methodName: 'send_dfx',
  args: [{
    to: getAccountId(Principal.from('6cm3n-tcbbt-oywdv-hpf2y-7ltfa-gvf7z-cfgaj-4j33n-lqutr-yzwuz-hqe')),
    fee: { e8s: BigInt(10000) },
    amount: { e8s: BigInt(1000000) },
    memo: RandomBigInt(32),
    from_subaccount: [], // For now, using default subaccount to handle ICP
    created_at_time: [],
  }],
  onSuccess: async (res) => {
    console.log('transferred starverse successfully');
  },
  onFail: (res) => {
    console.log('transfer starverse error', res);
  },
};

const FLIP_TRANSACTION = (flip) => ({
  idl: CoinflipIDL,
  canisterId: COINFLIP_CANISTER_ID,
  methodName: 'coinFlip',
  args: [true],
  onSuccess: async (res) => {
    console.log('flipped coin ', flip, 'successfully');
    console.log('coinflip response', res);
  },
  onFail: (res) => {
    console.log('coinflip error', res);
  },
});

const BatchTransactionsExample = () => {
  const tripleFlipIt = async () => {
    console.log('Flipping it three times!');
    const tripleFlip = new Array(3).fill(null).map((_, index) => FLIP_TRANSACTION(index));
    await window.ic.plug.batchTransactions(tripleFlip)
    console.log('flipped all coins!');
  };
  const randomTx = async () => {
    console.log('Doing a bunch of tx');
    await window.ic.plug.batchTransactions([TRANSFER_XTC_TX, TRANSFER_ICP_TX, TRANSFER_STARVERSE_TX, FLIP_TRANSACTION(1)])
    console.log('Done!');
  }
  const randomTxToFail = async () => {
    console.log('Doing a bunch of tx');
    await window.ic.plug.batchTransactions([TRANSFER_XTC_TX_TO_FAIL, TRANSFER_ICP_TX, TRANSFER_STARVERSE_TX, FLIP_TRANSACTION(1)])
    console.log('Done!');
  }
  return (
    <div className="batch-transactions-container">
      <h2>Batch Transactions Example</h2>
      <button type="button" onClick={tripleFlipIt}>Triple Flip</button>
      <button type="button" onClick={randomTx}>Random Transactions</button>
      <button type="button" onClick={randomTxToFail}>Random Transactions TO FAIL</button>
    </div>
  )
}
export default BatchTransactionsExample;
