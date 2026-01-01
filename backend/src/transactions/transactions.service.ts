// src/transactions/transactions.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import {
  Transaction,
  TransactionDocument,
} from '../schemas/transaction.schema';
import { Part, PartDocument } from '../schemas/part.schema';
import { Bike, BikeDocument } from '../schemas/bike.schema';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,

    @InjectModel(Part.name)
    private readonly partModel: Model<PartDocument>,

    @InjectModel(Bike.name)
    private readonly bikeModel: Model<BikeDocument>,

    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  /**
   * Create a new transaction with atomic stock update
   * Supports both 'purchase' (add stock) and 'sale' (subtract stock) for parts
   * Bikes currently don't have stock management (can be extended if needed)
   */
  async create(
    createTransactionDto: CreateTransactionDto,
    userId: string,
  ): Promise<TransactionDocument> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const { type, itemType, itemId, quantity, amount } = createTransactionDto;

      let calculatedAmount = amount ?? 0;
      let item: PartDocument | BikeDocument | null = null;

      if (itemType === 'part') {
        item = await this.partModel.findById(itemId).session(session);
        if (!item) {
          throw new NotFoundException(`Part with ID ${itemId} not found`);
        }

        if (type === 'sale') {
          if (item.stockQuantity < quantity) {
            throw new BadRequestException(
              `Insufficient stock. Available: ${item.stockQuantity}, Requested: ${quantity}`,
            );
          }
          item.stockQuantity -= quantity;
        } else if (type === 'purchase') {
          item.stockQuantity += quantity;
        }

        await item.save({ session });

        // Calculate amount safely
        if (!amount) {
          if (typeof item.price !== 'number' || isNaN(item.price)) {
            throw new BadRequestException('Part price is invalid or missing');
          }
          calculatedAmount = item.price * quantity;
        }
      } else if (itemType === 'bike') {
        item = await this.bikeModel.findById(itemId).session(session);
        if (!item) {
          throw new NotFoundException(`Bike with ID ${itemId} not found`);
        }

        if (!amount) {
          if (typeof item.price !== 'number' || isNaN(item.price)) {
            throw new BadRequestException('Bike price is invalid or missing');
          }
          calculatedAmount = item.price * quantity;
        }
      }

      const transaction = new this.transactionModel({
        type,
        itemType,
        itemId,
        quantity,
        amount: calculatedAmount,
        userId,
      });

      await transaction.save({ session });

      await session.commitTransaction();
      return transaction;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
  /**
   * Get all transactions with populated references
   */
  async findAll(): Promise<TransactionDocument[]> {
    return this.transactionModel
      .find()
      .populate('itemId')
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get single transaction by ID
   */
  async findOne(id: string): Promise<TransactionDocument> {
    const transaction = await this.transactionModel
      .findById(id)
      .populate('itemId')
      .populate('userId', 'username')
      .exec();

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  /**
   * Update transaction (usually just for admin corrections)
   * Note: This does NOT reverse stock changes - use with caution
   */
  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<TransactionDocument> {
    const updated = await this.transactionModel
      .findByIdAndUpdate(id, updateTransactionDto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return updated;
  }

  /**
   * Soft or hard delete transaction
   * Note: This does NOT reverse stock changes
   */
  async remove(id: string): Promise<{ message: string }> {
    const result = await this.transactionModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return { message: 'Transaction successfully deleted' };
  }

  /**
   * Get transactions for a specific item (useful for history)
   */
  async findByItem(
    itemType: 'bike' | 'part',
    itemId: string,
  ): Promise<TransactionDocument[]> {
    return this.transactionModel
      .find({ itemType, itemId })
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get stock change history summary for a part
   */
  async getPartStockHistory(partId: string) {
    const transactions = await this.transactionModel
      .find({ itemType: 'part', itemId: partId })
      .sort({ createdAt: 1 })
      .select('type quantity amount createdAt')
      .exec();

    return transactions;
  }
}
