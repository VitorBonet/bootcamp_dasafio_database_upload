import path from 'path';
import fs from 'fs';
import csv from 'csvtojson';
import { getRepository, In } from 'typeorm';

import uploadConfig from '../config/upload';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

interface Request {
  filename: string;
}
class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[]> {
    const transactionRepository = getRepository(Transaction);
    const categoryRepository = getRepository(Category);

    const filepath = path.join(uploadConfig.directory, filename);
    const transactionsArr: CSVTransaction[] = [];
    const categoriesArr: string[] = [];

    const jsonCSV = await csv().fromFile(filepath);

    await jsonCSV.map(async row => {
      if (!row.title || !row.type || !row.value || !row.category) {
        throw new Error('File is not compatible with database.');
      }

      categoriesArr.push(row.category);
      transactionsArr.push({
        title: row.title,
        type: row.type,
        value: row.value,
        category: row.category,
      });
    });

    const existCategories = await categoryRepository.find({
      where: {
        title: In(categoriesArr),
      },
    });

    const existentCategoriesTitle = existCategories.map(
      (category: Category) => category.title,
    );

    const addCategoriesTitle = categoriesArr
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoryRepository.create(
      addCategoriesTitle.map(title => ({
        title,
      })),
    );

    await categoryRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existCategories];

    const createdTransactions = transactionRepository.create(
      transactionsArr.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);

    const fileExists = await fs.promises.stat(filepath);

    if (fileExists) {
      await fs.promises.unlink(filepath);
    }

    return createdTransactions;
  }
}

export default ImportTransactionsService;
