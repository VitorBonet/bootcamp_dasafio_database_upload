import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  type: 'outcome' | 'income' | undefined;
  value: number;
  category: string;
}
class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const categoryRepository = getRepository(Category);
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const balance = await transactionRepository.getBalance();

    if (type === 'outcome' && balance.total - value <= 0) {
      throw new AppError('This transaction is not allowed', 400);
    }

    let categoryBD = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!categoryBD) {
      categoryBD = await categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(categoryBD);
    }

    const transaction = transactionRepository.create({
      title,
      type,
      value,
      category_id: categoryBD.id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
