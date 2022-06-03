import React, { useEffect, useState } from 'react';
import PlugConnect from '@psychedelic/plug-connect';
import { Principal } from '@dfinity/principal';
import { Actor } from '@dfinity/agent';
import RandomBigInt from 'random-bigint';

import XtcIDL from './idls/xtc.did';
import ExtIDL from './idls/ext.did';
import './App.css';
import nnsMintingDid from './idls/nns-minting.did';
import BatchTransactions from './BatchTransactions';
import nns_ledgerDid from './idls/nns_ledger.did';
import { getAccountId, getTokenIdentifier } from './utils';

export const XTC_CANISTER_ID = 'aanaa-xaaaa-aaaah-aaeiq-cai';
export const STARVERSE_CID = 'nbg4r-saaaa-aaaah-qap7a-cai';
export const NNS_MINTING_CID = 'rkp4c-7iaaa-aaaaa-aaaca-cai';
export const NNS_LEDGER_CID = 'ryjl3-tyaaa-aaaaa-aaaba-cai';
export const COINFLIP_CANISTER_ID = '24pmb-qiaaa-aaaah-aannq-cai';



// Subaccounts are arbitrary 32-byte values.
export const SUB_ACCOUNT_ZERO = Buffer.alloc(32);

const WHITELIST = [XTC_CANISTER_ID, STARVERSE_CID, NNS_MINTING_CID, COINFLIP_CANISTER_ID, NNS_LEDGER_CID];

const CYCLES_PER_TC = 1_000_000_000_000;
const E8S_PER_ICP = 100_000_000;

function App() {
  const [rpc, setRPC] = useState(null);
  const [connected, setConnected] = useState(false);
  const [session, setSession] = useState(null);

  const initialize = () => {
    setRPC(window.ic.plug.sessionManager.rpc);
    setConnected(true);
    setSession(window.ic.plug.sessionManager.sessionData);
  }
  useEffect(() => {
    window.ic.plug.isConnected().then((isConnected) => {
      if (isConnected) {
        initialize(true);
      }
    })
  }, []);


  const callRPCMethod = async (methodName) => {
    try {
      console.log('rpc', rpc);
      const res = await rpc.call({ handler: methodName, args: [{ status: 'approved', data: 'something malicious' }] });
      alert('PROVIDER UNSAFE', res);
    } catch (e) {
      console.log('OK, provider errored out', e);
    }
  }

  const validTransfer = () =>
    window.ic.plug.requestTransfer({
      amount: 100,
      to: 'xksyk-jrty5-s6ei6-k3cak-wb2mv-5rtv5-atxvn-gnqsm-i6kuh-irkqa-4ae',
    });
  
  const validBurnXTC = () =>
    window.ic.plug.requestBurnXTC({ amount: 100000000000, to: 'jralp-tqaaa-aaaah-aaf3q-cai' });

  const validTransferToken = () =>
    window.ic.plug.requestTransfer({
      amountStr: '0.1',
      to: 'xksyk-jrty5-s6ei6-k3cak-wb2mv-5rtv5-atxvn-gnqsm-i6kuh-irkqa-4ae',
    });

  return (
    <div className="flex column center">
      <h1>Plug Examples</h1>
      <div className="plug-button">
        {connected ? `Connected Principal: ${session?.principalId}` : (
          <PlugConnect
            dark
            onConnectCallback={initialize} whitelist={WHITELIST}
            // timeout={5000}
          />
        )}
      </div>
      <h2>Security Example</h2>

      <h3>Valid TXs</h3>
     <BatchTransactions />
      <button onClick={validTransfer}>Request Transfer</button>
      <button onClick={validTransferToken}>Request Transfer Token</button>
      <button onClick={validBurnXTC}>Request BurnXTC</button>

      <h3>Transaction Module</h3>
      <button onClick={() => callRPCMethod('handleRequestTransfer')}>Request Transfer</button>
      <button onClick={() => callRPCMethod('handleRequestTransferToken')}>Request Transfer Token</button>
      <button onClick={() => callRPCMethod('handleRequestBurnXTC')}>Request BurnXTC</button>
      <button onClick={() => callRPCMethod('handleBatchTransactions')}>Request Batch TX</button>
      <button onClick={() => callRPCMethod('handleCall')}>Request Call</button>

      <h3>Information Module</h3>
      <button onClick={() => callRPCMethod('handleRequestBalance')}>Request Balance (Locked)</button>
      <button onClick={() => callRPCMethod('handleGetPrincipal')}>Request Principal (Locked)</button>
      <button onClick={() => callRPCMethod('handleGetICNSInfo')}>Request ICNSInfo</button>

      <h3>Connection Module</h3>
      <button onClick={() => callRPCMethod('handleAllowAgent')}>Request Connect</button>
      <button onClick={() => callRPCMethod('handleGetConnectionData')}>Request Connection (Locked)</button>
    </div>
  );
}

export default App;
