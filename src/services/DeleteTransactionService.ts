import { getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  id: string;
}
class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transaction = transactionsRepository.findOne({ where: { id } });

    if (!transaction) {
      throw new AppError('Not find transaction with this id', 401);
    }

    await transactionsRepository.delete(id);
  }
}

export default DeleteTransactionService;
