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
  const [to, setTo] = useState();
  const [amount, setAmount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [principal, setPrincipal] = useState("");
  const [nftIndex, setNFTIndex] = useState(0);
  const [xtcBalance, setXtcBalance] = useState(0);

  const handleChangeTo = e => setTo(e.target.value);
  const handleChangeAmount = e => setAmount(e.target.value);
  const handleChangeIndex = e => setNFTIndex(e.target.value);

  useEffect(() => {
    const getBalance = async () => {
      const actor = await window.ic.plug.createActor({ canisterId: XTC_CANISTER_ID, interfaceFactory: XtcIDL });
      const balance = await actor.balanceOf(Principal.fromText(window.ic.plug.principalId));
      console.log(`XTC balance of ${window.ic.plug.principalId}: ${balance}`);
    }

    if (connected) {
      getBalance();
    }
  }, [connected]);

  const getMyBalance = async () => {
    // create an actor to interact with XTC
    const actor = await window.ic.plug.createActor({ canisterId: XTC_CANISTER_ID, interfaceFactory: XtcIDL });
    // request a transfer using this actor
    const response = await actor.balanceOf(Principal.fromText(window.ic.plug.principalId));
    console.log('response', response);
    alert('response', response);
  }

  const getAllBalances = async () => {
    // create an actor to interact with XTC
    const response = await window.ic.plug.requestBalance();
    // request a transfer using this actor
    console.log('response', response);
  }

  const requestTransfer = async () => {
    const response = await window.ic.plug.requestTransfer({ to, amount: 10000 })

    console.log('response', response);
  }


  const safeXTCTransfer = async () => {
    // create an actor to interact with XTC
    const actor = await window.ic.plug.createActor({ canisterId: XTC_CANISTER_ID, interfaceFactory: XtcIDL });
    // request a transfer using this actor
    const response = await actor.transferErc20(Principal.fromText(to), BigInt(amount * CYCLES_PER_TC));
    console.log('response', response);
  }

  const unsafeXTCTransfer = async () => {
    const actor = await Actor.createActor(XtcIDL, {
      agent: window.ic.plug.agent,
      canisterId: XTC_CANISTER_ID,
    });
    const response = await actor.transfer({ to: Principal.fromText(to), amount: BigInt(amount * CYCLES_PER_TC), from: [] });
    console.log('response', response);
  }


  const safeICPTransfer = async () => {
    // create an actor to interact with XTC
    const actor = await window.ic.plug.createActor({ canisterId: NNS_LEDGER_CID, interfaceFactory: nns_ledgerDid });
    // request a transfer using this actor
    const response = await actor.send_dfx({
      to: getAccountId(Principal.from(to)),
      fee: { e8s: BigInt(10000) },
      amount: { e8s: BigInt(amount) },
      memo: RandomBigInt(32),
      from_subaccount: [], // For now, using default subaccount to handle ICP
      created_at_time: [],
    }); console.log('response', response);
  }

  const unsafeICPTransfer = async () => {
    const actor = await Actor.createActor(nns_ledgerDid, {
      agent: window.ic.plug.agent,
      canisterId: NNS_LEDGER_CID,
    });
    const response = await actor.send_dfx({
      to: getAccountId(Principal.from(to)),
      fee: { e8s: BigInt(10000) },
      amount: { e8s: BigInt(amount) },
      memo: RandomBigInt(32),
      from_subaccount: [], // For now, using default subaccount to handle ICP
      created_at_time: [],
    });
    console.log('response', response);
  }


  const safeNFTTransfer = async () => {
    // create an actor to interact with XTC
    const actor = await window.ic.plug.createActor({ canisterId: STARVERSE_CID, interfaceFactory: ExtIDL });
    // request a transfer using this actor
    const response = await actor.transfer({
      to: { principal: Principal.from(to) },
      from: { principal: await window.ic.plug.agent.getPrincipal() },
      token: getTokenIdentifier(STARVERSE_CID, nftIndex),
      amount: BigInt(1),
      memo: new Array(32).fill(0),
      notify: false,
      subaccount: [],
    });
    console.log('response', response);
  };

  const unsafeNFTTransfer = async () => {
    // create an actor to interact with XTC
    const actor = await Actor.createActor(ExtIDL, {
      agent: window.ic.plug.agent,
      canisterId: STARVERSE_CID,
    });
    // request a transfer using this actor
    const response = await actor.transfer({
      to: { principal: Principal.from(to) },
      from: { principal: await window.ic.plug.agent.getPrincipal() },
      token: getTokenIdentifier(STARVERSE_CID, nftIndex),
      amount: BigInt(1),
      memo: new Array(32).fill(0),
      notify: false,
      subaccount: [],
    });
    console.log('response', response);
  };

  const safeNFTLock = async () => {
    // create an actor to interact with XTC
    const actor = await window.ic.plug.createActor({ canisterId: STARVERSE_CID, interfaceFactory: ExtIDL });
    // request a transfer using this actor
    const response = await actor.lock(
      getTokenIdentifier(STARVERSE_CID, nftIndex),
      BigInt(1),
      getAccountId(Principal.from(to)),
      []
    );
    console.log('response', response);
  };

  // const unsafeNFTTransfer = async () => {
  //   // create an actor to interact with XTC
  //   const actor = await Actor.createActor(ExtIDL, {
  //     agent: window.ic.plug.agent,
  //     canisterId: STARVERSE_CID,
  //   });
  //   // request a transfer using this actor
  //   const response = await actor.transfer({
  //     to: { principal: Principal.from(to) },
  //     from: { principal: await window.ic.plug.agent.getPrincipal() },
  //     token: getTokenIdentifier(STARVERSE_CID, nftIndex),
  //     amount: BigInt(1),
  //     memo: new Array(32).fill(0),
  //     notify: false,
  //     subaccount: [],
  //   });
  //   console.log('response', response);
  // };


  const safeCanisterCall = async () => {
    const actor = await window.ic.plug.createActor({ canisterId: NNS_MINTING_CID, interfaceFactory: nnsMintingDid });
    // request a transfer using this actor
    const response = await actor.transaction_notification({
      to: Principal.from(to),
      from: await window.ic.plug.agent.getPrincipal(),
      amount: { e8s: BigInt(amount * E8S_PER_ICP) },
      memo: BigInt(100),
      notify: false,
      to_subaccount: [],
      from_subaccount: [],
      block_height: BigInt(100),
    });
    console.log('response', response);
  }

  const unsafeCanisterCall = async () => {
    const actor = await Actor.createActor(nnsMintingDid, {
      agent: window.ic.plug.agent,
      canisterId: NNS_MINTING_CID,
    });
    // request a transfer using this actor
    const response = await actor.transaction_notification({
      to: Principal.from(to),
      from: await window.ic.plug.agent.getPrincipal(),
      amount: { e8s: BigInt(amount * E8S_PER_ICP) },
      memo: BigInt(100),
      notify: false,
      to_subaccount: [],
      from_subaccount: [],
      block_height: BigInt(100),
    });
    console.log('response', response);
  }

  return (
    <div className="flex column center">
      <h1>Plug Examples</h1>
      <h2>Security Example</h2>
      <div className="plug-button">
        {connected ? (<h3>{`Connected to plug ${principal}`}</h3>) : (
          <>
            <PlugConnect
              dark
              onConnectCallback={() => {
                setConnected(true)
                setPrincipal(window.ic.plug.principalId.toString())
              }} whitelist={WHITELIST}
            // timeout={5000}
            />

          </>

        )}
      </div>
      {connected && (
        <>
          <div className="flex column input-container">
            <label htmlFor="to">Recipient principal</label>
            <input name="to" type="text" onChange={handleChangeTo} value={to} />
          </div>
          <div className="flex column input-container">
            <label htmlFor="to">Amount of XTC</label>
            <input name="to" type="number" onChange={handleChangeAmount} value={amount} />
          </div>
          <div className="flex column input-container">
            <label htmlFor="to">Starverse Index</label>
            <input name="to" type="number" onChange={handleChangeIndex} value={nftIndex} />
          </div>
          <div className="security-actions-container flex column">
            <h3>Queries</h3>
            <button type="button" onClick={getMyBalance}>{`Get XTC Balance USING ACTOR`}</button>
            <button type="button" onClick={getAllBalances}>{`Get ALL Balance USING PROVIDER`}</button>

          </div>


          <div className="security-actions-container flex column">
            <h3>Safe Calls</h3>
            <button disabled={!to} type="button" onClick={requestTransfer}>{`Transfer 0,0001 ICP`}</button>
            <button disabled={!to} type="button" onClick={safeXTCTransfer}>{`Transfer ${amount} XTC (${CYCLES_PER_TC * amount} cycles)`}</button>
            <button disabled={!to} type="button" onClick={safeNFTTransfer}>{`Transfer Starverse #${nftIndex}`}</button>
            <button disabled={!to} type="button" onClick={safeNFTLock}>{`Lock Starverse #${nftIndex}`}</button>
            <button disabled={!to} type="button" onClick={safeICPTransfer}>{`Transfer ${amount} e8s`}</button>
            <button disabled={!to} type="button" onClick={safeCanisterCall}>Call NNS Minting Canister</button>
          </div>
          <div className="security-actions-container">
            <h3>Unsafe Calls</h3>
            <button disabled={!to} type="button" onClick={unsafeXTCTransfer}>{`Transfer 0.000001 XTC (1000 cycles)`}</button>
            <button disabled={!to} type="button" onClick={unsafeICPTransfer}>{`Transfer ${amount} e8s`}</button>
            <button disabled={!to} type="button" onClick={unsafeNFTTransfer}>Transfer NFT</button>
            <button disabled={!to} type="button" onClick={unsafeCanisterCall}>Call NNS Minting Canister</button>
          </div>
          <BatchTransactions />
        </>
      )}

    </div>
  );
}

export default App;
