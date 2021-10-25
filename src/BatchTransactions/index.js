import { randomInt } from 'crypto';
import React from 'react';
import CoinflipIDL from '../idls/coinflip.did';

const COINFLIP_CANISTER_ID = '24pmb-qiaaa-aaaah-aannq-cai';
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
    const tripleFlip = new Array(5).fill(null).map((_, index) => FLIP_TRANSACTION(index));
    await window.ic.plug.batchTransactions(tripleFlip)
    console.log('flipped all coins!');
  };
  return (
    <div className="batch-transactions-container">
      <h2>Batch Transactions Example</h2>
      <button type="button" onClick={tripleFlipIt}>Triple Flip</button>
    </div>
  )
}
export default BatchTransactionsExample;
