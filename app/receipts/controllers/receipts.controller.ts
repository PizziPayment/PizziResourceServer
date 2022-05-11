import { Response, Request } from 'express';
import BasicReceipt from '../models/basic_receipt.model';
import ReceiptsRequestModel from '../models/receipts.request.model';

export async function receipts(req: Request<unknown, unknown, ReceiptsRequestModel>, res: Response<unknown, Array<BasicReceipt>>): Promise<void> {
  const body: Array<BasicReceipt> = [
    {
      receiptId: 0,
      shopName: 'steam',
      shopLogo: 'https://store.steampowered.com/favicon.ico',
      date: '18/06/2020',
      totalTtc: 20.99,
    },
    {
      receiptId: 1,
      shopName: 'steam',
      shopLogo: 'https://store.steampowered.com/favicon.ico',
      date: '28/09/2021',
      totalTtc: 12.49,
    }
  ]

  res.status(200).send(body)
}
