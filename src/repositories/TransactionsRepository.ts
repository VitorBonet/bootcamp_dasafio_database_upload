import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find({ select: ['type', 'value'] });
    const income = transactions.reduce((tot, transaction) => {
      return transaction.type === 'income' ? tot + transaction.value : tot;
    }, 0);

    const outcome = transactions.reduce((tot, transaction) => {
      return transaction.type === 'outcome' ? tot + transaction.value : tot;
    }, 0);

    const total = income - outcome;

    const balance = { income, outcome, total };
    return balance;
  }
}

export default TransactionsRepository;
